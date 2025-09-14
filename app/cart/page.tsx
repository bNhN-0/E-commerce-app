"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchCart = async () => {
      let { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, products(id, name, price, image_url)")
        .eq("user_id", user.id);

      if (error) console.error(error);
      else setCartItems(data);
    };

    fetchCart();
  }, [user]);

  // ✅ Remove item
  const removeItem = async (id: number) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  // ✅ Increase/decrease quantity
  const updateQuantity = async (id: number, newQty: number) => {
    if (newQty < 1) return;
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", id);
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQty } : item
      )
    );
  };

  if (!user) {
    return (
      <div className="p-6">
        <p>
          Please{" "}
          <Link href="/auth" className="text-blue-500 underline">
            log in
          </Link>{" "}
          to view your cart.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🛒 My Cart</h1>

      {cartItems.length === 0 ? (
        <p>No items in cart.</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="border p-4 flex items-center gap-4">
              <img
                src={item.products.image_url}
                alt={item.products.name}
                className="w-20 h-20 object-cover"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
                  {item.products.name}
                </h2>
                <p>${item.products.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                    className="px-2 bg-gray-300 rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    className="px-2 bg-gray-300 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}

          {/* ✅ Cart total */}
          <div className="mt-6 text-xl font-bold">
            Total: $
            {cartItems
              .reduce(
                (sum, item) =>
                  sum + item.products.price * item.quantity,
                0
              )
              .toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
