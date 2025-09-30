"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/app/components/CartContext";

type VariantAttributes =
  | Record<string, unknown>
  | Array<{ name: string; value: string }>
  | null;

type Variant = {
  id: number;
  sku: string;
  price?: number | null;
  stock: number;
  attributes?: VariantAttributes;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  variants?: Variant[];
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [adding, setAdding] = useState(false);

  const { applyTotals } = useCart();

  const money = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  // fetch product
  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch product");
        const data: Product = await res.json();
        setProduct(data);
        const first = data.variants?.[0] ?? null;
        setSelectedVariant(first);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  const formatAttrs = (attrs?: VariantAttributes) => {
    if (!attrs) return "";
    if (Array.isArray(attrs)) return attrs.map((a) => `${a.name}: ${a.value}`).join(", ");
    return Object.entries(attrs).map(([k, v]) => `${k}: ${String(v)}`).join(", ");
  };

  if (loading) {
    return <p className="p-6 text-center text-gray-500">Loading product...</p>;
  }
  if (!product) {
    return <p className="p-6 text-center text-red-500">Product not found.</p>;
  }

  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = selectedVariant?.stock ?? product.stock;

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);

    try {
      const body =
        selectedVariant && selectedVariant.id
          ? { productId: product.id, variantId: selectedVariant.id, qty: 1 }
          : { productId: product.id, qty: 1 };

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errPayload: { error?: string } = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(errPayload.error || `Failed to add to cart (${res.status})`);
      }

      const data: { totals?: { totalItems: number; totalAmount: number } } = await res.json();
      if (data?.totals) applyTotals(data.totals);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      console.error(error);
      alert(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Product Image */}
      {product.imageUrl && (
        <div className="w-full h-80 md:h-[28rem] relative rounded-2xl overflow-hidden shadow">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        </div>
      )}

      {/* Product Info */}
      <div className="mt-6 space-y-4">
        <h1 className="text-3xl font-extrabold text-gray-900">{product.name}</h1>
        {product.description && (
          <p className="text-gray-600 leading-relaxed">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-indigo-600">
            {money.format(effectivePrice)}
          </p>
          <p className="text-sm text-gray-500">Stock: {effectiveStock}</p>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div>
            <p className="font-medium mb-2">Choose a Variant:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {product.variants.map((v) => {
                const attrs = formatAttrs(v.attributes);
                const priceLabel =
                  v.price != null ? money.format(v.price) : money.format(product.price);
                const isActive = selectedVariant?.id === v.id;

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl border p-3 text-left transition hover:shadow ${
                      isActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="text-sm font-medium">{attrs || "Variant"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      SKU: {v.sku} • {priceLabel} • Stock: {v.stock}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to Cart */}
        {user ? (
          <button
            onClick={handleAddToCart}
            disabled={adding || effectiveStock <= 0}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {adding ? "Adding..." : "🛒 Add to Cart"}
          </button>
        ) : (
          <p className="text-red-500 font-medium">
            ⚠️ Please log in to add items to cart.
          </p>
        )}
      </div>
    </div>
  );
}
