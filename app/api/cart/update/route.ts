import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth"; 

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { productId, quantity } = await req.json();

    // ensure cart exists
    let cart = await prisma.cart.findFirst({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // find existing cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      if (quantity <= 0) {
        // remove if zero
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
      } else {
        // update quantity
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity },
        });
      }
    } else if (quantity > 0) {
      // create new cart item if not exists
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Cart API error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
