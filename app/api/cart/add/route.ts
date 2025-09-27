// app/api/cart/add/route.ts
import { NextResponse } from 'next/server';
import { prismaDirect } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  try {
    const body = await req.json();
    const productId = Number(body.productId);
    const variantId = body.variantId != null ? Number(body.variantId) : null;
    const qty = Number(body.qty ?? body.quantity ?? 1);

    if (!Number.isFinite(productId) || productId <= 0)
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
    if (!Number.isFinite(qty) || qty <= 0)
      return NextResponse.json({ error: 'qty must be > 0' }, { status: 400 });
    if (variantId !== null && !Number.isFinite(variantId))
      return NextResponse.json({ error: 'Invalid variantId' }, { status: 400 });

    const result = await prismaDirect.$transaction(async (tx) => {
      // 1) ensure cart (cheap)
      let cart = await tx.cart.findFirst({ where: { userId: user.id }, select: { id: true, totalItems: true, totalAmount: true } });
      if (!cart) cart = await tx.cart.create({ data: { userId: user.id } });

      // 2) resolve unit price in 1 query (variant overrides product)
      let unitPrice: number;
      if (variantId !== null) {
        const v = await tx.productVariant.findFirst({
          where: { id: variantId, productId },
          select: { price: true, product: { select: { price: true } } },
        });
        if (!v) throw new Error('VARIANT_NOT_FOUND');
        unitPrice = (v.price ?? v.product.price) ?? 0;
      } else {
        const p = await tx.product.findUnique({ where: { id: productId }, select: { price: true } });
        if (!p) throw new Error('PRODUCT_NOT_FOUND');
        unitPrice = p.price ?? 0;
      }

      // 3) upsert line with a read-then-create/update (null variantId prevents Prisma upsert)
      const existing = await tx.cartItem.findFirst({
        where: { cartId: cart.id, productId, variantId: variantId ?? null },
        select: { id: true, quantity: true },
      });

      let lineId: number;
      let newQuantity: number;

      if (existing) {
        const updated = await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: qty } },
          select: { id: true, quantity: true },
        });
        lineId = updated.id;
        newQuantity = updated.quantity;
      } else {
        const created = await tx.cartItem.create({
          data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity: qty },
          select: { id: true, quantity: true },
        });
        lineId = created.id;
        newQuantity = created.quantity;
      }

      // 4) update totals and return new totals directly (no full snapshot)
      const updatedCart = await tx.cart.update({
        where: { id: cart.id },
        data: {
          totalItems: { increment: qty },
          totalAmount: { increment: unitPrice * qty },
        },
        select: { id: true, totalItems: true, totalAmount: true },
      });

      return {
        ok: true,
        line: { id: lineId, productId, variantId, quantity: newQuantity },
        totals: updatedCart, // { id, totalItems, totalAmount }
      };
    });

    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    if (err?.message === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (err?.message === 'VARIANT_NOT_FOUND') {
      return NextResponse.json({ error: 'Variant not found for this product' }, { status: 400 });
    }
    console.error('POST /api/cart/add failed', err);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
