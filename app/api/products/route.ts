// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page  = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50);
    const skip  = (page - 1) * limit;

    const categoryName   = searchParams.get('category') ?? undefined;
    const categoryIdRaw  = searchParams.get('categoryId');
    const categoryId     = categoryIdRaw ? Number(categoryIdRaw) : undefined;
    const search         = searchParams.get('search') ?? undefined;
    const sort = (searchParams.get('sort') ?? 'new') as
      | 'new' | 'price_asc' | 'price_desc' | 'rating';

    const where: Prisma.ProductWhereInput = {
      ...(categoryId
        ? { categoryId }
        : categoryName
        ? { category: { name: { equals: categoryName, mode: 'insensitive' } } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // ✅ Always provide an array and use correct Prisma types
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === 'price_asc'
        ? [{ price: 'asc' }]
        : sort === 'price_desc'
        ? [{ price: 'desc' }]
        : sort === 'rating'
        ? [{ averageRating: 'desc' }, { reviewCount: 'desc' }]
        : [{ createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          imageUrl: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
          category: { select: { id: true, name: true, type: true } },
          // variants.attributes is JSON in your schema
          variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
      }
    );
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST create product (ADMIN only) — matches JSON variant attributes
export async function POST(req: Request) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, description, price, stock, imageUrl, categoryId, variants } = body ?? {};
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        imageUrl,
        categoryId: Number(categoryId),
        variants:
          Array.isArray(variants) && variants.length
            ? {
                create: variants.map((v: any) => ({
                  sku: v.sku,
                  price: v.price ?? null,
                  stock: v.stock ?? 0,
                  attributes: v.attributes ?? {}, // JSON blob
                })),
              }
            : undefined,
        averageRating: 0,
        reviewCount: 0,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        averageRating: true,
        reviewCount: true,
        createdAt: true,
        category: { select: { id: true, name: true, type: true } },
        variants: { select: { id: true, sku: true, price: true, stock: true, attributes: true } },
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
