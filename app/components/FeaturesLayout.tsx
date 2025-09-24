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
    <section className="container mx-auto px-4 py-12">
      <div className="flex gap-8 items-start">
        {/* Left side - Featured Products */}
        <div className="flex-1">
          <h2 className="text-3xl font-semibold mb-6 text-center md:text-left">
            Featured Products
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500">No products available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="border rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
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
        </div>

        {/* Right side - Featured Categories */}
        <div className="bg-white rounded-2xl shadow p-4 md:w-48">
          <FeaturesCard />
        </div>
      </div>
    </section>
  );
};

export default FeaturesLayout;
