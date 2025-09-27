import { NextResponse } from "next/server";
import { prisma, prismaDirect } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const { lineId } = await req.json();
    const lineID = Number(lineId);
    if (!Number.isFinite(lineID) || lineID <= 0) {
      return NextResponse.json({ error: "Invalid lineId" }, { status: 400 });
    }

    const runTx = async (client: typeof prisma) =>
      client.$transaction(async (tx) => {
        // load line and guard ownership
        const line = await tx.cartItem.findUnique({
          where: { id: lineID },
          select: {
            id: true,
            cartId: true,
            productId: true,
            variantId: true,
            quantity: true,
            cart: { select: { id: true, userId: true } },
          },
        });
        if (!line || line.cart.userId !== user.id) {
          throw new Error("LINE_NOT_FOUND");
        }

        // unit price (snapshot preferred if present)
        let unitPrice: number | null = null;
        // unitPrice = line.unitPrice ?? null;

        if (unitPrice == null) {
          if (line.variantId != null) {
            const v = await tx.productVariant.findUnique({
              where: { id: line.variantId },
              select: { price: true, productId: true },
            });
            if (!v || v.productId !== line.productId) throw new Error("VARIANT_NOT_FOUND");
            if (v.price != null) unitPrice = v.price;
          }
          if (unitPrice == null) {
            const p = await tx.product.findUnique({
              where: { id: line.productId },
              select: { price: true },
            });
            if (!p) throw new Error("PRODUCT_NOT_FOUND");
            unitPrice = p.price;
          }
        }

        await tx.cartItem.delete({ where: { id: line.id } });

        const totals = await tx.cart.update({
          where: { id: line.cartId },
          data: {
            totalItems: { decrement: line.quantity },
            totalAmount: { decrement: unitPrice * line.quantity },
          },
          select: { id: true, totalItems: true, totalAmount: true },
        });

        return { totals, removed: line.id };
      });

    let result;
    try {
      result = await runTx(prismaDirect);
    } catch (e: any) {
      if (e?.code === "P1001" || String(e?.message || "").includes("Can't reach database")) {
        result = await runTx(prisma);
      } else {
        throw e;
      }
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    if (err?.message === "LINE_NOT_FOUND") {
      return NextResponse.json({ error: "Cart line not found" }, { status: 404 });
    }
    if (err?.message === "PRODUCT_NOT_FOUND" || err?.message === "VARIANT_NOT_FOUND") {
      return NextResponse.json({ error: "Product/Variant not found" }, { status: 400 });
    }
    console.error("POST /api/cart/remove failed", err);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
