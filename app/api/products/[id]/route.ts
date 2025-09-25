import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

// GET one product (public)
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        variants: { include: { attributes: true } },
      },
    });

    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// UPDATE product (ADMIN only)
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, description, price, stock, imageUrl, categoryId, variants } = body;

    // update base product
    await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price,
        stock,
        imageUrl,
        ...(categoryId ? { categoryId } : {}),
      },
    });

    // handle variants + attributes
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          // Update variant
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              sku: v.sku,
              price: v.price,
              stock: v.stock,
            },
          });

          if (Array.isArray(v.attributes)) {
            for (const a of v.attributes) {
              if (a._delete && a.id) {
                await prisma.variantAttribute.delete({ where: { id: a.id } });
              } else if (a.id) {
                await prisma.variantAttribute.update({
                  where: { id: a.id },
                  data: { name: a.name, value: a.value },
                });
              } else if (!a._delete) {
                await prisma.variantAttribute.create({
                  data: {
                    variantId: v.id,
                    name: a.name,
                    value: a.value,
                  },
                });
              }
            }
          }
        } else {
          // New variant
          await prisma.productVariant.create({
            data: {
              productId: parseInt(id),
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              attributes: {
                create: v.attributes
                  ?.filter((a: any) => !a._delete)
                  .map((a: any) => ({ name: a.name, value: a.value })) || [],
              },
            },
          });
        }
      }
    }

    const refreshed = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        variants: { include: { attributes: true } },
      },
    });

    return NextResponse.json(refreshed);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE product (ADMIN only)
export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.productVariant.deleteMany({ where: { productId: parseInt(id) } });
    await prisma.product.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
