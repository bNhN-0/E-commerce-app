"use client";

import { useState } from "react";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
      }),
    });

    setName("");
    setPrice("");
    setStock("0");
    alert("✅ Product created!");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="border p-2 block mb-2"
          required
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          type="number"
          className="border p-2 block mb-2"
          required
        />
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock"
          type="number"
          className="border p-2 block mb-2"
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Add Product
        </button>
      </form>
    </div>
  );
}
