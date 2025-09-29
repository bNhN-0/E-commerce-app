"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";

type CategoryInfo = { id: number; name: string; type: string };
type ProductStatus = "ACTIVE" | "INACTIVE" | "DELETED";
type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt?: string;
  status: ProductStatus;
  category?: CategoryInfo;
};

// Safely pull an array out of common API envelope shapes (no `any`)
const pickArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;

    for (const k of ["products", "items", "data", "rows", "result", "list"]) {
      const v = obj[k];
      if (Array.isArray(v)) return v;
    }

    const items = obj["items"];
    if (
      items &&
      typeof items === "object" &&
      Array.isArray((items as Record<string, unknown>)["data"])
    ) {
      return (items as Record<string, unknown>)["data"] as unknown[];
    }

    const edges = obj["edges"];
    if (Array.isArray(edges)) {
      const nodes = edges
        .map((e) =>
          typeof e === "object" && e
            ? (e as Record<string, unknown>)["node"]
            : undefined
        )
        .filter((n): n is unknown => n !== undefined);
      if (nodes.length) return nodes;
    }
  }
  return [];
};

// Coercion helpers
const toNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toString = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

// NEW: unwrap `{ data: [...] }` safely without `any`
function unwrapData(raw: unknown): unknown {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { data?: unknown };
    if (Array.isArray(obj.data)) return obj.data;
  }
  return raw;
}

// NEW: strong parser for the status filter
function parseStatusFilter(v: string): "ALL" | ProductStatus {
  if (v === "ALL" || v === "ACTIVE" || v === "INACTIVE" || v === "DELETED") return v;
  return "ALL";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "price" | "stock">("name");
  const [filterCategory, setFilterCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProductStatus>("ALL");

  const normalizeProducts = useCallback((data: unknown): Product[] => {
    return pickArray(data).map((p) => {
      const obj = p as Record<string, unknown>;
      const catRaw = obj["category"] as Record<string, unknown> | undefined;
      const category: CategoryInfo | undefined = catRaw
        ? {
            id: toNumber(catRaw.id),
            name: toString(catRaw.name),
            type: toString(catRaw.type),
          }
        : undefined;

      const rawStatus = toString(obj.status ?? "ACTIVE") as ProductStatus;

      return {
        id: toNumber(obj.id),
        name: toString(obj.name),
        description:
          typeof obj.description === "string" ? obj.description : undefined,
        price: toNumber(obj.price),
        stock: toNumber(obj.stock),
        imageUrl:
          typeof obj.imageUrl === "string" ? obj.imageUrl : undefined,
        createdAt:
          typeof obj.createdAt === "string" ? obj.createdAt : undefined,
        status:
          rawStatus === "INACTIVE" || rawStatus === "DELETED"
            ? rawStatus
            : "ACTIVE",
        category,
      };
    });
  }, []);

  // Fetch products with admin scope + status filter
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          scope: "admin",
          page: "1",
          limit: "100",
        });
        if (statusFilter !== "ALL") qs.set("status", statusFilter);
        const res = await fetch(`/api/products?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          setProducts([]);
          return;
        }
        const apiJson = (await res.json()) as unknown;
        const payload = unwrapData(apiJson); // ✅ no any
        const list = normalizeProducts(payload);
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
  }, [normalizeProducts, statusFilter]);

  // Update status (Activate/Deactivate/Undelete)
  async function updateStatus(id: number, next: ProductStatus) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json()) as Partial<Product>;
      if (!res.ok) {
        alert(`❌ ${(data as { error?: string })?.error || "Failed to update status"}`);
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: data.status ?? next } : p))
      );
      alert(`✅ Status updated to ${next}`);
      if (statusFilter !== "ALL" && statusFilter !== next) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert("❌ Network error");
    }
  }

  // Soft delete (set DELETED)
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this product? (soft delete)"))
      return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const payload = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        alert(`✅ ${payload?.message || "Product removed"}`);
        if (statusFilter === "ALL" || statusFilter === "DELETED") {
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "DELETED" } : p))
          );
        } else {
          setProducts((prev) => prev.filter((p) => p.id !== id));
        }
      } else {
        alert(`❌ ${payload?.error || "Failed to remove product"}`);
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("❌ Network/parse error");
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
      .filter((p) =>
        filterCategory === "all" ? true : p.category?.name === filterCategory
      )
      .sort((a, b) => {
        if (sort === "price") return a.price - b.price;
        if (sort === "stock") return a.stock - b.stock;
        return a.name.localeCompare(b.name);
      });
  }, [products, search, filterCategory, sort]);

  if (loading) return <p className="p-6 text-gray-500">Loading products...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        ⚙️ Admin Panel – Products
      </h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error} — check your <code>/api/products?scope=admin</code> response
          shape.
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
            onChange={(e) =>
              setSort(e.target.value as "name" | "price" | "stock")
            }
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
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setStatusFilter(parseStatusFilter(e.target.value))
            } // ✅ no any
            className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            title="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href="/"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            ← Store
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {p.imageUrl ? (
                      <div className="relative w-14 h-14">
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="56px"
                          className="object-cover rounded-md border"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.name}
                  </td>
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
                  <td className="px-4 py-3 text-blue-600">
                    {p.category ? p.category.name : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : p.status === "INACTIVE"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2 justify-center">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition"
                    >
                      Edit
                    </Link>

                    {p.status !== "ACTIVE" && (
                      <button
                        onClick={() => updateStatus(p.id, "ACTIVE")}
                        className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-600 transition"
                      >
                        Activate
                      </button>
                    )}

                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => updateStatus(p.id, "INACTIVE")}
                        className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-amber-600 transition"
                      >
                        Deactivate
                      </button>
                    )}

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
