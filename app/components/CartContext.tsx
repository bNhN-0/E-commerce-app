"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Totals = { totalItems?: number; totalAmount?: number };

type CartContextType = {
  cartCount: number;
  applyTotals: (totals?: Totals) => void;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const applyTotals = useCallback((totals?: Totals) => {
    if (totals && typeof totals.totalItems === "number") {
      setCartCount(totals.totalItems);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        setCartCount(0);
        return;
      }
      const data = await res.json();
      if (typeof data?.totalItems === "number") {
        setCartCount(data.totalItems);
      } else if (Array.isArray(data?.items)) {
        setCartCount(data.items.length);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, applyTotals, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
