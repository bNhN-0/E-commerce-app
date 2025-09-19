import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
export async function GET(
  _: Request,                               // 1st arg = Request (ignored with "_")
  { params }: { params: { id: string } }    // 2nd arg = context object, but we destructure only "params"
) {
  // params comes from the [id] in the URL
  // Example: /api/products/123 → params = { id: "123" }
  //params act as a bucket 

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(params.id) },   // convert "123" (string) → 123 (number)
    });

    if (!product) {  // if no product was found in DB with that ID.
      // return a JSON response with 404 status if not found
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // return the found product as JSON
    return NextResponse.json(product);
  } catch (error) {
    // return error response if DB query fails
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}


// UPDATE product
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await prisma.product.update({
      where: { id: parseInt(params.id) },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: parseInt(params.id) },
    });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
