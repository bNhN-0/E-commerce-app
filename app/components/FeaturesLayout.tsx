"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FeaturesCard from "./FeaturesCard";
import { useCart } from "./CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
};

export default function FeaturesLayout() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  // from CartContext
  const { applyTotals, refreshCart } = useCart();

  const money = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        const items: Product[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setProducts(items);
      } catch (e) {
        console.error("Failed to load products:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (productId: number) => {
    if (addingIds.has(productId)) return;

    setAddingIds((s) => new Set(s).add(productId));
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ productId, qty: 1 }),
      });

      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to add (HTTP ${res.status})`);
      }

      const payload = await res.json();
      // Prefer server totals → updates distinct item count correctly
      if (payload?.totals) {
        applyTotals(payload.totals);
      } else {
        await refreshCart();
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Could not add to cart.");
    } finally {
      setAddingIds((s) => {
        const next = new Set(s);
        next.delete(productId);
        return next;
      });
    }
  };

  const SkeletonCard = () => (
    <div className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-9 flex-1 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-7xl mx-auto ml-20 grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Featured Products</h2>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 8).map((p) => {
                const isAdding = addingIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="group relative w-full max-w-xs bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <Link href={`/products/${p.id}`} className="block relative">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full aspect-[4/3] object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" />
                    </Link>

                    <div className="p-4 flex flex-col">
                      <h3 className="font-medium text-sm text-gray-800 truncate group-hover:text-blue-600 transition mb-1">
                        {p.name}
                      </h3>
                      <p className="text-lg font-semibold text-gray-900 mb-3">
                        {money.format(Number(p.price || 0))}
                      </p>

                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/products/${p.id}`}
                          className="flex-1 text-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm py-2 hover:bg-gray-100 transition"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleAdd(p.id)}
                          disabled={isAdding}
                          className="flex-1 text-center rounded-xl bg-blue-600 text-white text-sm py-2 hover:bg-blue-700 transition disabled:opacity-60"
                        >
                          {isAdding ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories Sidebar */}
        <div className="flex justify-center">
          <FeaturesCard />
        </div>
      </div>
    </section>
  );
}
