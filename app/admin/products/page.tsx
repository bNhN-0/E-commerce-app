"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin: Products</h1>
      <a href="/admin/products/add" className="bg-blue-500 text-white px-4 py-2 rounded">
        Add Product
      </a>

      <ul className="mt-4">
        {products.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price} ({p.stock} in stock)
          </li>
        ))}
      </ul>
    </div>
  );
}
