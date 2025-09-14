"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // ✅ Fetch logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // ✅ Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      let { data, error } = await supabase.from("products").select("*");
      if (error) console.error(error);
      else setProducts(data || []); // ← FIX applied here

    };
    fetchProducts();
  }, []);

  // ✅ Add to cart
  const addToCart = async (productId: number) => {
    if (!user) {
      alert("Please log in first!");
      return;
    }

    let { error } = await supabase.from("cart_items").insert([
      { user_id: user.id, product_id: productId, quantity: 1 },
    ]);

    if (error) console.error(error);
    else alert("Added to cart!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Products</h1>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {products.map((p) => (
          <div key={p.id} className="border p-4 rounded-lg">
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-32 object-cover"
            />
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p>${p.price}</p>
            <button
              onClick={() => addToCart(p.id)}
              className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
