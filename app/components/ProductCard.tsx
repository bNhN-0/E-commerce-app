"use client";

import { useState } from "react";

export default function ProductCard({ product }: { product: any }) {
  const [adding, setAdding] = useState(false);

  const addToCart = () => {
    setAdding(true);
    // Demo: just reset state after 0.5s
    setTimeout(() => setAdding(false), 500);
  };

  return (
    <div className="bg-white shadow rounded p-4 flex flex-col">
      <div className="aspect-[4/3] bg-gray-100 mb-3 flex items-center justify-center">
        <img
          src={product.image || "/placeholder.png"}
          alt={product.name}
          className="object-cover w-full h-full rounded"
        />
      </div>
      <h2 className="font-semibold text-lg">{product.name}</h2>
      <p className="text-gray-600 text-sm flex-1">{product.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold">${parseFloat(product.price).toFixed(2)}</span>
        <button
          onClick={addToCart}
          disabled={adding}
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
