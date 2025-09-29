"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import FeaturesCard from "./FeaturesCard";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
};

export default function FeaturesLayout() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        const items: Product[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setProducts(items);
      } catch (e) {
        console.error("Failed to load products:", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const SkeletonCard = () => (
    <div className="w-full max-w-xs rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-9 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-7xl mx-auto ml-20 grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">
            Featured Products
          </h2>

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
              {products.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="group relative w-full max-w-xs bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <Link href={`/products/${p.id}`} className="block relative">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={800}
                        height={600}
                        className="w-full aspect-[4/3] object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" />
                  </Link>

                  {/* Content */}
                  <div className="p-4 flex flex-col">
                    <h3 className="font-semibold text-base text-gray-800 truncate group-hover:text-indigo-600 transition mb-1">
                      {p.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mb-4">
                      {money.format(Number(p.price || 0))}
                    </p>

                    <Link
                      href={`/products/${p.id}`}
                      className="w-full text-center rounded-xl bg-orange-400 text-white font-semibold text-sm py-2.5 hover:opacity-90 transition shadow-md"
                    >
                       🛍 Shop It !
                    </Link>
                  </div>
                </div>
              ))}
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
