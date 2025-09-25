"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  type: string;
};

type Attribute = {
  id?: number;
  tempId?: string;
  name: string;
  value: string;
};

type Variant = {
  id?: number;
  tempId?: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Attribute[];
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: number;
  variants: Variant[];
};

// helper to make unique IDs
const uid = () => Math.random().toString(36).substring(2, 9);

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const router = useRouter();

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

        // attach tempIds for frontend rendering safety
        productData.variants = productData.variants.map((v: Variant) => ({
          ...v,
          tempId: uid(),
          attributes: v.attributes.map((a: Attribute) => ({
            ...a,
            tempId: uid(),
          })),
        }));

        setProduct(productData);
        setCategories(categoryData);
        setPreviewUrl(productData.imageUrl || "");
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

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

  if (loading) return <p className="p-6 text-gray-500">Loading product...</p>;
  if (!product) return <p className="p-6 text-red-500">Product not found.</p>;

  return (
    <div className="p-6">
      {/* Header */}
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow-md"
      >
        {/* Product Name */}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={product.description || ""}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
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
              onChange={(e) =>
                setProduct({ ...product, price: parseFloat(e.target.value) })
              }
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
              onChange={(e) =>
                setProduct({ ...product, stock: parseInt(e.target.value) })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-3 w-32 h-32 object-cover rounded-lg border"
            />
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={product.categoryId ?? ""}
            onChange={(e) =>
              setProduct({ ...product, categoryId: Number(e.target.value) })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>

        {/* Variants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variants
          </label>

          {product.variants?.map((v, idx) => (
            <div
              key={v.id ?? v.tempId}
              className="border p-4 rounded-lg mb-3 bg-gray-50 shadow-sm"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">
                  Variant {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to remove this variant?"
                      )
                    ) {
                      const updated = { ...product };
                      updated.variants.splice(idx, 1);
                      setProduct(updated);
                    }
                  }}
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
                    updated.variants[idx].price = parseFloat(e.target.value);
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
                    updated.variants[idx].stock = parseInt(e.target.value);
                    setProduct(updated);
                  }}
                  className="border px-3 py-2 rounded"
                />
              </div>

              {/* Attributes */}
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Attributes
                </label>
                {v.attributes?.map((a, aIdx) => (
                  <div key={a.id ?? a.tempId} className="flex gap-2 mb-2">
                    <input
                      placeholder="Name"
                      value={a.name}
                      onChange={(e) => {
                        const updated = { ...product };
                        updated.variants[idx].attributes[aIdx].name =
                          e.target.value;
                        setProduct(updated);
                      }}
                      className="border px-2 py-1 rounded flex-1"
                    />
                    <input
                      placeholder="Value"
                      value={a.value}
                      onChange={(e) => {
                        const updated = { ...product };
                        updated.variants[idx].attributes[aIdx].value =
                          e.target.value;
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
                    updated.variants[idx].attributes.push({
                      tempId: uid(),
                      name: "",
                      value: "",
                    });
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
                variants: [
                  ...product.variants,
                  {
                    tempId: uid(),
                    sku: "",
                    price: 0,
                    stock: 0,
                    attributes: [],
                  },
                ],
              })
            }
            className="text-green-600 text-sm"
          >
            + Add Variant
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
        >
          💾 Save Changes
        </button>
      </form>
    </div>
  );
}
