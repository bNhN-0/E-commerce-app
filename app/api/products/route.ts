import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { Prisma, $Enums } from "@prisma/client"; // ⬅️ $Enums added

export const runtime = "nodejs";

// ---------------------- GET /api/products ----------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);
    const skip = (page - 1) * limit;

    const categoryName = searchParams.get("category") ?? undefined;
    const categoryIdRaw = searchParams.get("categoryId");
    const categoryId = categoryIdRaw ? Number(categoryIdRaw) : undefined;
    const search = searchParams.get("search") ?? undefined;
    const sort = (searchParams.get("sort") ?? "new") as
      | "new"
      | "price_asc"
      | "price_desc"
      | "rating";

    // Admin scope & optional status filter
    const scope = searchParams.get("scope");      // "admin" enables admin behavior
    const statusParam = searchParams.get("status"); // ACTIVE | INACTIVE | DELETED

    const parseStatus = (
      s: string | null | undefined
    ): $Enums.ProductStatus | undefined => {
      switch ((s ?? "").toUpperCase()) {
        case "ACTIVE":
          return "ACTIVE";
        case "INACTIVE":
          return "INACTIVE";
        case "DELETED":
          return "DELETED";
        default:
          return undefined;
      }
    };

    // Try to read user (ok if unauthenticated)
    let userRole: "ADMIN" | "CUSTOMER" | undefined;
    try {
      const user = await getUserSession();
      userRole = user?.role;
    } catch {
      userRole = undefined;
    }

    const isAdminScope = scope === "admin" && userRole === "ADMIN";

    // Storefront: always ACTIVE
    // Admin: filter by provided status; if none provided, show all (omit filter)
    const statusForWhere: $Enums.ProductStatus | undefined = isAdminScope
      ? parseStatus(statusParam)
      : "ACTIVE";

    const where: Prisma.ProductWhereInput = {
      ...(statusForWhere ? { status: statusForWhere } : {}), // ✅ enum, not { equals: string }
      ...(categoryId
        ? { categoryId }
        : categoryName
        ? { category: { name: { equals: categoryName, mode: "insensitive" } } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

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
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          imageUrl: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
          status: true, // expose status (useful for admin)
          category: { select: { id: true, name: true, type: true } },
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
      }),
      prisma.product.count({ where }),
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
        appliedStatus: statusForWhere ?? "ALL",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: unknown) {
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
  // status?: "ACTIVE" | "INACTIVE" | "DELETED"  // optional if you want to allow on create
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
      // status, // (optional) you can wire this if you want admins to set non-ACTIVE on create
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
        // status: status ?? undefined,
        variants:
          Array.isArray(variants) && variants.length > 0
            ? {
                create: variants.map((v: VariantInput) => ({
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
      select: {
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
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
