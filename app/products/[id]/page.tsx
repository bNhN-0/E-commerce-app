"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

export default function ProductDetailPage() {
  const params = useParams(); // { id }
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add to cart");
      }
      alert("Added to cart!");
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
      <p className="text-2xl font-semibold mb-2">${product.price}</p>
      <p className="text-sm text-gray-500 mb-4">Stock: {product.stock}</p>

      {/*  Only show button if logged in */}
      {user ? (
        <button
          onClick={handleAddToCart}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add to Cart
        </button>
      ) : (
        <p className="text-red-500">⚠️ Please log in to add items to cart.</p>
      )}
    </div>
  );
}
