import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth"; // 🔑 ensures logged-in user

// GET all orders for logged-in user
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
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST → create a new order from the cart
export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const body = await req.json();
    const { addressId } = body;

    // Get cart items for user
    const cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId,
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

    // Clear cart after order
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Failed to create order:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
