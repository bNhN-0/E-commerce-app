"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

export default function AdminProductsPage() {
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

  const handleDelete = async (id: number) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });

  if (res.ok) {
    setProducts(products.filter((p) => p.id !== id)); // update UI
    alert(" Product deleted");
  } else {
    const error = await res.json();
    alert(` ${error.error || "Failed to delete product"}`);
  }
};

  if (loading) return <p className="p-4">Loading products...</p>;

  return (
    
    <div className="p-6">
       
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin: Products</h1>
        <div className="flex gap-2">
          {/*  Back to Home Button */}
          <Link
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded"
          >
            ← Back to Home
          </Link>
          {/*  Add Product Button */}
          <Link
            href="/admin/products/add"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} className="border rounded p-4 shadow flex items-center">
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-20 h-20 object-cover rounded mr-4"
              />
            )}
            <div className="flex-1">
              <h2 className="font-semibold">{p.name}</h2>
              <p>${p.price}</p>
              <p className="text-sm text-gray-500">Stock: {p.stock}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
