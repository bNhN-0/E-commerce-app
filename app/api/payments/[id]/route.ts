// app/api/payments/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// DELETE /api/payments/:id
export async function DELETE(req: Request): Promise<Response> {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // extract ID from URL
  const url = new URL(req.url);
  const id = Number(url.pathname.split("/").pop());

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
  }

  try {
    await prisma.paymentMethod.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /api/payments/:id failed", err);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
