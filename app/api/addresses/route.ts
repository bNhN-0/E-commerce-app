import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// GET all addresses for logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(addresses);
}

// POST create a new address
export async function POST(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { fullName, street, city, state, postalCode, country, phone } = body;

  const address = await prisma.address.create({
    data: { userId: user.id, fullName, street, city, state, postalCode, country, phone },
  });

  return NextResponse.json(address, { status: 201 });
}
