"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Variant = {
  id: number;
  sku: string;
  price: number | null;
  stock: number;
  attributes: unknown;
};

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  averageRating?: number | null;
  reviewCount?: number;
  variants?: Variant[];
  soldLastNDays?: number;
};

type Props = {
  days?: number;           // lookback window
  limit?: number;          // how many to show
  categoryId?: number;     //  limit to a category
  category?: string;       //  by category name
  title?: string;
  className?: string;
};

export default function BestSellers({
  days = 30,
  limit = 3,
  categoryId,
  category,
  title = "Best Sellers",
  className = "",
}: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // bucket sold count for nicer UI: 1–9, 10+, 50+, 100+, 500+
  const formatSold = (n?: number) => {
    if (!n || n <= 0) return undefined;
    if (n < 10) return `${n} sold recently`;
    if (n < 50) return `10+ sold`;
    if (n < 100) return `50+ sold`;
    if (n < 500) return `100+ sold`;
    return `500+ sold`;
  };

  useEffect(() => {
    const qs = new URLSearchParams({
      sort: "best",
      days: String(days),
      limit: String(limit),
    });
    if (categoryId) qs.set("categoryId", String(categoryId));
    if (category) qs.set("category", category);

    setLoading(true);
    fetch(`/api/products?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { data?: Product[] }) => setItems(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [days, limit, categoryId, category]);

  const cards = useMemo(() => items.slice(0, limit), [items, limit]);

  if (loading) {
    return (
      <section className={className}>
        <h2 className="text-xl font-semibold mb-4">🔥 {title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (cards.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-4">🔥 {title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((p) => (
          <div
            key={p.id}
            className="group border rounded-2xl shadow hover:shadow-xl transition overflow-hidden bg-white flex flex-col"
          >
            <Link href={`/products/${p.id}`} className="block relative w-full h-48">
              <span className="absolute left-3 top-3 z-10 text-[11px] font-semibold bg-amber-500 text-white px-2 py-1 rounded">
                Best Seller
              </span>

              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </Link>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-semibold text-lg truncate">{p.name}</h3>

              {p.description ? (
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{p.description}</p>
              ) : null}

              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-600">${p.price.toFixed(2)}</span>
                {formatSold(p.soldLastNDays) && (
                  <span className="text-xs text-gray-500">{formatSold(p.soldLastNDays)}</span>
                )}
              </div>

              {p.stock > 0 ? (
                <p className="text-xs text-emerald-600 mb-3">In stock</p>
              ) : (
                <p className="text-xs text-gray-500 mb-3">Out of stock</p>
              )}
            </div>

            <Link
              href={`/products/${p.id}`}
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 rounded-b-2xl transition font-medium"
            >
              🛍 Shop it
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
