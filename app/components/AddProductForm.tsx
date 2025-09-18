"use client";
import { useState } from "react";

export default function AddProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price: parseFloat(price), stock: 10 }),
    });

    setName("");
    setPrice("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product name"
        className="border p-2"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        type="number"
        className="border p-2 ml-2"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 ml-2">
        Add Product
      </button>
    </form>
  );
}
