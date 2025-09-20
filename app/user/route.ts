import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// 🔹 GET logged-in user (Profile page uses this)
export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 }); // ✅ always return JSON
    }
    return NextResponse.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// 🔹 POST sync user from Supabase (signup flow)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name } = body;

    if (!id || !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { id },
      update: { name }, // can update name later
      create: { id, email, name, role: "CUSTOMER" },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error syncing user:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// 🔹 PUT update profile (name, phone)
export async function PUT(req: Request) {
  try {
    const sessionUser = await getUserSession();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name, phone },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating user:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
