import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export const runtime = "nodejs";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// GET all orders for the logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: { include: { product: true } },
        address: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err: unknown) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST → create a new order from the cart
export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    // Safely parse body without using `any`
    const rawBody = (await req.json().catch(() => ({}))) as unknown;
    const addressIdInput = isRecord(rawBody) ? rawBody["addressId"] : undefined;
    const addressId =
      typeof addressIdInput === "number" || typeof addressIdInput === "string"
        ? Number(addressIdInput)
        : undefined;

    // Get cart with items for user
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total from current product prices
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          addressId: addressId ?? null,
          total,
          status: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { totalItems: 0, totalAmount: 0 },
      });

      return created;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create order:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
