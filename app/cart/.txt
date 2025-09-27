"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "../components/CartContext";

type VariantAttributes =
  | Record<string, unknown>
  | Array<{ name?: unknown; value?: unknown } | unknown>
  | null;

type CartItem = {
  id: number;
  quantity: number;
  productId?: number;
  variantId?: number | null;

  // snapshots (optional)
  productName?: string;
  productImageUrl?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  variantSku?: string | null;
  variantAttributes?: VariantAttributes;

  // fallbacks
  product?: { id: number; name: string; price: number; imageUrl?: string | null };
  variant?: {
    id: number;
    sku: string;
    price?: number | null;
    attributes?: VariantAttributes;
  } | null;
};

type CartSnapshot = {
  id: number | null;
  userId: string;
  totalItems: number;   // DISTINCT count (lines)
  totalAmount: number;
  createdAt: string | null;
  items: CartItem[];
};

// util: format attributes safely
const formatAnyAttrs = (attrs: unknown): string => {
  if (!attrs) return "";
  if (Array.isArray(attrs)) {
    if (attrs.length > 0 && typeof attrs[0] === "object" && attrs[0] !== null) {
      return (attrs as Array<{ name?: unknown; value?: unknown }>)
        .map((a) =>
          a && "name" in a && "value" in a
            ? `${String((a as any).name)}: ${String((a as any).value)}`
            : String(a)
        )
        .join(", ");
    }
    return (attrs as any[]).map(String).join(", ");
  }
  if (typeof attrs === "object") {
    return Object.entries(attrs as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(", ");
  }
  return String(attrs);
};

// local helpers
const sumQty = (items: CartItem[]) => items.reduce((s, i) => s + i.quantity, 0);
const sumAmount = (items: CartItem[]) =>
  items.reduce((s, i) => {
    const unit = i.unitPrice ?? i.variant?.price ?? i.product?.price ?? 0;
    return s + unit * i.quantity;
  }, 0);

export default function CartPage() {
  const [cart, setCart] = useState<CartSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLines, setPendingLines] = useState<Set<number>>(new Set());
  const [clearing, setClearing] = useState(false);

  const router = useRouter();

  // CartContext — prefer applyTotals (distinct count), fallback to setCartCount
  const cartCtx = useCart() as any;
  const applyTotals: undefined | ((t: { totalItems?: number; totalAmount?: number; qty?: number }) => void) =
    cartCtx?.applyTotals;
  const setCartCount: undefined | ((n: number) => void) = cartCtx?.setCartCount;

  const money = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  // Initial fetch (hydrate page + navbar badge with DISTINCT count from server)
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
        const data: CartSnapshot = await res.json();

        setCart(data);

        const qty = sumQty(data.items);
        if (applyTotals) applyTotals({ totalItems: data.totalItems, totalAmount: data.totalAmount, qty });
        else if (setCartCount) setCartCount(data.totalItems ?? 0);
      } catch (e) {
        console.error(e);
        const empty: CartSnapshot = {
          id: null,
          userId: "",
          totalItems: 0,
          totalAmount: 0,
          createdAt: null,
          items: [],
        };
        setCart(empty);
        if (applyTotals) applyTotals({ totalItems: 0, totalAmount: 0, qty: 0 });
        else if (setCartCount) setCartCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [router, applyTotals, setCartCount]);

  const setLinePending = (lineId: number, on: boolean) => {
    setPendingLines((prev) => {
      const next = new Set(prev);
      if (on) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  };

  // PATCH /api/cart/update — set quantity (0 = delete)
  const updateQuantity = useCallback(
    async (lineId: number, newQty: number) => {
      if (!cart || newQty < 0 || pendingLines.has(lineId)) return;

      const prev = structuredClone(cart);
      const target = cart.items.find((i) => i.id === lineId);
      if (!target) return;

      const nextItems = cart.items
        .map((i) => (i.id === lineId ? { ...i, quantity: newQty } : i))
        .filter((i) => i.quantity > 0);

      const localAmount = sumAmount(nextItems);
      const localDistinct = nextItems.length;
      const localQty = sumQty(nextItems);

      setCart({ ...cart, items: nextItems, totalAmount: localAmount, totalItems: localDistinct });
      if (newQty === 0) {
        if (applyTotals) applyTotals({ totalItems: localDistinct, totalAmount: localAmount, qty: localQty });
        else if (setCartCount) setCartCount(localDistinct);
      }

      setLinePending(lineId, true);
      try {
        const res = await fetch("/api/cart/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId, qty: newQty }),
        });
        if (!res.ok) throw new Error("update failed");
        const data = await res.json();

        if (data?.totals) {
          if (applyTotals) applyTotals({ totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount, qty: localQty });
          else if (setCartCount) setCartCount(data.totals.totalItems ?? localDistinct);

          setCart((c) =>
            c ? { ...c, totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount } : c
          );
        } else if (data?.items) {
          const snap = data as CartSnapshot;
          const qty2 = sumQty(snap.items);
          if (applyTotals) applyTotals({ totalItems: snap.totalItems, totalAmount: snap.totalAmount, qty: qty2 });
          else if (setCartCount) setCartCount(snap.totalItems ?? localDistinct);
          setCart(snap);
        }
      } catch (e) {
        console.warn("❌ Failed to update cart, reverting", e);
        setCart(prev);
        const qtyPrev = sumQty(prev.items);
        if (applyTotals) applyTotals({ totalItems: prev.totalItems, totalAmount: prev.totalAmount, qty: qtyPrev });
        else if (setCartCount) setCartCount(prev.totalItems ?? 0);
      } finally {
        setLinePending(lineId, false);
      }
    },
    [cart, pendingLines, applyTotals, setCartCount]
  );

  // Remove line (POST /api/cart/remove)
  const removeLine = useCallback(
    async (lineId: number) => {
      if (!cart || pendingLines.has(lineId)) return;

      const prev = structuredClone(cart);
      const nextItems = cart.items.filter((i) => i.id !== lineId);

      const localAmount = sumAmount(nextItems);
      const localDistinct = nextItems.length;
      const localQty = sumQty(nextItems);

      // optimistic: distinct count decreases by 1
      setCart({ ...cart, items: nextItems, totalAmount: localAmount, totalItems: localDistinct });
      if (applyTotals) applyTotals({ totalItems: localDistinct, totalAmount: localAmount, qty: localQty });
      else if (setCartCount) setCartCount(localDistinct);

      setLinePending(lineId, true);
      try {
        const res = await fetch("/api/cart/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineId }),
        });
        if (!res.ok) throw new Error("remove failed");
        const data = await res.json();

        if (data?.totals) {
          if (applyTotals) applyTotals({ totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount, qty: localQty });
          else if (setCartCount) setCartCount(data.totals.totalItems ?? localDistinct);

          setCart((c) =>
            c ? { ...c, totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount } : c
          );
        } else if (data?.items) {
          const snap = data as CartSnapshot;
          const qty2 = sumQty(snap.items);
          if (applyTotals) applyTotals({ totalItems: snap.totalItems, totalAmount: snap.totalAmount, qty: qty2 });
          else if (setCartCount) setCartCount(snap.totalItems ?? localDistinct);
          setCart(snap);
        }
      } catch (e) {
        console.warn("❌ Failed to remove line, reverting", e);
        setCart(prev);
        const qtyPrev = sumQty(prev.items);
        if (applyTotals) applyTotals({ totalItems: prev.totalItems, totalAmount: prev.totalAmount, qty: qtyPrev });
        else if (setCartCount) setCartCount(prev.totalItems ?? 0);
      } finally {
        setLinePending(lineId, false);
      }
    },
    [cart, pendingLines, applyTotals, setCartCount]
  );

  // Clear cart (DELETE /api/cart)
  const clearCart = useCallback(async () => {
    if (!cart || cart.items.length === 0 || clearing) return;

    const prev = structuredClone(cart);
    setClearing(true);

    // optimistic clear
    setCart({ ...cart, items: [], totalItems: 0, totalAmount: 0 });
    if (applyTotals) applyTotals({ totalItems: 0, totalAmount: 0, qty: 0 });
    else if (setCartCount) setCartCount(0);

    try {
      const res = await fetch("/api/cart", { method: "DELETE" });
      if (!res.ok) throw new Error("clear failed");
      const data = await res.json();

      if (data?.totals) {
        if (applyTotals) applyTotals({ totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount, qty: 0 });
        else if (setCartCount) setCartCount(data.totals.totalItems ?? 0);

        setCart((c) =>
          c ? { ...c, totalItems: data.totals.totalItems, totalAmount: data.totals.totalAmount, items: [] } : c
        );
      } else if (data?.items) {
        const snap = data as CartSnapshot;
        if (applyTotals) applyTotals({ totalItems: snap.totalItems, totalAmount: snap.totalAmount, qty: 0 });
        else if (setCartCount) setCartCount(snap.totalItems ?? 0);
        setCart(snap);
      }
    } catch (e) {
      console.warn("❌ Failed to clear cart, reverting", e);
      setCart(prev);
      const qtyPrev = sumQty(prev.items);
      if (applyTotals) applyTotals({ totalItems: prev.totalItems, totalAmount: prev.totalAmount, qty: qtyPrev });
      else if (setCartCount) setCartCount(prev.totalItems ?? 0);
    } finally {
      setClearing(false);
    }
  }, [cart, clearing, applyTotals, setCartCount]);

  // Checkout
  const handleCheckout = async () => {
    const res = await fetch("/api/orders", { method: "POST" });
    if (res.ok) {
      alert("✅ Order placed!");
      setCart((c) => (c ? { ...c, items: [], totalItems: 0, totalAmount: 0 } : c));
      if (applyTotals) applyTotals({ totalItems: 0, totalAmount: 0, qty: 0 });
      else if (setCartCount) setCartCount(0);
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

  const total =
    cart?.totalAmount ??
    sumAmount(cart?.items ?? []) ??
    0;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🛒 Your Cart</h1>
        <button
          onClick={clearCart}
          disabled={!cart || cart.items.length === 0 || clearing}
          className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          title="Clear cart"
        >
          {clearing ? "Clearing..." : "Clear Cart"}
        </button>
      </div>

      {!cart || cart.items.length === 0 ? (
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
              const name = item.productName ?? item.product?.name ?? "Product";
              const img = item.productImageUrl ?? item.product?.imageUrl ?? null;
              const unit = item.unitPrice ?? item.variant?.price ?? item.product?.price ?? 0;

              const attrs =
                item.variantAttributes != null
                  ? formatAnyAttrs(item.variantAttributes)
                  : formatAnyAttrs(item.variant?.attributes);

              const disabled = pendingLines.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {img ? (
                      <img src={img} alt={name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded text-gray-400">
                        📦
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{name}</p>
                      {attrs && <p className="text-xs text-gray-600">{attrs}</p>}
                      <p className="text-sm text-gray-700">{money.format(unit)} each</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                      disabled={disabled || item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="min-w-[24px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                      disabled={disabled}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-bold text-blue-600 min-w-[84px] text-right">
                      {money.format(item.quantity * unit)}
                    </p>
                    <button
                      onClick={() => removeLine(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                      disabled={disabled}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center font-bold text-xl mt-6 border-t pt-4">
            <span>Total:</span>
            <span className="text-green-700">{money.format(total)}</span>
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
