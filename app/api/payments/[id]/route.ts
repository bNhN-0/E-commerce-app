import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// DELETE payment method
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await prisma.paymentMethod.delete({ where: { id: parseInt(params.id) } });

  return NextResponse.json({ success: true });
}
