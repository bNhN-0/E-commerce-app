import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// ---------------------- GET /api/products ----------------------
// Supports:
//   sort = new | price_asc | price_desc | rating | best
//   days = integer (for best)  default 30
//   limit/page = pagination (best ignores page; uses limit)
//   scope=admin & status=ACTIVE|INACTIVE|DELETED (admin only)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Common params
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const skip = (page - 1) * limit;

    const categoryName = searchParams.get("category") ?? undefined;
    const categoryIdRaw = searchParams.get("categoryId");
    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
    const q = searchParams.get("search") ?? undefined;
    const sort = (searchParams.get("sort") ?? "new") as
      | "new"
      | "price_asc"
      | "price_desc"
      | "rating"
      | "best";

    const scope = searchParams.get("scope");             // "admin" enables admin behavior
    const statusParam = searchParams.get("status");      // ACTIVE | INACTIVE | DELETED (admin)
    const days = Math.max(parseInt(searchParams.get("days") ?? "30", 10) || 30, 1);

    // Try to read user (ok if unauthenticated)
    let isAdminScope = false;
    try {
      const user = await getUserSession();
      isAdminScope = scope === "admin" && user?.role === "ADMIN";
    } catch {
      isAdminScope = false;
    }

    // Parse status for admin scope; storefront always ACTIVE
    const parseStatus = (s: string | null | undefined):
      | "ACTIVE"
      | "INACTIVE"
      | "DELETED"
      | undefined => {
      switch ((s ?? "").toUpperCase()) {
        case "ACTIVE":
        case "INACTIVE":
        case "DELETED":
          return s!.toUpperCase() as "ACTIVE" | "INACTIVE" | "DELETED";
        default:
          return undefined;
      }
    };

    const statusForWhere = isAdminScope ? parseStatus(statusParam) : "ACTIVE";

    // Shared filters (used for non-best, and again when fetching best)
    const baseWhere: Prisma.ProductWhereInput = {
      ...(statusForWhere ? { status: statusForWhere } : {}), // admin without status => no status filter
      ...(categoryId
        ? { categoryId }
        : categoryName
        ? { category: { name: { equals: categoryName, mode: "insensitive" } } }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // --------- BEST SELLERS branch (real sales in last N days) ---------
    if (sort === "best") {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Aggregate order items by productId for paid/fulfilled orders in window
      // (We pull a bit more than 'limit' to have room after stock/status filtering)
      const agg = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: {
            status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
            createdAt: { gte: since },
          },
        },
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: Math.max(limit * 3, limit), // oversample
      });

      const productIds = agg.map((a) => a.productId);
      if (productIds.length === 0) {
        // No sales in the window → graceful fallback to "new" listing
        const [items, total] = await Promise.all([
          prisma.product.findMany({
            skip,
            take: limit,
            where: baseWhere,
            orderBy: [{ createdAt: "desc" }],
            select: productSelect,
          }),
          prisma.product.count({ where: baseWhere }),
        ]);

        return NextResponse.json(
          {
            data: items,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
            scope: isAdminScope ? "admin" : "public",
            meta: { sort: "best", days, note: "fallback:no-sales" },
          },
          cacheHdr()
        );
      }

      // Map productId -> sold units in window
      const soldMap = new Map<number, number>();
      for (const row of agg) {
        soldMap.set(row.productId, (row._sum.quantity ?? 0));
      }

      // Fetch products for those IDs, apply storefront visibility (ACTIVE, in-stock) unless admin
      const productWhere: Prisma.ProductWhereInput = {
        ...baseWhere,
        id: { in: productIds },
        ...(isAdminScope ? {} : { stock: { gt: 0 }, status: "ACTIVE" }),
      };

      const products = await prisma.product.findMany({
        where: productWhere,
        select: productSelect,
      });

      // Rank by sold units (desc), then by revenue, then by createdAt
      const byId = new Map(products.map((p) => [p.id, p]));
      const ranked = agg
        .filter((a) => byId.has(a.productId))
        .sort((a, b) => {
          const qa = a._sum.quantity ?? 0;
          const qb = b._sum.quantity ?? 0;
          if (qb !== qa) return qb - qa;
          const ra = a._sum.price ?? 0;
          const rb = b._sum.price ?? 0;
          if (rb !== ra) return rb - ra;
          const pa = byId.get(a.productId)!;
          const pb = byId.get(b.productId)!;
          return (pb.createdAt?.valueOf() ?? 0) - (pa.createdAt?.valueOf() ?? 0);
        })
        .slice(0, limit)
        .map((g) => {
          const p = byId.get(g.productId)!;
          return {
            ...p,
            soldLastNDays: soldMap.get(g.productId) ?? 0,
          };
        });

      return NextResponse.json(
        {
          data: ranked,
          pagination: {
            page: 1,            // best is not paginated; we return top N
            limit,
            total: ranked.length,
            totalPages: 1,
          },
          scope: isAdminScope ? "admin" : "public",
          meta: { sort: "best", days },
        },
        cacheHdr(300, 900) // cache best-sellers a bit longer (5m/15m)
      );
    }

    // --------- Regular listing branch ---------
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "price_asc"
        ? [{ price: "asc" }]
        : sort === "price_desc"
        ? [{ price: "desc" }]
        : sort === "rating"
        ? [{ averageRating: "desc" }, { reviewCount: "desc" }]
        : [{ createdAt: "desc" }];

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where: baseWhere,
        orderBy,
        select: productSelect,
      }),
      prisma.product.count({ where: baseWhere }),
    ]);

    return NextResponse.json(
      {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        scope: isAdminScope ? "admin" : "public",
        meta: { sort },
      },
      cacheHdr()
    );
  } catch (error: unknown) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}


const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  status: true,
  category: { select: { id: true, name: true, type: true } },
  variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
} satisfies Prisma.ProductSelect;

// Cache headers helper
function cacheHdr(sMaxAge = 60, swr = 300) {
  return {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
    },
  };
}
