import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all products
export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create product
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, stock, imageUrl } = body;

    const newProduct = await prisma.product.create({
      data: { name, description, price, stock, imageUrl },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
