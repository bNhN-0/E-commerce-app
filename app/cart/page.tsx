"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Fetch cart
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

  // Debounced API updater
  const updateQuantity = useCallback(
    (productId: number, variantId: number | null, newQty: number) => {
      // Optimistic UI update
      const prevCart = structuredClone(cart);
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

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const res = await fetch("/api/cart/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId, quantity: newQty }),
        });

        if (!res.ok) {
          console.warn("❌ Failed to update cart, reverting...");
          setCart(prevCart); // rollback
        }

        refreshCart();
      }, 400);
    },
    [cart, refreshCart]
  );

  // Checkout
  const handleCheckout = async () => {
    const res = await fetch("/api/orders", { method: "POST" });

    if (res.ok) {
      alert(" Order placed!");
      setCart({ items: [] });
      setCartCount(0);
      router.push("/orders");
    } else {
      const error = await res.json();
      alert(`❌ ${error.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const total = cart.items.reduce(
    (sum, item) =>
      sum + item.quantity * (item.variant?.price ?? item.product.price),
    0
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🛒 Your Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border rounded-lg bg-gray-50">
          <p className="mb-4">Your cart is empty.</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cart.items.map((item) => {
              const price = item.variant?.price ?? item.product.price;
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded text-gray-400">
                        📦
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-600">
                          {item.variant.attributes
                            .map((a) => `${a.name}: ${a.value}`)
                            .join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-gray-700">
                        {currency.format(price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.variant?.id ?? null,
                          item.quantity - 1
                        )
                      }
                      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.variant?.id ?? null,
                          item.quantity + 1
                        )
                      }
                      className="px-3 py-1 bg-gray-300 rounded"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-bold text-blue-600">
                    {currency.format(item.quantity * price)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Total + Checkout */}
          <div className="flex justify-between items-center font-bold text-xl mt-6 border-t pt-4">
            <span>Total:</span>
            <span className="text-green-700">{currency.format(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="mt-6 w-full bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition text-lg"
          >
            ✅ Place Order
          </button>
        </>
      )}
    </div>
  );
}
