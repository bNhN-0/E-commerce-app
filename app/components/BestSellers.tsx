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
  days?: number;
  limit?: number;
  categoryId?: number;
  category?: string;
  title?: string;
};

export default function BestSellers({
  days = 30,
  limit = 3,
  categoryId,
  category,
  title = "Best Sellers",
}: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
      .then((json: { data?: Product[] }) =>
        setItems(Array.isArray(json?.data) ? json.data : [])
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [days, limit, categoryId, category]);

  const cards = useMemo(() => items.slice(0, limit), [items, limit]);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">🔥 {title}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="w-full aspect-[1/1] rounded-md bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (cards.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-6 ">
      <h2 className="text-xl font-semibold mb-4">🔥 {title}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((p) => (
          <div
            key={p.id}
            className="group relative w-full bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* Image */}
            <Link href={`/products/${p.id}`} className="block relative">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  width={300}
                  height={300}
                  className="w-full aspect-[1/1] object-cover rounded-t-md group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 45vw, (max-width: 1280px) 25vw, 20vw"
                  unoptimized
                />
              ) : (
                <div className="w-full aspect-[1/1] bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </Link>

            {/* Content */}
            <div className="p-2 flex flex-col">
              <h3 className="font-medium text-xs sm:text-sm text-gray-800 truncate group-hover:text-indigo-600 transition mb-1">
                {p.name}
              </h3>
              <p className="text-sm font-bold text-gray-900 mb-1">
                ${p.price.toFixed(2)}
              </p>

              {p.stock > 0 ? (
                <p className="text-[11px] text-emerald-600 mb-2">In stock</p>
              ) : (
                <p className="text-[11px] text-gray-500 mb-2">Out of stock</p>
              )}

              <Link
                href={`/products/${p.id}`}
                className="w-full text-center rounded bg-indigo-400 text-white font-medium text-xs py-1.5 hover:opacity-90 transition"
              >
                🛍 Shop
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
