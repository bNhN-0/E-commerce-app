"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function CheckoutPage() {
  const [cart, setCart] = useState<{ items: CartItem[] }>({ items: [] });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .finally(() => setLoading(false));
  }, []);

  const total = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const handleCheckout = async () => {
    const res = await fetch("/api/orders", { method: "POST" });
    if (res.ok) {
      alert("✅ Order placed!");
      router.push("/orders");
    } else {
      const error = await res.json();
      alert(`❌ ${error.error}`);
    }
  };

  if (loading) return <p className="p-4">Loading checkout...</p>;

  if (cart.items.length === 0) {
    return <p className="p-4">Your cart is empty.</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {cart.items.map((item) => (
        <div key={item.id} className="flex justify-between py-2 border-b">
          <span>
            {item.product.name} × {item.quantity}
          </span>
          <span>${item.product.price * item.quantity}</span>
        </div>
      ))}

      <div className="flex justify-between font-bold text-lg mt-4">
        <span>Total:</span>
        <span>${total}</span>
      </div>

      <button
        onClick={handleCheckout}
        className="mt-6 w-full bg-green-600 text-white px-4 py-2 rounded"
      >
        Place Order
      </button>
    </div>
  );
}
