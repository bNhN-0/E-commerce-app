import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";
import { CategoryType } from "@prisma/client";

// GET all products (public)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create product (ADMIN only)
export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, description, price, stock, imageUrl, categoryType } = body;

    // validate categoryType is one of the enums
    if (!Object.values(CategoryType).includes(categoryType)) {
      return NextResponse.json({ error: "Invalid category type" }, { status: 400 });
    }

    // convert enum value to string for DB
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

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        imageUrl,
        categoryId: category.id,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
