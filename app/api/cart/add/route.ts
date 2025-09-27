import { NextResponse } from "next/server";
import { prismaDirect, prisma as prismaPooled } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

type Client = typeof prismaDirect;

// cache the snapshot-columns probe so it runs only once
let SNAPSHOT_SUPPORTED: boolean | null = null;

async function hasSnapshotColumns(client: Client): Promise<boolean> {
  if (SNAPSHOT_SUPPORTED !== null) return SNAPSHOT_SUPPORTED;
  try {
    const rows = await client.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'CartItem'
          AND column_name = 'productName'
      ) AS "exists";
    `;
    SNAPSHOT_SUPPORTED = rows?.[0]?.exists === true;
  } catch {
    SNAPSHOT_SUPPORTED = false;
  }
  return SNAPSHOT_SUPPORTED!;
}

async function runAdd(req: Request, client: Client) {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

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

  const useSnapshots = await hasSnapshotColumns(client);

  // 1) ensure single cart per user
  let cart = await client.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
  if (!cart) {
    try {
      cart = await client.cart.create({ data: { userId: user.id }, select: { id: true } });
    } catch {
      // race: someone else created it
      cart = await client.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
      if (!cart) return NextResponse.json({ error: "CART_CREATE_FAILED" }, { status: 500 });
    }
  }

  // 2) product (base price/name/image/currency)
  const product = await client.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, price: true, imageUrl: true, currency: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // 3) variant (optional) → override price/sku/attrs
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

  // 4) find existing line
  let createdNewLine = false;
  let line = await client.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
    select: { id: true, quantity: true, productId: true, variantId: true },
  });

  // 5) create or increment
  if (line) {
    line = await client.cartItem.update({
      where: { id: line.id },
      data: { quantity: { increment: qty } },
      select: { id: true, quantity: true, productId: true, variantId: true },
    });
  } else {
    createdNewLine = true;
    if (useSnapshots) {
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
      // legacy DB without snapshot columns
      line = await client.cartItem.create({
        data: { cartId: cart.id, productId, variantId, quantity: qty } as any,
        select: { id: true, quantity: true, productId: true, variantId: true },
      });
    }
  }

  // 6) update totals (distinct-products semantics)
  const amountDelta = unitPrice * qty;
  const totals = await client.cart.update({
    where: { id: cart.id },
    data: {
      ...(createdNewLine ? { totalItems: { increment: 1 } } : {}), 
      totalAmount: { increment: amountDelta },
    },
    select: { id: true, totalItems: true, totalAmount: true },
  });

  // 7) respond
  return NextResponse.json(
    { ok: true, totals, line: { ...line, unitPrice }, meta: { wasNewLine: createdNewLine } },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  try {
    try {
      return await runAdd(req, prismaDirect);
    } catch {
      return await runAdd(req, prismaPooled);
    }
  } catch (err) {
    console.error("POST /api/cart/add failed", err);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
