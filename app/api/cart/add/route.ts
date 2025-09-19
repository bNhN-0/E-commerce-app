import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

export async function POST(req: Request) {
  try {
    const { productId, quantity } = await req.json();

    let cart = await prisma.cart.findFirst({ where: { userId: USER_ID } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: USER_ID } });
    }

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
