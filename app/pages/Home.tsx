"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSection from "../components/HeroSection";
import FeaturesCard from "../components/FeaturesCard";
import Footer from "../components/Footer"

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
      .then((data) => setProducts(data.data || data)) 
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-7xl mx-auto">
       <HeroSection></HeroSection>
       <FeaturesCard></FeaturesCard>




      {/* Featured Products */}
      <section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Featured Products
        </h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((p) => (
              <div
                key={p.id}
                className="border rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center mb-3 rounded">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <h3 className="font-semibold text-lg">{p.name}</h3>
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

      {/* Features Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          🚚 <p className="font-semibold mt-2">Free Shipping</p>
          <p className="text-sm text-gray-600">On all orders over $50</p>
        </div>
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          🔒 <p className="font-semibold mt-2">Secure Payment</p>
          <p className="text-sm text-gray-600">100% safe & encrypted</p>
        </div>
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          📞 <p className="font-semibold mt-2">24/7 Support</p>
          <p className="text-sm text-gray-600">We’re here to help anytime</p>
        </div>
      </section>

      <Footer></Footer>

 
    </main>
  );
}
