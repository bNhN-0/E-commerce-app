"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import FeaturesCard from "./FeaturesCard";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
};

const FeaturesLayout = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.data || data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-7xl mx-auto ml-20 grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
            Featured Products
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 8).map((p) => (
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

                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition"></div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 flex flex-col">
                    <h3 className="font-medium text-sm text-gray-800 truncate group-hover:text-blue-600 transition mb-1">
                      {p.name}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 mb-3">
                      ${p.price}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <Link
                        href={`/products/${p.id}`}
                        className="flex-1 text-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm py-2 hover:bg-gray-100 transition"
                      >
                        Details
                      </Link>
                      <button className="flex-1 text-center rounded-xl bg-blue-600 text-white text-sm py-2 hover:bg-blue-700 transition">
                        Add
                      </button>
                    </div>
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
};

export default FeaturesLayout;
