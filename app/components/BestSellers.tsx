"use client";
import Link from "next/link";

const bestSellers = [
  {
    id: 1,
    name: "Smart Watch X200",
    price: "$199",
    image: "/images/products/watch.jpg",
  },
  {
    id: 2,
    name: "Noise Cancelling Headphones",
    price: "$299",
    image: "/images/products/headphones.jpg",
  },
  {
    id: 3,
    name: "Sneakers Pro",
    price: "$89",
    image: "/images/products/sneakers.jpg",
  },
];

export default function BestSellers() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-2xl font-bold text-center mb-8">Best Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {bestSellers.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-4"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-indigo-600 font-bold">{product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
