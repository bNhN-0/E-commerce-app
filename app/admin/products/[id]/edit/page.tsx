"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  type: string;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: number;
};

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); 
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // fetch product + categories
useEffect(() => {
  const fetchData = async () => {
    try {
      const [productRes, catRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch("/api/categories"),
      ]);

      if (!productRes.ok) throw new Error("Failed to load product");
      if (!catRes.ok) throw new Error("Failed to load categories");

      const productData = await productRes.json();
      const categoryData = await catRes.json();

      setProduct(productData);
      setCategories(categoryData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });

    if (res.ok) {
      alert("✅ Product updated!");
      router.push("/admin/products");
      router.refresh();
    } else {
      alert("❌ Failed to update product");
    }
  };

  if (loading) return <p className="p-4">Loading product...</p>;
  if (!product) return <p className="p-4 text-red-500">Product not found.</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={product.name}
          onChange={(e) => setProduct({ ...product, name: e.target.value })}
          placeholder="Product name"
          className="border p-2 w-full"
          required
        />
        <textarea
          value={product.description || ""}
          onChange={(e) =>
            setProduct({ ...product, description: e.target.value })
          }
          placeholder="Description"
          className="border p-2 w-full"
        />
        <input
          type="number"
          value={product.price}
          onChange={(e) =>
            setProduct({ ...product, price: parseFloat(e.target.value) })
          }
          placeholder="Price"
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          value={product.stock}
          onChange={(e) =>
            setProduct({ ...product, stock: parseInt(e.target.value) })
          }
          placeholder="Stock"
          className="border p-2 w-full"
          required
        />
        <input
          value={product.imageUrl || ""}
          onChange={(e) =>
            setProduct({ ...product, imageUrl: e.target.value })
          }
          placeholder="Image URL"
          className="border p-2 w-full"
        />

        {/* Category Selector */}
        <select
          value={product.categoryId ?? ""}
          onChange={(e) =>
            setProduct({ ...product, categoryId: Number(e.target.value) })
          }
          className="border p-2 w-full"
          required
        >
          <option value="">-- Select Category --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.type})
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
