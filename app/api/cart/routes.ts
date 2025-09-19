import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user"; // hardcoded for now

export async function GET() {
  try {
    const cart = await prisma.cart.findFirst({
      where: { userId: USER_ID },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Always return at least an empty cart
    return NextResponse.json(cart || { id: null, items: [] });
  } catch (error) {
    console.error("Cart API error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}
