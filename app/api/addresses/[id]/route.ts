import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Support both sync and async params across Next versions
type Ctx = { params: { id: string } } | { params: Promise<{ id: string }> };

const isPromiseLike = (v: unknown): v is Promise<unknown> =>
  typeof v === "object" && v !== null && typeof (v as { then?: unknown }).then === "function";

async function readId(ctx: Ctx): Promise<number> {
  const p = (ctx as { params: unknown }).params;
  const params = isPromiseLike(p) ? await p : p;
  if (
    typeof params !== "object" ||
    params === null ||
    typeof (params as { id?: unknown }).id !== "string"
  ) {
    throw new Error("Invalid params: missing id");
  }
  const n = Number((params as { id: string }).id);
  return n;
}

// PUT update address
export async function PUT(req: Request, ctx: Ctx) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const id = await readId(ctx);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
  }

  // Ensure the address belongs to the current user
  const owner = await prisma.address.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owner || owner.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const data = bodyUnknown as Prisma.AddressUpdateInput;

  const updated = await prisma.address.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE address
export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const id = await readId(ctx);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
  }

  // Ensure the address belongs to the current user
  const owner = await prisma.address.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owner || owner.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
