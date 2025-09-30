import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// POST /api/wishlist/move-to-cart
export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { productId, variantId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product required" }, { status: 400 });
    }

    // 1. Ensure cart exists
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // 2. Move item → add to cart
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
        },
      },
      update: { quantity: { increment: quantity } },
      create: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        productName: "placeholder", 
        unitPrice: 0,               
      },
    });

    // 3. Remove from wishlist
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist: { userId: user.id },
        productId,
        variantId: variantId ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ POST /wishlist/move-to-cart error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
