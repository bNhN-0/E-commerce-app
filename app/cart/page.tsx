"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCart = async () => {
      const { data } = await supabase
        .from("carts")
        .select(`id, cart_items (*, product:product_id(*))`)
        .eq("user_id", user.id)
        .single();
      setCartItems(data?.cart_items || []);
    };
    fetchCart();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Your Cart</h1>
      {cartItems.length === 0 ? <p>Cart is empty.</p> : (
        <ul>
          {cartItems.map((item) => (
            <li key={item.id}>
              {item.product.name} x {item.quantity} - ${item.product.price * item.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
