import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  return NextResponse.json(user);
}

// POST new user into Prisma (called after Supabase signup)
export async function POST(req: Request) {
  const body = await req.json();
  const { id, email, name } = body;

  const user = await prisma.user.upsert({
    where: { id },
    update: {},
    create: { id, email, name, role: "customer" },
  });

  return NextResponse.json(user, { status: 201 });
}
