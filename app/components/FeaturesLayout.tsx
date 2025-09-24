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
 
      {/* Featured Products */}
      <div className="max-w-7xl mx-auto ml-20 grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Featured Products */}
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
            Featured Products
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
              {products.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-white border rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-transform duration-200 flex flex-col w-full max-w-xs"
                >
                  {/* Product Image */}
                  <Link href={`/products/${p.id}`} className="block">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full aspect-[4/3] object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center rounded-t-xl">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-base text-gray-900 truncate mb-1">
                      {p.name}
                    </h3>
                    <p className="text-blue-600 font-bold mb-4">${p.price}</p>

                    <div className="mt-auto flex gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        className="flex-1 bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-center text-sm hover:bg-gray-200 transition"
                      >
                        Details
                      </Link>
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                        Add to Cart
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
