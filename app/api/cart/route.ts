import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_ID = "demo-user";

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

    //  Always return a JSON object, even if cart is empty
    return NextResponse.json(cart || { id: null, items: [] });
  } catch (error) {
    console.error("Cart API error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}
