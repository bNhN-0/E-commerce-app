// app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { prisma, prismaDirect } from '@/lib/prisma'; // ⬅️ import both
import { getUserSession } from '@/lib/auth';

export const runtime = 'nodejs';

// --------- DELETE /api/cart  (uses prismaDirect for interactive tx) ----------
export async function DELETE() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  try {
    const result = await prismaDirect.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
      if (!cart) {
        return { id: null, userId: user.id, totalItems: 0, totalAmount: 0, createdAt: null, items: [] };
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { totalItems: 0, totalAmount: 0 } });

      return tx.cart.findUnique({
        where: { id: cart.id },
        select: {
          id: true,
          userId: true,
          totalItems: true,
          totalAmount: true,
          createdAt: true,
          items: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              quantity: true,
              productId: true,
              variantId: true,
              product: { select: { id: true, name: true, price: true, imageUrl: true } },
              variant: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
            },
          },
        },
      });
    }, { maxWait: 5000, timeout: 15000 }); // optional timeouts

    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('DELETE /api/cart failed', err);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}

// --------- GET /api/cart (pooled client is fine here) ----------
export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  try {
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        totalItems: true,
        totalAmount: true,
        createdAt: true,
        items: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quantity: true,
            productId: true,
            variantId: true,
            product: { select: { id: true, name: true, price: true, imageUrl: true } },
            variant: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({
        id: null,
        userId: user.id,
        totalItems: 0,
        totalAmount: 0,
        createdAt: null,
        items: [],
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json(cart, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET /api/cart failed', err);
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
  }
}
