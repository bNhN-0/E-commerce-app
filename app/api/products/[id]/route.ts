import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// helper: normalize sync/async params
async function readId(
  paramsOrPromise: { id: string } | Promise<{ id: string }>
): Promise<number> {
  const { id } = await Promise.resolve(paramsOrPromise);
  const n = Number(id);
  return Number.isFinite(n) ? n : NaN;
}

// -------------------- GET /api/products/:id --------------------
export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
): Promise<Response> {
  // Always await params (sync or async)
  const { id: rawId } = await Promise.resolve(ctx.params);
  const id = Number(rawId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
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
        categoryId: true,
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: {
          select: { id: true, sku: true, price: true, stock: true, attributes: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /products/:id failed", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

type VariantInput = {
  id?: number;
  sku: string;
  price?: number | null;
  stock?: number;
  attributes?: unknown;
};

// -------------------- PATCH /api/products/:id (ADMIN) --------------------
export async function PATCH(
  req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
): Promise<Response> {
  const id = await readId(ctx.params);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await req.json()) as Partial<{
      name: string;
      description?: string | null;
      price?: number;
      stock?: number;
      imageUrl?: string | null;
      categoryId?: number;
      variants?: VariantInput[];
    }>;

    const data: Prisma.ProductUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = body.price;
    if (body.stock !== undefined) data.stock = body.stock;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.categoryId !== undefined) {
      const catId = Number(body.categoryId);
      const cat = await prisma.category.findUnique({ where: { id: catId } });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      data.category = { connect: { id: catId } };
    }

    // no variants → update only core fields
    if (!Array.isArray(body.variants)) {
      const updated = await prisma.product.update({
        where: { id },
        data,
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
          category: { select: { id: true, name: true, type: true } },
          media: { select: { id: true, url: true, type: true } },
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
      });
      return NextResponse.json(updated);
    }

    // with variants → upsert logic
    const variants = body.variants as VariantInput[];
    const createPayload: Prisma.ProductVariantCreateManyInput[] = [];
    const updatePayload: { id: number; data: Prisma.ProductVariantUpdateInput }[] = [];
    const keepIds: number[] = [];

    for (const v of variants) {
      const attrs: Prisma.InputJsonValue = (v.attributes as Prisma.InputJsonValue) ?? {};
      if (v.id) {
        const vid = Number(v.id);
        keepIds.push(vid);
        updatePayload.push({
          id: vid,
          data: { sku: v.sku, price: v.price ?? null, stock: v.stock ?? 0, attributes: attrs },
        });
      } else {
        createPayload.push({
          productId: id,
          sku: v.sku,
          price: v.price ?? null,
          stock: v.stock ?? 0,
          attributes: attrs,
        });
      }
    }

    await prisma.$transaction(
      async (tx) => {
        if (Object.keys(data).length > 0) {
          await tx.product.update({ where: { id }, data });
        }
        await tx.productVariant.deleteMany({
          where: { productId: id, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
        });
        if (updatePayload.length) {
          await Promise.all(
            updatePayload.map((u) =>
              tx.productVariant.update({ where: { id: u.id }, data: u.data })
            )
          );
        }
        if (createPayload.length) {
          await tx.productVariant.createMany({ data: createPayload });
        }
      },
      { timeout: 20_000, maxWait: 10_000 }
    );

    const result = await prisma.product.findUnique({
      where: { id },
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
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
      },
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Unique constraint failed (e.g., duplicate SKU)" },
        { status: 409 }
      );
    }
    console.error("PATCH /products/:id failed", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// -------------------- PUT alias --------------------
export async function PUT(
  req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
): Promise<Response> {
  return PATCH(req, ctx);
}

// -------------------- DELETE /api/products/:id --------------------
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
): Promise<Response> {
  const id = await readId(ctx.params);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [inCarts, inOrders, inWishlists, reviews] = await Promise.all([
      prisma.cartItem.count({ where: { productId: id } }),
      prisma.orderItem.count({ where: { productId: id } }),
      prisma.wishlistItem.count({ where: { productId: id } }),
      prisma.review.count({ where: { productId: id } }),
    ]);

    if (inCarts + inOrders + inWishlists + reviews > 0) {
      return NextResponse.json(
        {
          error: "Product is referenced and cannot be deleted",
          references: { inCarts, inOrders, inWishlists, reviews },
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.productMedia.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /products/:id failed", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
