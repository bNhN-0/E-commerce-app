"use client";

interface ProductCardProps {
  product: any;
  addToCart: () => void;
}

export default function ProductCard({ product, addToCart }: ProductCardProps) {
  return (
    <div className="border p-4 rounded-lg">
      <img
        src={product.image_url}
        alt={product.name}
        className="w-full h-32 object-cover"
      />
      <h2 className="text-lg font-semibold">{product.name}</h2>
      <p>${product.price}</p>
      <button
        onClick={addToCart}
        className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
      >
        Add to Cart
      </button>
    </div>
  );
}
