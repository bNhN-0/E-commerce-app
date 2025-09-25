import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};

    if (category) {
      where.category = {
        name: { equals: category, mode: "insensitive" },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 12;
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          skip,
          take: limitNum,
          where,
          include: {
            category: { select: { id: true, name: true, type: true } },
            variants: { include: { attributes: true } }, // ✅ now included
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ]);

      return NextResponse.json({
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } else {
      const products = await prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, type: true } },
          variants: { include: { attributes: true } }, 
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(products);
    }
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create product (ADMIN only)
export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, description, price, stock, imageUrl, categoryId, variants } = body;

    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        imageUrl,
        categoryId,
        variants: variants?.length
          ? {
              create: variants.map((v: any) => ({
                sku: v.sku,
                price: v.price,
                stock: v.stock,
                attributes: {
                  create: v.attributes?.map((a: any) => ({
                    name: a.name,
                    value: a.value,
                  })) || [],
                },
              })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, type: true } },
        variants: { include: { attributes: true } },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
