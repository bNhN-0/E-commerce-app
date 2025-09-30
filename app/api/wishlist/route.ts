import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// GET /api/wishlist
export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(wishlist ?? { id: null, items: [] });
  } catch (error) {
    console.error("❌ GET /wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/wishlist
export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { productId, variantId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product required" }, { status: 400 });
    }

    // Ensure wishlist exists
    const wishlist = await prisma.wishlist.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Add item with compound unique
    const item = await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId_variantId: {
          wishlistId: wishlist.id,
          productId,
          variantId: variantId ?? null,
        },
      },
      update: {}, 
      create: {
        wishlistId: wishlist.id,
        productId,
        variantId: variantId ?? null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("❌ POST /wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/wishlist/remove
export async function DELETE(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { productId, variantId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product required" }, { status: 400 });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist: { userId: user.id },
        productId,
        variantId: variantId ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE /wishlist error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}