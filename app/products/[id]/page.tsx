"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Attribute = {
  id: number;
  name: string;
  value: string;
};

type Variant = {
  id: number;
  sku: string;
  price?: number;
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
  variants: Variant[];
};

export default function ProductDetailPage() {
  const params = useParams(); // { id }
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  //  get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  //  fetch product
  useEffect(() => {
    if (!params?.id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        setProduct(data);

        // pick first variant by default
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  if (loading) return <p className="p-4">Loading product...</p>;
  if (!product) return <p className="p-4 text-red-500">Product not found.</p>;

  const handleAddToCart = async () => {
    try {
      const body = selectedVariant
        ? { productId: product.id, variantId: selectedVariant.id, quantity: 1 }
        : { productId: product.id, quantity: 1 };

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add to cart");
      }
      alert("✅ Added to cart!");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Something went wrong.");
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
      <p className="text-gray-600 mb-2">{product.description}</p>
      <p className="text-2xl font-semibold mb-2">
        ${selectedVariant?.price ?? product.price}
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Stock: {selectedVariant?.stock ?? product.stock}
      </p>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-4">
          <p className="font-medium mb-2">Choose a Variant:</p>
          <div className="flex flex-col gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`border rounded px-3 py-2 text-left ${
                  selectedVariant?.id === v.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <div className="text-sm">
                  {v.attributes.map((a) => `${a.name}: ${a.value}`).join(", ")}
                </div>
                <div className="text-xs text-gray-500">
                  SKU: {v.sku} | ${v.price ?? product.price} | Stock: {v.stock}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Only show button if logged in */}
      {user ? (
        <button
          onClick={handleAddToCart}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          🛒 Add to Cart
        </button>
      ) : (
        <p className="text-red-500">
          ⚠️ Please log in to add items to cart.
        </p>
      )}
    </div>
  );
}
