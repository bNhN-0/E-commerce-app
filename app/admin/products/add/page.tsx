"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  type: string;
};

type Variant = {
  sku: string;
  price: string;
  stock: string;
  attributes: { name: string; value: string }[];
};

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    { sku: "", price: "", stock: "", attributes: [] },
  ]);

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let uploadedUrl = "";
    if (imageFile) {
      // TODO: replace with real upload (Supabase/S3/etc.)
      uploadedUrl = previewUrl;
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl: uploadedUrl,
        categoryId: parseInt(categoryId),
        variants: variants.map((v) => ({
          sku: v.sku,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
          attributes: v.attributes,
        })),
      }),
    });

    if (res.ok) {
      alert("✅ Product created!");
      router.push("/admin/products");
      router.refresh();
    } else {
      alert("❌ Failed to create product");
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
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

        {/* Variants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variants
          </label>

          {variants.map((v, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-lg mb-3 bg-gray-50 shadow-sm"
            >
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
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
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
                  placeholder="Stock"
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
                <label className="block text-xs text-gray-600 mb-1">
                  Attributes
                </label>
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
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setVariants([
                ...variants,
                { sku: "", price: "", stock: "", attributes: [] },
              ])
            }
            className="text-green-600 text-sm"
          >
            + Add Variant
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}
