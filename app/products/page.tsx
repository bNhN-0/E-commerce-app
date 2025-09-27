"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type VariantAttributes =
  | Record<string, unknown>
  | Array<{ name: string; value: string }>
  | null;

type Variant = {
  id: number;
  sku: string;
  price: number | null;
  stock: number;
  attributes: VariantAttributes;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  variants: Variant[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ProductsResponse = {
  data: Product[];
  pagination: Pagination;
};

// ---- helpers (no any) ----
const isPagination = (x: unknown): x is Pagination => {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.page === "number" &&
    typeof o.limit === "number" &&
    typeof o.total === "number" &&
    typeof o.totalPages === "number"
  );
};

const isProductsResponse = (x: unknown): x is ProductsResponse => {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.isArray(o.data) && isPagination(o.pagination);
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = (searchParams.get("sort") || "new") as
    | "new"
    | "price_asc"
    | "price_desc"
    | "rating";

  const formatAttributes = (attrs: VariantAttributes) => {
    if (!attrs) return "";
    if (Array.isArray(attrs)) {
      return attrs.map((a) => `${a.name}: ${a.value}`).join(", ");
    }
    return Object.entries(attrs)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(", ");
  };

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: "12",
          ...(category ? { category } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(search ? { search } : {}),
          ...(sort ? { sort } : {}),
        });

        const res = await fetch(`/api/products?${query.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch products");

        const data: unknown = await res.json();
        const parsed: ProductsResponse = isProductsResponse(data)
          ? data
          : {
              data: [],
              pagination: { page, limit: 12, total: 0, totalPages: 0 },
            };

        setProducts(parsed.data);
        setPagination(parsed.pagination);
      } catch {
        setError("Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [category, categoryId, search, sort]
  );

  useEffect(() => {
    void fetchProducts(1);
  }, [fetchProducts]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchProducts(pagination?.page || 1)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          🔄 Retry
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {category
          ? `Products in ${category}`
          : categoryId
          ? `Products in category #${categoryId}`
          : "All Products"}
        {search ? ` matching "${search}"` : ""}
      </h1>

      {products.length === 0 ? (
        <p className="text-center text-gray-500">
          No products found{" "}
          {category ? `in ${category}` : categoryId ? `in #${categoryId}` : ""}{" "}
          {search ? `for "${search}"` : ""}.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group border rounded-2xl shadow hover:shadow-xl transition overflow-hidden bg-white flex flex-col"
            >
              <Link href={`/products/${p.id}`} className="block">
                <div className="relative w-full h-48">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-4 flex-1 flex flex-col">
                <h2 className="font-semibold text-lg truncate">{p.name}</h2>
                {p.description ? (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {p.description}
                  </p>
                ) : null}

                <span className="font-bold text-blue-600 mb-1 block">
                  ${p.price.toFixed(2)}
                </span>

                {/* Variants preview */}
                {p.variants?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Variants:</p>
                    <div className="flex flex-wrap gap-2">
                      {p.variants.map((v) => {
                        const label = formatAttributes(v.attributes);
                        return (
                          <div
                            key={v.id}
                            className="border px-2 py-1 rounded text-xs bg-gray-50"
                            title={label}
                          >
                            {label}
                            {v.price != null ? ` - $${v.price}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stock message above button */}
                {p.stock > 0 ? (
                  <p className="text-sm text-red-500 mb-3">
                    Only {p.stock} left in stock!
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">Out of stock</p>
                )}
              </div>

              {/* Shop It button as card footer */}
              <Link
                href={`/products/${p.id}`}
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-b-2xl transition font-medium"
              >
                🛍 Shop it
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
