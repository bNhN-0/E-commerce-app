"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

type Totals = { totalItems?: number; totalAmount?: number };

export type CartContextType = {
  cartCount: number;
  setCartCount: Dispatch<SetStateAction<number>>;
  applyTotals: (totals?: Totals) => void;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

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
      } else if (Array.isArray(data?.data)) {
        setCartCount(data.data.length);
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
    <CartContext.Provider
      value={{ cartCount, setCartCount, applyTotals, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
