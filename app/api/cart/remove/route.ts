// app/api/cart/remove/route.ts
import { NextResponse } from 'next/server';
import { prismaDirect } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  try {
    const body = await req.json();
    const lineId = body.lineId != null ? Number(body.lineId) : undefined;
    const productId = body.productId != null ? Number(body.productId) : undefined;
    const variantId = body.variantId === null ? null : body.variantId != null ? Number(body.variantId) : undefined;

    if (!lineId && !productId) {
      return NextResponse.json({ error: 'Provide lineId or (productId[, variantId])' }, { status: 400 });
    }

    const snapshot = await prismaDirect.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
      if (!cart) throw new Error('CART_NOT_FOUND');

      const line = await tx.cartItem.findFirst({
        where: lineId
          ? { id: lineId, cart: { userId: user.id } }
          : { cartId: cart.id, productId: Number(productId), variantId: variantId ?? null },
        select: {
          id: true,
          quantity: true,
          product: { select: { price: true } },
          variant: { select: { price: true } },
        },
      });
      if (!line) throw new Error('LINE_NOT_FOUND');

      const qty = line.quantity;
      const unitPrice = (line.variant?.price ?? line.product.price) ?? 0;

      await tx.cartItem.delete({ where: { id: line.id } });

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          totalItems: { decrement: qty },
          totalAmount: { decrement: unitPrice * qty },
        },
      });

      return tx.cart.findUnique({
        where: { id: cart.id },
        select: {
          id: true, userId: true, totalItems: true, totalAmount: true, createdAt: true,
          items: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, quantity: true, productId: true, variantId: true,
              product: { select: { id: true, name: true, price: true, imageUrl: true } },
              variant: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    if (err?.message === 'CART_NOT_FOUND') return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    if (err?.message === 'LINE_NOT_FOUND') return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    console.error('POST /api/cart/remove failed', err);
    return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 });
  }
}
