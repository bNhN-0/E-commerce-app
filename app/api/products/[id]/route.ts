import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { CategoryType } from "@prisma/client";

// GET one product (public)
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
      include: { category: true },
    });

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// UPDATE product (ADMIN only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, description, price, stock, imageUrl, categoryType } = body;

    let categoryId: number | undefined;

    if (categoryType) {
      if (!Object.values(CategoryType).includes(categoryType)) {
        return NextResponse.json({ error: "Invalid category type" }, { status: 400 });
      }

      const categoryName = categoryType as string;

      const category = await prisma.category.upsert({
  where: { name: categoryName },
  update: {},
  create: {
    name: categoryName,
    description: `${categoryName} category`,
    type: categoryType, 
  },
});
      categoryId = category.id;
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description,
        price,
        stock,
        imageUrl,
        ...(categoryId ? { categoryId } : {}), // only update if category provided
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE product (ADMIN only)
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.product.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}



// GET one product
/*
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },
    });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

//export async function GET(request: Request, context: { params: ... }) {}

*/
// GET one product

  // params comes from the [id] in the URL
  // Example: /api/products/123 → params = { id: "123" }
  //params act as a bucket 
