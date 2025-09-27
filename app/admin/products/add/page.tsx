"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Category = { id: number; name: string; type: string };

type VariantRow = {
  sku: string;
  price: string; // form input, converted on submit
  stock: string; // form input, converted on submit
  attributes: { name: string; value: string }[];
};

type CreateVariantPayload = {
  sku: string;
  price: number | null;
  stock: number;
  attributes: { name: string; value: string }[];
};

type CreateProductPayload = {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryId: number;
  variants?: CreateVariantPayload[];
};

// ------- helpers (typed, no `any`) -------
const extractArray = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    for (const k of ["data", "items", "rows", "list", "categories"]) {
      const v = obj[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const toNumber = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toString = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

// ----------------------------------------

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = (await res.json()) as unknown;

        const arr = extractArray(raw).map((c): Category => {
          const obj = c as Record<string, unknown>;
          return {
            id: toNumber(obj.id),
            name: toString(obj.name),
            type: toString(obj.type),
          };
        });

        setCategories(
          arr.filter((c) => Number.isFinite(c.id) && c.name.length > 0)
        );
      } catch (e) {
        console.error("Failed to fetch categories", e);
        setCategories([]);
      }
    })();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  // Validate basic required fields
  const validateCore = (): string | null => {
    if (!name.trim()) return "Product name is required.";
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) return "Price must be a non-negative number.";
    const s = Number(stock);
    if (!Number.isInteger(s) || s < 0) return "Stock must be a non-negative integer.";
    const cat = Number(categoryId);
    if (!Number.isInteger(cat) || cat <= 0) return "Please select a category.";
    return null;
  };

  const cleanVariants = (): CreateVariantPayload[] => {
    return variants
      .map((v) => {
        const sku = v.sku.trim();
        if (!sku) return null;

        const vPrice = v.price.trim() === "" ? null : Number(v.price);
        const vStock = v.stock.trim() === "" ? 0 : Number(v.stock);

        const attrs = (v.attributes || [])
          .map((a) => ({
            name: toString(a.name).trim(),
            value: toString(a.value).trim(),
          }))
          .filter((a) => a.name && a.value);

        return {
          sku,
          price: vPrice,
          stock: Number.isFinite(vStock) && vStock >= 0 ? vStock : 0,
          attributes: attrs,
        };
      })
      .filter((x): x is CreateVariantPayload => x !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const bad = validateCore();
    if (bad) {
      setError(bad);
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrl = imageFile ? previewUrl : "";

      const payload: CreateProductPayload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        stock: Number(stock),
        imageUrl: uploadedUrl || null,
        categoryId: Number(categoryId),
      };

      const v = cleanVariants();
      if (v.length > 0) payload.variants = v;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          const body = (await res.json()) as { error?: string };
          serverMsg = body?.error || "";
        } catch {
          /* ignore */
        }

        if (res.status === 401) throw new Error(serverMsg || "Not logged in.");
        if (res.status === 403) throw new Error(serverMsg || "Forbidden (admin only).");
        if (res.status === 409) throw new Error(serverMsg || "Unique constraint failed (duplicate SKU?).");
        if (res.status === 404) throw new Error(serverMsg || "Category not found.");
        if (res.status === 400) throw new Error(serverMsg || "Invalid product data.");

        throw new Error(serverMsg || `Failed to create product (HTTP ${res.status})`);
      }

      alert("✅ Product created!");
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">➕ Add New Product</h1>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Price & Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <div className="mt-3 w-32 h-32 relative">
              <Image
                src={previewUrl}
                alt="Preview"
                width={128}
                height={128}
                className="object-cover rounded-lg border"
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Variants (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variants (optional)</label>

          {variants.map((v, idx) => (
            <div key={idx} className="border p-4 rounded-lg mb-3 bg-gray-50 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].sku = e.target.value;
                    setVariants(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Variant Price (optional)"
                  value={v.price}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].price = e.target.value;
                    setVariants(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Variant Stock (optional)"
                  value={v.stock}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].stock = e.target.value;
                    setVariants(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
              </div>

              {/* Attributes */}
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Attributes</label>
                {v.attributes.map((a, aIdx) => (
                  <div key={aIdx} className="flex gap-2 mb-2">
                    <input
                      placeholder="Name (e.g. Color)"
                      value={a.name}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].attributes[aIdx].name = e.target.value;
                        setVariants(updated);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />
                    <input
                      placeholder="Value (e.g. Red)"
                      value={a.value}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].attributes[aIdx].value = e.target.value;
                        setVariants(updated);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...variants];
                        updated[idx].attributes.splice(aIdx, 1);
                        setVariants(updated);
                      }}
                      className="text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...variants];
                    updated[idx].attributes.push({ name: "", value: "" });
                    setVariants(updated);
                  }}
                  className="text-blue-600 text-sm mt-1"
                >
                  + Add Attribute
                </button>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...variants];
                    updated.splice(idx, 1);
                    setVariants(updated);
                  }}
                  className="text-sm text-red-600"
                >
                  Remove Variant
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setVariants([...variants, { sku: "", price: "", stock: "", attributes: [] }])
            }
            className="text-green-600 text-sm"
          >
            + Add Variant
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
