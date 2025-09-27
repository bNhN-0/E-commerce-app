// app/api/cart/update/route.ts
import { NextResponse } from "next/server";
import { prisma, prismaDirect } from "@/lib/prisma";
import { getUserSessionLite } from "@/lib/auth-lite";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const user = await getUserSessionLite();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const { lineId, qty } = await req.json();
    const newQty = Number(qty);
    const lineID = Number(lineId);

    if (!Number.isFinite(lineID) || lineID <= 0)
      return NextResponse.json({ error: "Invalid lineId" }, { status: 400 });
    if (!Number.isFinite(newQty) || newQty < 0)
      return NextResponse.json({ error: "qty must be >= 0" }, { status: 400 });

    const runTx = async (client: typeof prisma) =>
      client.$transaction(async (tx) => {
        const line = await tx.cartItem.findUnique({
          where: { id: lineID },
          select: {
            id: true,
            cartId: true,
            productId: true,
            variantId: true,
            quantity: true,
            unitPrice: true, 
            cart: { select: { id: true, userId: true } },
          },
        });
        if (!line || line.cart.userId !== user.id) throw new Error("LINE_NOT_FOUND");

        let unitPrice: number | null = line.unitPrice ?? null;

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

        const oldQty = line.quantity;

        // No change
        if (newQty === oldQty) {
          const totals = await tx.cart.findUnique({
            where: { id: line.cartId },
            select: { id: true, totalItems: true, totalAmount: true },
          });
          return { totals };
        }

        if (newQty === 0) {
          await tx.cartItem.delete({ where: { id: line.id } });

          const amountDelta = unitPrice * oldQty; 
          const totals = await tx.cart.update({
            where: { id: line.cartId },
            data: {
              totalItems: { decrement: 1 }, 
              totalAmount: { decrement: amountDelta },
            },
            select: { id: true, totalItems: true, totalAmount: true },
          });

          return { totals, removed: line.id };
        }

        const deltaQty = newQty - oldQty;
        await tx.cartItem.update({
          where: { id: line.id },
          data: { quantity: newQty },
        });

        const amountDelta = unitPrice * deltaQty;
        const totals = await tx.cart.update({
          where: { id: line.cartId },
          data:
            amountDelta >= 0
              ? { totalAmount: { increment: amountDelta } }
              : { totalAmount: { decrement: -amountDelta } },
          select: { id: true, totalItems: true, totalAmount: true },
        });

        return {
          totals,
          line: {
            id: line.id,
            quantity: newQty,
            unitPrice,
            productId: line.productId,
            variantId: line.variantId,
          },
        };
      });

    let result;
    try {
      result = await runTx(prismaDirect);
    } catch (e: any) {
      result = await runTx(prisma);
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    if (err?.message === "LINE_NOT_FOUND")
      return NextResponse.json({ error: "Cart line not found" }, { status: 404 });
    if (err?.message === "PRODUCT_NOT_FOUND" || err?.message === "VARIANT_NOT_FOUND")
      return NextResponse.json({ error: "Product/Variant not found" }, { status: 400 });

    console.error("PATCH /api/cart/update failed", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
