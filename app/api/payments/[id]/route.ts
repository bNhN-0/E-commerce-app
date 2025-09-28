import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

function getIdFromRequest(req: Request): number {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return Number(parts[parts.length - 1] ?? "");
}

// DELETE /api/payments/:id
export async function DELETE(req: Request) {
  const user = await getUserSession();
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const id = getIdFromRequest(req);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid payment id" }, { status: 400 });
  }

  try {
    await prisma.paymentMethod.delete({ where: { id } });
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("❌ DELETE /api/payments/:id failed", err);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
