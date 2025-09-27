"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "../components/CartContext";

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set()); 

  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;   
  const categoryId = searchParams.get("categoryId") || undefined; 
  const search = searchParams.get("search") || undefined;
  const sort = (searchParams.get("sort") || "new") as
    | "new"
    | "price_asc"
    | "price_desc"
    | "rating";

  const { setCartCount } = useCart(); 

  const formatAttributes = (attrs: VariantAttributes) => {
    if (!attrs) return "";
    if (Array.isArray(attrs)) return attrs.map((a) => `${a.name}: ${a.value}`).join(", ");
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

        const res = await fetch(`/api/products?${query.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json(); // { data, pagination }
        setProducts(data.data || []);
        setPagination(data.pagination || null);
      } catch {
        setError("Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [category, categoryId, search, sort]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // ⚡ Instant Add to Cart: single call to /api/cart/add and update badge from totals
  const handleAddToCart = async (productId: number) => {
    if (addingIds.has(productId)) return;

    // optimistic badge bump
    setCartCount((typeof setCartCount === "function" ? 1 : (Number(setCartCount) + 1) || 1));

    setAddingIds((s) => new Set(s).add(productId));
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ productId, qty: 1, quantity: 1 }), // keep "quantity" for backward compat if needed
      });

      if (!res.ok) throw new Error(`add failed: ${res.status}`);
      const data = await res.json(); // { ok, line, totals }
      if (data?.totals?.totalItems != null) {
        setCartCount(data.totals.totalItems); // server truth
      }
      // Optional: toast "Added to cart"
    } catch (e) {
      console.error("Add to cart failed", e);
      // rollback optimistic bump
      setCartCount(0);
      alert("Could not add to cart.");
    } finally {
      setAddingIds((s) => {
        const n = new Set(s);
        n.delete(productId);
        return n;
      });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="animate-pulse text-gray-500 text-lg">⏳ Loading products...</p>
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
          {products.map((p) => {
            const isAdding = addingIds.has(p.id);
            return (
              <div
                key={p.id}
                className="group border rounded-2xl shadow hover:shadow-xl transition overflow-hidden bg-white"
              >
                <Link href={`/products/${p.id}`} className="block">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <h2 className="font-semibold text-lg truncate">{p.name}</h2>
                  {p.description ? (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{p.description}</p>
                  ) : null}

                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-blue-600">${p.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                  </div>

                  {(p.averageRating ?? 0) > 0 && (
                    <div className="text-xs text-gray-500 mb-3">
                      ⭐ {(p.averageRating ?? 0).toFixed(1)} ({p.reviewCount ?? 0})
                    </div>
                  )}

                  {/* Variants preview */}
                  {p.variants?.length ? (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Variants:</p>
                      <div className="flex flex-wrap gap-2">
                        {p.variants.map((v) => (
                          <div
                            key={v.id}
                            className="border px-2 py-1 rounded text-xs bg-gray-50"
                            title={formatAttributes(v.attributes)}
                          >
                            {formatAttributes(v.attributes)}
                            {v.price != null ? ` - $${v.price}` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(p.id)}
                    disabled={isAdding}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 rounded-lg transition"
                  >
                    {isAdding ? "Adding..." : "🛒 Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination && products.length > 0 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchProducts(pagination.page - 1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 transition"
          >
            ⬅ Prev
          </button>
          <span className="text-sm text-gray-600">
            Page <b>{pagination.page}</b> of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 transition"
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}
