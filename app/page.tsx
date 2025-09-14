"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import ProductCard from "./components/ProductCard";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Fetch logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) console.error(error);
      else setProducts(data || []);
    };
    fetchProducts();
  }, []);

  // Add product to cart
  const addToCart = async (productId: number) => {
    if (!user) return alert("Please log in first!");

    // 1️⃣ Ensure user exists in 'users' table
    await supabase.from("users").upsert({
      id: user.id,
      name: user.email,
      email: user.email,
    });

    // 2️⃣ Get or create user's cart
    let { data: cart } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      const { data: newCart, error: createCartError } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createCartError) {
        console.error("Failed to create cart:", createCartError);
        return;
      }
      cart = newCart;
    }

    // 3️⃣ Add or update cart item
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .single();

    if (existingItem) {
      await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert([
        {
          cart_id: cart.id,
          product_id: productId,
          quantity: 1,
        },
      ]);
    }

    alert("Added to cart!");
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
            addToCart={() => addToCart(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
