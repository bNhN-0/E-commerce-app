"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../app/lib/supabaseClient";
import ProductCard from "./components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ✅ Get current logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // ✅ Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      let { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("Error fetching products:", error.message);
      } else {
        setProducts(data);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Handle adding product to cart
  const handleAddToCart = async (productId: number) => {
    if (!user) {
      alert("Please log in first!");
      return;
    }

    const { error } = await supabase.from("cart_items").insert([
      { user_id: user.id, product_id: productId, quantity: 1 },
    ]);

    if (error) {
      console.error("Error adding to cart:", error.message);
      alert("Failed to add to cart.");
    } else {
      alert("Added to cart!");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Products</h1>

      {!user && (
        <p className="mt-2">
          Please{" "}
          <Link href="/auth" className="text-blue-500 underline">
            log in
          </Link>{" "}
          to add items to cart.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 mt-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            user={user}
            addToCart={() => handleAddToCart(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
