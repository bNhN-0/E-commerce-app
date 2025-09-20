import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name }, // allow updating name later
      create: { id, email, name, role: "customer" },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(" Error syncing user:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
