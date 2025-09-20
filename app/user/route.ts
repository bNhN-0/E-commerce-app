import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

//  GET: current logged-in user
export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  return NextResponse.json(user);
}

// ✅ POST: create user in Prisma after signup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("➡️ Incoming signup sync request:", body);

    const { id, email, name } = body;
    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name }, // allow updating name later
      create: { id, email, name, role: "customer" },
    });

    console.log("✅ User inserted/updated in Prisma:", user);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("❌ Error syncing user with Prisma:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
