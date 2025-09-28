import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// GET /api/addresses — all addresses for logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addresses, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/addresses — create new address
export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await req.json()) as {
    fullName: string;
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };

  const address = await prisma.address.create({
    data: {
      userId: user.id,
      fullName: body.fullName,
      street: body.street,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country,
      phone: body.phone,
    },
  });

  return NextResponse.json(address, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
