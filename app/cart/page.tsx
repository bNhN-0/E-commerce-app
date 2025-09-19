"use client";

import { useEffect, useState } from "react";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("/api/cart");
        const data = await res.json();
        setItems(data?.items || []);
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  if (loading) return <p className="p-4">Loading cart...</p>;

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border-b py-2"
            >
              <div>
                <h2 className="font-semibold">{item.product.name}</h2>
                <p>
                  ${item.product.price} × {item.quantity}
                </p>
              </div>
              <p className="font-bold">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          <div className="mt-4 flex justify-between font-bold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded">
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
