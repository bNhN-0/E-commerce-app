import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { productId, quantity } = await req.json();

    // Ensure cart exists
    let cart = await prisma.cart.findFirst({ where: { userId: user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.id } });
    }

    // Check if product is already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to Cart API error:", error);
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}
