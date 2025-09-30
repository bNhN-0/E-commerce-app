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
    <div className="w-full rounded-md border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
      <div className="p-2 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-6 lg:ml-15">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 items-start justify-center ">
        {/* --- Mobile Top Categories --- */}
        <div className="lg:hidden mb-4">
          <FeaturesCard />
        </div>

        {/* --- Products Section --- */}
        <div className="order-2 lg:order-1 lg:col-span-3 flex justify-center">
          <div className="w-full max-w-5xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-gray-900 tracking-tight">
              Featured Products
            </h2>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500">
                No products available.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {products.slice(0, 8).map((p) => (
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
                        {money.format(Number(p.price || 0))}
                      </p>

                      <Link
                        href={`/products/${p.id}`}
                        className="w-full text-center rounded bg-orange-400 text-white font-medium text-xs py-1.5 hover:opacity-90 transition"
                      >
                        🛍 Shop
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- Desktop Sidebar Categories --- */}
        <div className="hidden lg:block order-1 lg:order-2 w-44">
          <FeaturesCard />
        </div>
      </div>
    </section>
  );
}
