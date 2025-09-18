"use client";

import { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number) => {
    // Replace this with actual user ID from auth (Supabase or your own session)
    const userId = "USER_ID_HERE";

    if (!userId) return alert("Please log in first!");

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId, quantity: 1 }),
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    }
  };

  if (loading) return <div className="p-6">Loading products...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Products</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={() => handleAddToCart(product.id)}
          />
        ))}
      </div>

      {!products.length && !loading && <p>No products found.</p>}
    </div>
  );
}
