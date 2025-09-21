"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
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

  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        ...(category ? { category } : {}),
      });

      const res = await fetch(`/api/products?${query.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="animate-pulse text-gray-500 text-lg">
          ⏳ Loading products...
        </p>
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

  if (products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-600 text-lg">
          {category
            ? `No products available in ${category}.`
            : "No products available."}
        </p>
        <button
          onClick={() => fetchProducts(1)}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          🔄 Refresh
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        {category ? `Products in ${category}` : "All Products"}
      </h1>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <div className="group border rounded-2xl shadow hover:shadow-xl transition overflow-hidden bg-white cursor-pointer">
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

              <div className="p-4">
                <h2 className="font-semibold text-lg truncate">{p.name}</h2>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {p.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">${p.price}</span>
                  <span className="text-xs text-gray-500">
                    Stock: {p.stock}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && (
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
