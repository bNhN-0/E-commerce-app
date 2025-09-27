"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
  category?: { id: number; name: string; type: string };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "price" | "stock">("name");
  const [filterCategory, setFilterCategory] = useState("all");

  // Robustly pick an array from many possible API shapes
  const pickArray = (d: any): any[] => {
    if (Array.isArray(d)) return d;
    const keys = ["products", "items", "data", "rows", "result", "list"];
    for (const k of keys) if (Array.isArray(d?.[k])) return d[k];
    if (Array.isArray(d?.items?.data)) return d.items.data;
    if (Array.isArray(d?.edges)) return d.edges.map((e: any) => e?.node).filter(Boolean);
    return [];
  };

  const normalizeProducts = (data: any): Product[] =>
    pickArray(data).map((p: any) => ({
      id: Number(p.id),
      name: String(p.name ?? ""),
      price: Number(p.price ?? 0),
      stock: Number(p.stock ?? 0),
      imageUrl: p.imageUrl ?? undefined,
      createdAt: p.createdAt ?? undefined,
      category: p.category
        ? {
            id: Number(p.category.id),
            name: String(p.category.name ?? ""),
            type: String(p.category.type ?? ""),
          }
        : undefined,
    }));

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) {
          const msg = `HTTP ${res.status}`;
          setError(msg);
          setProducts([]);
          return;
        }
        const raw = await res.json();
        const list = normalizeProducts(raw);
        setProducts(list);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Network/parse error");
        setProducts([]);
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
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("✅ Product deleted");
    } else {
      const payload = await res.json().catch(() => ({} as any));
      alert(`❌ ${payload.error || "Failed to delete product"}`);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      const name = p.category?.name;
      if (name) set.add(name);
    }
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => (term ? p.name.toLowerCase().includes(term) : true))
      .filter((p) => (filterCategory === "all" ? true : p.category?.name === filterCategory))
      .sort((a, b) => {
        if (sort === "price") return a.price - b.price;
        if (sort === "stock") return a.stock - b.stock;
        return a.name.localeCompare(b.name);
      });
  }, [products, search, filterCategory, sort]);

  if (loading) return <p className="p-6 text-gray-500">Loading products...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Admin Panel – Products</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error} — check your <code>/api/products</code> response shape.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex gap-3 flex-1">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="stock">Sort by Stock</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href="/"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            ← Back
          </Link>
          <Link
            href="/admin/products/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-5xl mb-4">📦</span>
          <p className="text-lg">No products found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-14 h-14 object-cover rounded-md border"
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-gray-700">${p.price}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.stock > 10
                          ? "bg-green-100 text-green-700"
                          : p.stock > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-600">{p.category ? p.category.name : "—"}</td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
