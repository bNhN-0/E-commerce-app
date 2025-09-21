
"use client";

{/*  
Component mounts → loading = true.

Fetch starts.

If success → products set, then loading = false.

If error → error logged, then loading = false.

UI updates → either shows products or shows nothing (but not “Loading…” anymore)
 */}



import { useEffect, useState } from "react";
import Link from "next/link";

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

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?page=${page}&limit=12`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.data); //  extract the array
      setPagination(data.pagination); //  save pagination info
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <p className="p-4">⏳ Loading products...</p>;

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchProducts(pagination?.page || 1)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          🔄 Retry
        </button>
      </div>
    );

  if (products.length === 0)
    return <p className="p-6">No products available.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <div className="border rounded p-4 shadow hover:shadow-lg transition cursor-pointer">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-40 object-cover mb-2 rounded"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center mb-2 rounded">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-gray-600 line-clamp-2">{p.description}</p>
              <p className="font-bold">${p.price}</p>
              <p className="text-sm text-gray-500">Stock: {p.stock}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchProducts(pagination.page - 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchProducts(pagination.page + 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}
