import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// PUT update address
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const updated = await prisma.address.update({
    where: { id: parseInt(params.id) },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE address
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await prisma.address.delete({ where: { id: parseInt(params.id) } });

  return NextResponse.json({ success: true });
}
