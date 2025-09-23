"use client";

import { createContext, useContext, useState, useEffect } from "react";

type CartContextType = {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setCartCount(data?.items?.length || 0); 
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  // Fetch cart on mount
  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
