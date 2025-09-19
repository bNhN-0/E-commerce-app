"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient"
import ProductCard from "./ProductCard";
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
  const handleAddToCart = async (productId: number) => {
    if (!user) {
      alert("Please login first!");
      return;
    }

    // Ensure user has a cart
    let { data: cart } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let cartId = cart?.id;
    if (!cartId) {
      const { data: newCart, error: createCartError } = await supabase
        .from("carts")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createCartError || !newCart) {
        console.error("Failed to create cart:", createCartError);
        return;
      }

      cartId = newCart.id;
    }

    // Add item to cart
    const { error } = await supabase
      .from("cart_items")
      .insert([{ cart_id: cartId, product_id: productId, quantity: 1 }]);

    if (error) console.error("Failed to add item:", error);
    else alert("Added to cart!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Products</h1>

      {!user && (
        <p className="mt-2">
          Please{" "}
          <Link href="localhost:3000/auth" className="text-blue-500 underline">
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
