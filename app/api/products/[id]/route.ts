import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Handle both sync & async params across Next.js versions
type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> };
const readId = async (ctx: Ctx) => {
  const { id } = await (ctx as any).params;
  const n = Number(id);
  return Number.isFinite(n) ? n : NaN;
};

export async function GET(_req: Request, ctx: Ctx) {
  const id = await readId(ctx);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

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
        categoryId: true, // important for edit form
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: {
          select: { id: true, sku: true, price: true, stock: true, attributes: true },
          orderBy: { id: "asc" },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /products/:id failed", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

type VariantInput = { id?: number; sku: string; price?: number | null; stock?: number; attributes?: unknown };

async function updateProduct(id: number, body: any) {
  const data: Prisma.ProductUpdateInput = {};
  if (body.name !== undefined) data.name = String(body.name);
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl ?? null;
  if (body.categoryId !== undefined) {
    const cid = Number(body.categoryId);
    const cat = await prisma.category.findUnique({ where: { id: cid } });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    (data as any).category = { connect: { id: cid } };
  }

  // If no variants provided: update core fields only
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
        categoryId: true,
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // Variants provided → replace semantics (upsert + delete removed)
  const variants: VariantInput[] = body.variants;
  const createPayload: Prisma.ProductVariantCreateManyInput[] = [];
  const updatePayload: { id: number; data: Prisma.ProductVariantUpdateInput }[] = [];
  const keepIds: number[] = [];

  for (const v of variants) {
    const attrs: Prisma.InputJsonValue = (v?.attributes as any) ?? [];
    if (v?.id) {
      const vid = Number(v.id);
      keepIds.push(vid);
      updatePayload.push({
        id: vid,
        data: {
          sku: String(v.sku ?? ""),
          price: v.price == null ? null : Number(v.price),
          stock: Number(v.stock ?? 0),
          attributes: attrs,
        },
      });
    } else {
      createPayload.push({
        productId: id,
        sku: String(v.sku ?? ""),
        price: v.price == null ? null : Number(v.price),
        stock: Number(v.stock ?? 0),
        attributes: attrs,
      });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data });

    // Remove variants not listed in payload
    await tx.productVariant.deleteMany({
      where: { productId: id, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
    });

    // Upsert variants
    for (const u of updatePayload) {
      await tx.productVariant.update({ where: { id: u.id }, data: u.data });
    }
    if (createPayload.length) {
      await tx.productVariant.createMany({ data: createPayload });
    }

    return tx.product.findUnique({
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
  });

  return NextResponse.json(result);
}

// -------------------- PATCH /api/products/:id (ADMIN) --------------------
export async function PATCH(req: Request, ctx: Ctx) {
  const id = await readId(ctx);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  type VariantInput = {
    id?: number;
    sku: string;
    price?: number | null;
    stock?: number;
    attributes?: unknown;
  };

  try {
    const body = (await req.json()) as Partial<{
      name: string;
      description?: string | null;
      price?: number;
      stock?: number;
      imageUrl?: string | null;
      categoryId?: number;
      variants?: VariantInput[]; // empty array means "no variants"
    }>;

    // Build base product update data
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
      (data as any).category = { connect: { id: catId } };
    }

    // If variants not provided at all → only update core fields
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
          data: {
            sku: v.sku,
            price: v.price ?? null,
            stock: v.stock ?? 0,
            attributes: attrs,
          },
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

    // Keep the transaction SMALL and FAST; do NOT do a trailing read inside it.
    await prisma.$transaction(
      async (tx) => {
        // 1) core product fields
        if (Object.keys(data).length > 0) {
          await tx.product.update({ where: { id }, data });
        }

        // 2) remove variants that are no longer present (if variants array is empty, this deletes all)
        await tx.productVariant.deleteMany({
          where: { productId: id, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
        });

        // 3) update existing variants (parallel inside the tx)
        if (updatePayload.length) {
          await Promise.all(
            updatePayload.map((u) =>
              tx.productVariant.update({ where: { id: u.id }, data: u.data })
            )
          );
        }

        // 4) create new variants (bulk)
        if (createPayload.length) {
          await tx.productVariant.createMany({ data: createPayload });
        }
      },
      // Increase timeouts to avoid P2028 on slower DBs
      { timeout: 20000, maxWait: 10000 }
    );

    // FINAL READ **outside** the transaction
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
        variants: {
          select: { id: true, sku: true, price: true, stock: true, attributes: true },
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Unique constraint failed (e.g., duplicate SKU)" },
        { status: 409 }
      );
    }
    console.error("PATCH /products/:id failed", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}


// Support PUT as an alias (your edit page uses PUT)
export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await readId(ctx);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

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
  } catch (err) {
    console.error("DELETE /products/:id failed", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
