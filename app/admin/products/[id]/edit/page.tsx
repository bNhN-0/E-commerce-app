"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Category = { id: number; name: string; type: string };

type UIAttribute = { id?: number; tempId?: string; name: string; value: string };
type UIVariant = {
  id?: number;
  tempId?: string;
  sku: string;
  price: number;
  stock: number;
  attributes: UIAttribute[];
};

type UIProduct = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  categoryId?: number | null;
  variants: UIVariant[];
};

const uid = () => Math.random().toString(36).slice(2, 9);

function toUIAttributes(attrs: unknown): UIAttribute[] {
  if (!attrs) return [];
  if (Array.isArray(attrs)) {
    return (attrs as any[]).map((a, i) => {
      if (a && typeof a === "object" && "name" in a && "value" in a) {
        return { name: String((a as any).name), value: String((a as any).value), tempId: uid() };
      }
      return { name: `attr_${i + 1}`, value: String(a), tempId: uid() };
    });
  }
  if (typeof attrs === "object") {
    return Object.entries(attrs as Record<string, unknown>).map(([k, v]) => ({
      name: String(k),
      value: String(v),
      tempId: uid(),
    }));
  }
  return [{ name: "value", value: String(attrs), tempId: uid() }];
}

function fromUIAttributes(ui: UIAttribute[]) {
  return ui
    .map(({ name, value }) => ({ name: name.trim(), value: value.trim() }))
    .filter((a) => a.name && a.value);
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const productId = useMemo(() => Number(id), [id]);
  const router = useRouter();

  const [product, setProduct] = useState<UIProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products/${productId}`, { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        if (!prodRes.ok) throw new Error("Failed to load product");
        if (!catRes.ok) throw new Error("Failed to load categories");

        const rawProduct = await prodRes.json();
        const rawCats = await catRes.json();
        const cats: Category[] = Array.isArray(rawCats?.data)
          ? rawCats.data
          : Array.isArray(rawCats)
          ? rawCats
          : [];

        const ui: UIProduct = {
          id: Number(rawProduct.id),
          name: String(rawProduct.name ?? ""),
          description: rawProduct.description ?? null,
          price: Number(rawProduct.price ?? 0),
          stock: Number(rawProduct.stock ?? 0),
          imageUrl: rawProduct.imageUrl ?? null,
          categoryId: rawProduct.categoryId ?? rawProduct.category?.id ?? null,
          variants: Array.isArray(rawProduct.variants)
            ? rawProduct.variants.map((v: any) => ({
                id: v.id ? Number(v.id) : undefined,
                tempId: uid(),
                sku: String(v.sku ?? ""),
                price: v.price == null ? 0 : Number(v.price),
                stock: v.stock == null ? 0 : Number(v.stock),
                attributes: toUIAttributes(v.attributes),
              }))
            : [],
        };

        setCategories(cats);
        setProduct(ui);
        setPreviewUrl(ui.imageUrl || "");
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    if (Number.isFinite(productId)) run();
  }, [productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!product.name.trim()) return setError("Name is required.");
    if (!Number.isFinite(product.price) || product.price < 0) return setError("Invalid price.");
    if (!Number.isInteger(product.stock) || product.stock < 0) return setError("Invalid stock.");
    if (!product.categoryId) return setError("Category is required.");

    setSaving(true);
    setError(null);
    try {
      // Filter out empty/new variants with no SKU
      const cleanedVariants = product.variants
        .map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          price: Number.isFinite(v.price) ? v.price : null,
          stock: Number.isFinite(v.stock) ? v.stock : 0,
          attributes: fromUIAttributes(v.attributes),
        }))
        .filter((v) => v.sku.length > 0);

      const payload = {
        name: product.name.trim(),
        description: product.description?.trim() || null,
        price: product.price,
        stock: product.stock,
        imageUrl: previewUrl || product.imageUrl || null,
        categoryId: product.categoryId,
        variants: cleanedVariants,
      };

      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH", // use PATCH to be safe even if PUT isn't present
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          const j = await res.json();
          serverMsg = j?.error || j?.message || "";
        } catch {}
        if (res.status === 401) {
          // not logged in
          return router.push("/auth");
        }
        if (res.status === 403) throw new Error(serverMsg || "Forbidden (admin only).");
        if (res.status === 404) throw new Error(serverMsg || "Product or category not found.");
        if (res.status === 409) throw new Error(serverMsg || "Duplicate SKU (unique constraint).");
        throw new Error(serverMsg || `Failed to update (HTTP ${res.status})`);
      }

      alert("✅ Product updated!");
      router.push("/admin/products");
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading product...</p>;
  if (!product) return <p className="p-6 text-red-500">Product not found.</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">✏️ Edit Product</h1>
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
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={product.description ?? ""}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full h-24 focus:ring-2 focus:ring-blue-500 outline-none"
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
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value || "0") })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={product.stock}
              onChange={(e) => setProduct({ ...product, stock: parseInt(e.target.value || "0") })}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded-lg border" />
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={product.categoryId ?? ""}
            onChange={(e) => setProduct({ ...product, categoryId: Number(e.target.value) || null })}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Variants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>

          {product.variants.map((v, idx) => (
            <div key={v.id ?? v.tempId} className="border p-4 rounded-lg mb-3 bg-gray-50 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Variant {idx + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    setProduct((p) => (p ? { ...p, variants: p.variants.filter((_, i) => i !== idx) } : p))
                  }
                  className="text-red-500 text-sm hover:underline"
                >
                  🗑 Remove Variant
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => {
                    const updated = { ...product };
                    updated.variants[idx].sku = e.target.value;
                    setProduct(updated);
                  }}
                  className="border px-3 py-2 rounded"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => {
                    const updated = { ...product };
                    updated.variants[idx].price = parseFloat(e.target.value || "0");
                    setProduct(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => {
                    const updated = { ...product };
                    updated.variants[idx].stock = parseInt(e.target.value || "0");
                    setProduct(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
              </div>

              {/* Attributes */}
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Attributes</label>
                {v.attributes.map((a, aIdx) => (
                  <div key={a.id ?? a.tempId} className="flex gap-2 mb-2">
                    <input
                      placeholder="Name"
                      value={a.name}
                      onChange={(e) => {
                        const updated = { ...product };
                        updated.variants[idx].attributes[aIdx].name = e.target.value;
                        setProduct(updated);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />
                    <input
                      placeholder="Value"
                      value={a.value}
                      onChange={(e) => {
                        const updated = { ...product };
                        updated.variants[idx].attributes[aIdx].value = e.target.value;
                        setProduct(updated);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...product };
                        updated.variants[idx].attributes.splice(aIdx, 1);
                        setProduct(updated);
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
                    const updated = { ...product };
                    updated.variants[idx].attributes.push({ tempId: uid(), name: "", value: "" });
                    setProduct(updated);
                  }}
                  className="text-blue-600 text-sm mt-1"
                >
                  + Add Attribute
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setProduct({
                ...product,
                variants: [...product.variants, { tempId: uid(), sku: "", price: 0, stock: 0, attributes: [] }],
              })
            }
            className="text-green-600 text-sm"
          >
            + Add Variant
          </button>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "💾 Save Changes"}
        </button>
      </form>
    </div>
  );
}
