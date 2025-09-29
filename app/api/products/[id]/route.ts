import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { Prisma, $Enums } from "@prisma/client";

export const runtime = "nodejs";

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params?: Promise<RouteParams> };

// Helper to normalize sync/async params
async function readId(params: RouteContext["params"]): Promise<number> {
  const resolved = (await params) ?? {};
  const rawId = resolved.id;
  const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
  const n = Number(idValue);
  return Number.isFinite(n) ? n : NaN;
}

function parseStatus(s: unknown): $Enums.ProductStatus | undefined {
  if (typeof s !== "string") return undefined;
  const up = s.toUpperCase();
  return up === "ACTIVE" || up === "INACTIVE" || up === "DELETED"
    ? (up as $Enums.ProductStatus)
    : undefined;
}

// -------------------- GET /api/products/:id --------------------
export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  const id = await readId(ctx.params);
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
        status: true, // 👈 include status
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

    // Non-admins shouldn't see INACTIVE/DELETED products
    let isAdmin = false;
    try {
      const user = await getUserSession();
      isAdmin = user?.role === "ADMIN";
    } catch {
      // ignore
    }
    if (!isAdmin && product.status !== "ACTIVE") {
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
export async function PATCH(req: Request, ctx: RouteContext): Promise<Response> {
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
      status?: $Enums.ProductStatus | string; // 👈 allow status update
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

    const statusParsed = parseStatus(body.status);
    if (statusParsed) data.status = statusParsed;

    // no variants → update only core fields/status
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
          status: true,
          category: { select: { id: true, name: true, type: true } },
          media: { select: { id: true, url: true, type: true } },
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
      });
      return NextResponse.json(updated);
    }

    // with variants → upsert logic
    const variants = body.variants;
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
        status: true,
        category: { select: { id: true, name: true, type: true } },
        media: { select: { id: true, url: true, type: true } },
        variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
      },
    });

    return NextResponse.json(result);
  } catch (err) {
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
export async function PUT(req: Request, ctx: RouteContext): Promise<Response> {
  return PATCH(req, ctx);
}

// -------------------- DELETE /api/products/:id (soft delete) --------------------
export async function DELETE(_req: Request, ctx: RouteContext): Promise<Response> {
  const id = await readId(ctx.params);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }

  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Soft delete regardless of references
    const updated = await prisma.product.update({
      where: { id },
      data: { status: "DELETED" },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({
      ok: true,
      message: `Product "${updated.name}" has been removed (status: ${updated.status}).`,
    });
  } catch (err) {
    console.error("DELETE /products/:id failed", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
