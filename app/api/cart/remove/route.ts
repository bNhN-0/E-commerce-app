import { NextResponse } from "next/server";
import { prisma as prismaPooled, prismaDirect } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

type Client = typeof prismaPooled;

export async function POST(req: Request) {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const { lineId } = await req.json();
    const id = Number(lineId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid lineId" }, { status: 400 });
    }

    const runTx = async (client: Client) =>
      client.$transaction(async (tx) => {
        const line = await tx.cartItem.findUnique({
          where: { id },
          select: {
            id: true,
            cartId: true,
            productId: true,
            variantId: true,
            quantity: true,
            unitPrice: true,                 // snapshot if present
            cart: { select: { userId: true } },
          },
        });
        if (!line || line.cart.userId !== user.id) throw new Error("LINE_NOT_FOUND");

        // resolve price if snapshot missing
        let unitPrice = line.unitPrice as number | null;
        if (unitPrice == null) {
          if (line.variantId != null) {
            const v = await tx.productVariant.findUnique({
              where: { id: line.variantId },
              select: { price: true, productId: true },
            });
            if (!v || v.productId !== line.productId) throw new Error("VARIANT_NOT_FOUND");
            unitPrice = v.price ?? null;
          }
          if (unitPrice == null) {
            const p = await tx.product.findUnique({ where: { id: line.productId }, select: { price: true } });
            if (!p) throw new Error("PRODUCT_NOT_FOUND");
            unitPrice = p.price;
          }
        }

        // delete line
        await tx.cartItem.delete({ where: { id: line.id } });

        // totals: items -= 1 (distinct), amount -= unitPrice * oldQty
        const totals = await tx.cart.update({
          where: { id: line.cartId },
          data: {
            totalItems: { decrement: 1 },
            totalAmount: { decrement: unitPrice * line.quantity },
          },
          select: { id: true, totalItems: true, totalAmount: true },
        });

        return { ok: true, removed: line.id, totals, meta: { deltaLines: -1 } };
      });

    try {
      return NextResponse.json(await runTx(prismaDirect), { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json(await runTx(prismaPooled), { headers: { "Cache-Control": "no-store" } });
    }
  } catch (err: any) {
    if (err?.message === "LINE_NOT_FOUND")
      return NextResponse.json({ error: "Cart line not found" }, { status: 404 });
    if (err?.message === "PRODUCT_NOT_FOUND" || err?.message === "VARIANT_NOT_FOUND")
      return NextResponse.json({ error: "Product/Variant not found" }, { status: 400 });

    console.error("POST /api/cart/remove failed", err);
    return NextResponse.json({ error: "Failed to remove line" }, { status: 500 });
  }
}
