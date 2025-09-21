"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">
          🛍️ Welcome to <span className="text-blue-600"></span>
        </h1>
        <p className="mb-6 text-gray-600 text-lg">
          Discover amazing products, add them to your cart, and enjoy seamless checkout. <br />
          <span className="font-medium text-gray-800">Admins</span> can manage inventory with ease.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition"
          >
            Browse Products
          </Link>
          <Link
            href="/account/profile"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg shadow transition"
          >
            My Account
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Featured Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gray-100 rounded-lg p-6 text-center shadow hover:shadow-md transition">
            <p className="text-lg font-semibold">👕 Fashion</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 text-center shadow hover:shadow-md transition">
            <p className="text-lg font-semibold">💻 Electronics</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 text-center shadow hover:shadow-md transition">
            <p className="text-lg font-semibold">🏠 Home & Living</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="border rounded-lg shadow hover:shadow-md transition p-4 flex flex-col"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-40 object-cover rounded mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center mb-3 rounded">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-gray-600 mb-2">${p.price}</p>
                <Link
                  href={`/products/${p.id}`}
                  className="mt-auto bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 transition"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Ready to start shopping?</h2>
        <p className="text-gray-600 mb-4">
          Explore our wide range of products and enjoy a smooth shopping experience.
        </p>
        <Link
          href="/products"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition"
        >
          Shop Now
        </Link>
      </section>
    </main>
  );
}
