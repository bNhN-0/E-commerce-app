"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import ProductCard from "./components/ProductCard";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) console.error(error);
      else setProducts(data);
    };
    fetchProducts();
  }, []);

  // Add product to cart
  const handleAddToCart = async (productId: number) => {
    if (!user) return alert("Please login first!");
    // Ensure user has a cart
    const { data: cart } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let cartId = cart?.id;
    if (!cartId) {
      const { data: newCart } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select()
        .single();
      cartId = newCart.id;
    }

    // Add item to cart
    await supabase.from("cart_items").insert([{ cart_id: cartId, product_id: productId, quantity: 1 }]);
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
            user={user}
            addToCart={() => handleAddToCart(product.id)}
          />
        ))}
      </div>
    </div>
  );
}
