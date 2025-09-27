import { NextResponse } from "next/server";
import { prisma as prismaPooled, prismaDirect } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

export async function DELETE() {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const run = async (client: typeof prismaPooled) =>
    client.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({ where: { userId: user.id }, select: { id: true } });
      if (!cart) {
        return {
          id: null,
          userId: user.id,
          totalItems: 0,
          totalAmount: 0,
          createdAt: null,
          items: [],
        };
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { totalItems: 0, totalAmount: 0 },
      });

      // return fresh minimal snapshot (no joins)
      return tx.cart.findUnique({
        where: { id: cart.id },
        select: {
          id: true,
          userId: true,
          totalItems: true,
          totalAmount: true,
          createdAt: true,
          items: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              quantity: true,
              productId: true,
              variantId: true,
              // snapshot fields only
              productName: true,
              productImageUrl: true,
              unitPrice: true,
              currency: true,
              variantSku: true,
              variantAttributes: true,
            },
          },
        },
      });
    });

  try {
    const result = await run(prismaDirect);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const result = await run(prismaPooled);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET() {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const cart = await prismaPooled.cart.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        totalItems: true,   // distinct lines count
        totalAmount: true,
        createdAt: true,
        items: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            quantity: true,
            productId: true,
            variantId: true,
            // snapshot-first (no product/variant joins)
            productName: true,
            productImageUrl: true,
            unitPrice: true,
            currency: true,
            variantSku: true,
            variantAttributes: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        {
          id: null,
          userId: user.id,
          totalItems: 0,
          totalAmount: 0,
          createdAt: null,
          items: [],
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(cart, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /api/cart failed", err);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}
