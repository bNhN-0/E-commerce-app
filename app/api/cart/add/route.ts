// app/api/cart/add/route.ts
import { NextResponse } from "next/server";
import { prismaDirect, prisma as prismaPooled } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

type Client = typeof prismaDirect;

async function hasSnapshotColumns(client: Client): Promise<boolean> {
  // Detect if "productName" exists on CartItem in the current DB
  const rows = await client.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'CartItem'
        AND column_name = 'productName'
    ) AS "exists";
  `;
  return rows?.[0]?.exists === true;
}

export async function POST(req: Request) {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const body = await req.json();
    const productId = Number(body.productId);
    const variantId: number | null = body.variantId != null ? Number(body.variantId) : null;
    const qty = Number(body.qty ?? body.quantity ?? 1);

    if (!Number.isFinite(productId) || productId <= 0)
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    if (!Number.isFinite(qty) || qty <= 0)
      return NextResponse.json({ error: "qty must be > 0" }, { status: 400 });
    if (variantId !== null && !Number.isFinite(variantId))
      return NextResponse.json({ error: "Invalid variantId" }, { status: 400 });

    const run = async (client: Client) => {
      const useSnapshots = await hasSnapshotColumns(client);

      // 1) ensure one cart per user (Cart.userId is unique in your schema)
      let cart = await client.cart.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!cart) {
        try {
          cart = await client.cart.create({ data: { userId: user.id }, select: { id: true } });
        } catch {
          cart = await client.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
          if (!cart) throw new Error("CART_CREATE_FAILED");
        }
      }

      // 2) pricing
      const product = await client.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, price: true, imageUrl: true, currency: true },
      });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      let unitPrice = product.price;
      let variantSku: string | null = null;
      let variantAttributes: any = null;

      if (variantId !== null) {
        const variant = await client.productVariant.findFirst({
          where: { id: variantId, productId },
          select: { id: true, sku: true, price: true, attributes: true },
        });
        if (!variant) {
          return NextResponse.json({ error: "Variant not found for this product" }, { status: 400 });
        }
        variantSku = variant.sku;
        variantAttributes = variant.attributes ?? null;
        unitPrice = variant.price ?? product.price;
      }

      // 3) create-or-increment line
      let line = await client.cartItem.findFirst({
        where: { cartId: cart.id, productId, variantId: variantId ?? null },
        select: { id: true, quantity: true, productId: true, variantId: true },
      });

      if (line) {
        line = await client.cartItem.update({
          where: { id: line.id },
          data: { quantity: { increment: qty } },
          select: { id: true, quantity: true, productId: true, variantId: true },
        });
      } else {
        if (useSnapshots) {
          // DB has snapshot columns → write them
          line = await client.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              variantId,
              quantity: qty,
              productName: product.name,
              productImageUrl: product.imageUrl ?? null,
              unitPrice,
              currency: product.currency ?? "USD",
              variantSku,
              variantAttributes,
            },
            select: { id: true, quantity: true, productId: true, variantId: true },
          });
        } else {
          // DB does NOT have snapshot columns → create only base fields
          line = await client.cartItem.create({
            data: { cartId: cart.id, productId, variantId, quantity: qty } as any,
            select: { id: true, quantity: true, productId: true, variantId: true },
          });
        }
      }

      // 4) totals (sum of quantities)
      const totals = await client.cart.update({
        where: { id: cart.id },
        data: {
          totalItems: { increment: qty },
          totalAmount: { increment: unitPrice * qty },
        },
        select: { id: true, totalItems: true, totalAmount: true },
      });

      return NextResponse.json(
        { ok: true, totals, line: { ...line, unitPrice } },
        { status: 201, headers: { "Cache-Control": "no-store" } }
      );
    };

    try {
      return await run(prismaDirect);
    } catch {
      // fallback if DIRECT_URL is briefly unavailable
      return await run(prismaPooled);
    }
  } catch (err) {
    console.error("POST /api/cart/add failed", err);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
