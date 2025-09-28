import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// GET /api/payments — all payment methods for logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const payments = await prisma.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/payments — add a new payment method
export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await req.json()) as {
    type: string;
    provider: string;
    last4: string;
  };

  const payment = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      type: body.type,
      provider: body.provider,
      last4: body.last4,
    },
  });

  return NextResponse.json(payment, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
