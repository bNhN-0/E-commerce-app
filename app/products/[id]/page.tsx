"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

export default function ProductDetailPage() {
  const params = useParams(); // ✅ get { id } from the URL
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params?.id]);

  if (loading) return <p className="p-4">Loading product...</p>;
  if (!product) return <p className="p-4 text-red-500">Product not found.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
      )}
      <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
      <p className="text-gray-600 mb-2">{product.description}</p>
      <p className="text-2xl font-semibold mb-2">${product.price}</p>
      <p className="text-sm text-gray-500 mb-4">Stock: {product.stock}</p>

      {/*Add to Cart button  */}
     <button
  onClick={async () => {
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      alert("Added to cart!");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Could not add to cart.");
    }
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
  Add to Cart
</button>
    </div>
  );
}
