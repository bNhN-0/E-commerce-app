// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

type Params = { params: { id: string } };

// -------------------- GET /api/products/:id --------------------
export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
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
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            stock: true,
            attributes: true, // JSON read is fine
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('GET /products/:id failed', err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// -------------------- PATCH /api/products/:id (ADMIN) --------------------
export async function PATCH(req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  type VariantInput = {
    id?: number;
    sku: string;
    price?: number | null;
    stock?: number;
    attributes?: unknown; // can be object/array/primitive/null
  };

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
      const cat = await prisma.category.findUnique({ where: { id: Number(body.categoryId) } });
      if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      (data as any).category = { connect: { id: Number(body.categoryId) } };
    }

    // If no variants provided, just update core fields
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

    // Variants provided: replace semantics (upsert + delete removed)
    const variants = body.variants as VariantInput[];
    const createPayload: Prisma.ProductVariantCreateManyInput[] = [];
    const updatePayload: { id: number; data: Prisma.ProductVariantUpdateInput }[] = [];
    const keepIds: number[] = [];

    for (const v of variants) {
      // ✅ Ensure Prisma-compatible JSON input
      const attrs: Prisma.InputJsonValue =
        (v.attributes as Prisma.InputJsonValue) ?? {}; // default to {}

      if (v.id) {
        keepIds.push(Number(v.id));
        updatePayload.push({
          id: Number(v.id),
          data: {
            sku: v.sku,
            price: v.price ?? null,
            stock: v.stock ?? 0,
            attributes: attrs, // <-- typed as Prisma.InputJsonValue
          },
        });
      } else {
        createPayload.push({
          productId: id,
          sku: v.sku,
          price: v.price ?? null,
          stock: v.stock ?? 0,
          attributes: attrs, // <-- typed as Prisma.InputJsonValue
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      // Delete removed variants
      await tx.productVariant.deleteMany({
        where: {
          productId: id,
          ...(keepIds.length ? { id: { notIn: keepIds } } : {}), // if empty, delete all
        },
      });

      // Update existing
      for (const u of updatePayload) {
        await tx.productVariant.update({
          where: { id: u.id },
          data: u.data,
        });
      }

      // Create new
      if (createPayload.length) {
        await tx.productVariant.createMany({ data: createPayload });
      }

      // Return fresh product
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
          category: { select: { id: true, name: true, type: true } },
          media: { select: { id: true, url: true, type: true } },
          variants: {
            select: { id: true, sku: true, price: true, stock: true, attributes: true },
            orderBy: { id: 'asc' },
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint failed (e.g., duplicate SKU)' }, { status: 409 });
    }
    console.error('PATCH /products/:id failed', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// -------------------- DELETE /api/products/:id (ADMIN) --------------------
export async function DELETE(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [inCarts, inOrders, inWishlists, reviews] = await Promise.all([
      prisma.cartItem.count({ where: { productId: id } }),
      prisma.orderItem.count({ where: { productId: id } }),
      prisma.wishlistItem.count({ where: { productId: id } }),
      prisma.review.count({ where: { productId: id } }),
    ]);

    const refs = inCarts + inOrders + inWishlists + reviews;
    if (refs > 0) {
      return NextResponse.json(
        {
          error: 'Product is referenced and cannot be deleted',
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
    console.error('DELETE /products/:id failed', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
