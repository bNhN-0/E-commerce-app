
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p className="p-4">Loading products...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}>
            <div className="border rounded p-4 shadow hover:shadow-lg transition cursor-pointer">
              {/* Show product image if available */}
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-40 object-cover mb-2 rounded"
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
    </div>
  );
}
