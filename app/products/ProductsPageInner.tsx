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

const formatAttributes = (attrs: VariantAttributes): string => {
  if (!attrs) return "";
  if (Array.isArray(attrs)) {
    return attrs.map((a) => `${a.name}: ${a.value}`).join(", ");
  }
  return Object.entries(attrs as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
};

export default function ProductsPageInner() {
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
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchProducts(pagination?.page || 1)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
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
        // 4 per row on large screens, smaller cards
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="group h-full rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
            >
              <Link href={`/products/${p.id}`} className="block">
                {/* smaller image */}
                <div className="relative w-full h-40">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 grid place-items-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3 flex-1 flex flex-col">
                <h2 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                  {p.name}
                </h2>

                {p.description ? (
                  <p className="text-[12px] text-gray-600 mb-2 line-clamp-2">
                    {p.description}
                  </p>
                ) : null}

                <span className="text-indigo-600 font-bold text-sm mb-2">
                  ${p.price.toFixed(2)}
                </span>

                {/* FULL variant list, fits by using tiny chips that wrap */}
                {p.variants?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] text-gray-500 mb-1">Variants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.variants.map((v) => {
                        const label = formatAttributes(v.attributes) || v.sku;
                        return (
                          <span
                            key={v.id}
                            title={label}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] leading-tight text-gray-700 whitespace-normal break-words"
                          >
                            {label}
                            {v.price != null ? <em className="not-italic text-gray-500">– ${v.price}</em> : null}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p
                  className={`mt-auto text-[12px] ${
                    p.stock > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {p.stock > 0 ? `In stock: ${p.stock}` : "Out of stock"}
                </p>
              </div>

              <Link
                href={`/products/${p.id}`}
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 text-sm font-medium transition"
              >
                 🛍 Shop It ! 
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
