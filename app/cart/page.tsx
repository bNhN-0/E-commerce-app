"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../components/CartContext";

type CartItem = {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  };
  variant?: {
    id: number;
    sku: string;
    price?: number;
    attributes: { id: number; name: string; value: string }[];
  } | null;
};

export default function CartPage() {
  const [cart, setCart] = useState<{ items: CartItem[] }>({ items: [] });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { refreshCart, setCartCount } = useCart();

  useEffect(() => {
    const fetchCart = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch cart");

        const data = await res.json();
        setCart(data || { items: [] });
      } catch (err) {
        console.error("Error fetching cart:", err);
        setCart({ items: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  let timer: NodeJS.Timeout;

  const updateQuantity = (
    productId: number,
    variantId: number | null,
    newQty: number
  ) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items
        .map((item) =>
          item.product.id === productId && item.variant?.id === variantId
            ? { ...item, quantity: newQty }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));

    clearTimeout(timer);
    timer = setTimeout(async () => {
      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity: newQty }),
      });

      if (!res.ok) {
        alert(" Failed to update cart, refreshing...");
        const data = await fetch("/api/cart").then((r) => r.json());
        setCart(data);
      }

      refreshCart();
    }, 400);
  };

  const handleCheckout = async () => {
    const res = await fetch("/api/orders", { method: "POST" });

    if (res.ok) {
      alert(" Order placed!");
      setCart({ items: [] });
      setCartCount(0);
      router.push("/orders");
    } else {
      const error = await res.json();
      alert(` ${error.error}`);
    }
  };

  if (loading) return <p className="p-4">Loading cart...</p>;

  const total = cart.items.reduce(
    (sum, item) =>
      sum +
      item.quantity *
        (item.variant?.price ?? item.product.price), 
    0
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-2"
            >
              <div className="flex items-center gap-3">
                {item.product.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  {item.variant && (
                    <p className="text-sm text-gray-600">
                      {item.variant.attributes
                        .map((a) => `${a.name}: ${a.value}`)
                        .join(", ")}
                    </p>
                  )}
                  <p>
                    $
                    {item.variant?.price != null
                      ? item.variant.price
                      : item.product.price}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(
                      item.product.id,
                      item.variant?.id ?? null,
                      item.quantity - 1
                    )
                  }
                  className="px-2 py-1 bg-gray-300 rounded"
                >
                  –
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(
                      item.product.id,
                      item.variant?.id ?? null,
                      item.quantity + 1
                    )
                  }
                  className="px-2 py-1 bg-gray-300 rounded"
                >
                  +
                </button>
              </div>
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
        </>
      )}
    </div>
  );
}
