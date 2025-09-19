"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">🏪 Welcome to Shoply Store</h1>
      <p className="mb-6 text-gray-600">
        Browse products, add them to your cart, and place orders. 
        Admins can manage products from the dashboard.
      </p>

      <div className="flex gap-4">
        <Link
          href="/products"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          View Products
        </Link>

        <Link
          href="/admin/products"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
