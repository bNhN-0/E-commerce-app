"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchCartItems = async () => {
  if (!user) return;

  const { data: cart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!cart?.id) return;

  const { data: items } = await supabase
    .from("cart_items")
    .select("id, quantity, product:product_id(*)")
    .eq("cart_id", cart.id);

  setCartItems(items || []);
};


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🛒 Your Cart</h1>

      {cartItems.length === 0 ? (
        <p>Cart is empty.</p>
      ) : (
        <div>
          <ul className="space-y-2">
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <span>${item.product.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-bold">Total: ${totalPrice}</p>
        </div>
      )}
    </div>
  );
}
