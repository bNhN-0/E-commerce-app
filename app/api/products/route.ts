import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// ---------------------- GET /api/products ----------------------
// Query params:
//   page, limit
//   category / categoryId
//   search
//   sort = new | price_asc | price_desc | rating | best
//   days (for sort=best; default 30)
//   scope=admin & status=ACTIVE|INACTIVE|DELETED  (admin only)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const skip = (page - 1) * limit;

    // Filters & sorting
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

    const scope = searchParams.get("scope"); // "admin" enables admin behavior
    const statusParam = searchParams.get("status"); // ACTIVE | INACTIVE | DELETED
    const days = Math.max(parseInt(searchParams.get("days") ?? "30", 10) || 30, 1);

    // Read user (ok if unauthenticated)
    let isAdminScope = false;
    try {
      const user = await getUserSession();
      isAdminScope = scope === "admin" && user?.role === "ADMIN";
    } catch {
      isAdminScope = false;
    }

    // Status parsing (keep local to avoid client enum drift)
    type LocalStatus = "ACTIVE" | "INACTIVE" | "DELETED";
    const parseStatus = (s: string | null | undefined): LocalStatus | undefined => {
      const up = (s ?? "").toUpperCase();
      return up === "ACTIVE" || up === "INACTIVE" || up === "DELETED" ? (up as LocalStatus) : undefined;
    };

    // Storefront: always ACTIVE. Admin: use provided status (or no filter if omitted).
    const statusForWhere: LocalStatus | undefined = isAdminScope ? parseStatus(statusParam) : "ACTIVE";

    // Base where (cast at call site to tolerate slightly stale client types)
    const whereCore: Record<string, unknown> = {};
    if (statusForWhere) whereCore.status = statusForWhere;
    if (categoryId) whereCore.categoryId = categoryId;
    else if (categoryName) {
      whereCore.category = { name: { equals: categoryName, mode: "insensitive" } };
    }
    if (q) {
      whereCore.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Shared include (relations only; scalars like status are auto-included with include)
    const productInclude = {
      category: { select: { id: true, name: true, type: true } },
      variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
    } as const;

    // ---------------- BEST SELLERS (real sales in last N days) ----------------
    if (sort === "best") {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Aggregate sold quantity/revenue per product in the window for fulfilled orders
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
        take: Math.max(limit * 3, limit), // oversample to allow later filtering
      });

      const productIds = agg.map((a) => a.productId);

      // If no sales in window → graceful fallback to "new"
      if (productIds.length === 0) {
        const [items, total] = await Promise.all([
          prisma.product.findMany({
            skip,
            take: limit,
            where: whereCore as Prisma.ProductWhereInput,
            orderBy: [{ createdAt: "desc" }],
            include: productInclude,
          }),
          prisma.product.count({ where: whereCore as Prisma.ProductWhereInput }),
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
            meta: { sort: "best", days, note: "fallback:no-sales" as const },
          },
          cacheHdr()
        );
      }

      // Prepare quick lookup for sold quantity
      const soldMap = new Map<number, number>();
      for (const row of agg) soldMap.set(row.productId, row._sum.quantity ?? 0);

      // Fetch product details for those IDs with visibility rules
      const bestWhere: Record<string, unknown> = {
        ...whereCore,
        id: { in: productIds },
      };
      if (!isAdminScope) {
        // On storefront, ensure showable (ACTIVE and in-stock)
        bestWhere.status = "ACTIVE";
        bestWhere.stock = { gt: 0 };
      }

      const products = await prisma.product.findMany({
        where: bestWhere as Prisma.ProductWhereInput,
        include: productInclude,
      });

      // Rank by sold units desc, then by revenue desc, then by recency
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
            // helpful for admin/debug displays
            soldLastNDays: soldMap.get(g.productId) ?? 0,
          };
        });

      return NextResponse.json(
        {
          data: ranked,
          pagination: { page: 1, limit, total: ranked.length, totalPages: 1 },
          scope: isAdminScope ? "admin" : "public",
          meta: { sort: "best", days },
        },
        cacheHdr(300, 900) // best-sellers cache: 5m/15m
      );
    }

    // ---------------- Regular listings ----------------
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
        where: whereCore as Prisma.ProductWhereInput,
        orderBy,
        include: productInclude,
      }),
      prisma.product.count({ where: whereCore as Prisma.ProductWhereInput }),
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ---------------------- POST /api/products (ADMIN) ----------------------
type VariantInput = {
  sku: string;
  price?: number | null;
  stock?: number;
  attributes?: unknown; // stored as JSON in Prisma
};

type CreateProductBody = {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId: number;
  variants?: VariantInput[];
  // status?: "ACTIVE" | "INACTIVE" | "DELETED"
};

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json()) as Partial<CreateProductBody>;
    const {
      name,
      description = null,
      price,
      stock,
      imageUrl = null,
      categoryId,
      variants,
      // status,
    } = body;

    const cid = Number(categoryId);
    if (!cid || !Number.isFinite(cid)) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    if (!Number.isFinite(Number(stock)) || Number(stock) < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }

    const cat = await prisma.category.findUnique({ where: { id: cid } });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description,
        price: Number(price),
        stock: Number(stock),
        imageUrl,
        categoryId: cid,
        // status: status as LocalStatus | undefined,
        variants:
          Array.isArray(variants) && variants.length > 0
            ? {
                create: variants.map((v) => ({
                  sku: v.sku,
                  price: v.price ?? null,
                  stock: v.stock ?? 0,
                  attributes: (v.attributes as Prisma.InputJsonValue) ?? {},
                })),
              }
            : undefined,
        averageRating: 0,
        reviewCount: 0,
      },
      include: {
        category: { select: { id: true, name: true, type: true } },
        variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

function cacheHdr(sMaxAge = 60, swr = 300) {
  return {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`,
    },
  };
}
