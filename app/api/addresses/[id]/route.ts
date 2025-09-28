import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Extract numeric id from the request URL (/api/addresses/:id)
function getIdFromRequest(req: Request): number {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 1] ?? "";
  const id = Number(idStr);
  return id;
}

type AddressUpdatePayload = Partial<{
  fullName: string;
  phone: string;
  street: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label: string;
}>;

// PUT /api/addresses/:id — update an address (owner-only)
export async function PUT(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const id = getIdFromRequest(req);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
  }

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as AddressUpdatePayload;

  const data: Prisma.AddressUpdateInput = {};
  if (body.fullName !== undefined) data.fullName = body.fullName;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.street !== undefined) data.street = body.street;
  if (body.city !== undefined) data.city = body.city;
  if (body.state !== undefined) data.state = body.state;
  if (body.postalCode !== undefined) data.postalCode = body.postalCode;
  if (body.country !== undefined) data.country = body.country;

  try {
    const updated = await prisma.address.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("PUT /api/addresses/:id failed", err);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// DELETE /api/addresses/:id — delete an address (owner-only)
export async function DELETE(req: Request) {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const id = getIdFromRequest(req);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
  }

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("DELETE /api/addresses/:id failed", err);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
