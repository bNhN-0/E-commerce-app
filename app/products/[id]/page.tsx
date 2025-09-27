"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  const params = useParams(); 
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [adding, setAdding] = useState(false);

  // from CartContext: we now set the badge via server-returned totals
  const { applyTotals } = useCart();

  const money = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // fetch product
  useEffect(() => {
    const id = params?.id as string | undefined;
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch product");
        const data: Product = await res.json();
        setProduct(data);
        const first = data.variants && data.variants.length > 0 ? data.variants[0] : null;
        setSelectedVariant(first ?? null);
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

  if (loading) return <p className="p-4">Loading product...</p>;
  if (!product) return <p className="p-4 text-red-500">Product not found.</p>;

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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to add to cart (${res.status})`);
      }

      const data = await res.json();
      // Drive navbar badge from server truth (distinct item count)
      if (data?.totals) applyTotals(data.totals);

    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Something went wrong.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
      )}

      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      {product.description && (
        <p className="text-gray-600 mb-2">{product.description}</p>
      )}

      <p className="text-2xl font-semibold mb-2">
        {money.format(effectivePrice)}
      </p>
      <p className="text-sm text-gray-500 mb-4">Stock: {effectiveStock}</p>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-4">
          <p className="font-medium mb-2">Choose a Variant:</p>
          <div className="flex flex-col gap-2">
            {product.variants.map((v) => {
              const attrs = formatAttrs(v.attributes);
              const priceLabel =
                v.price != null ? money.format(v.price) : money.format(product.price);
              const isActive = selectedVariant?.id === v.id;

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`border rounded px-3 py-2 text-left ${
                    isActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                  }`}
                  title={attrs}
                >
                  <div className="text-sm">{attrs || "Variant"}</div>
                  <div className="text-xs text-gray-500">
                    SKU: {v.sku} | {priceLabel} | Stock: {v.stock}
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
          className="bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded w-full"
        >
          {adding ? "Adding..." : "🛒 Add to Cart"}
        </button>
      ) : (
        <p className="text-red-500">⚠️ Please log in to add items to cart.</p>
      )}
    </div>
  );
}
