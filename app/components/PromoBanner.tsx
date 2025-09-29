"use client";

export default function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white py-12 px-6 text-center rounded-xl max-w-6xl mx-auto mb-12">
      <h2 className="text-3xl font-extrabold mb-2">Autumn Sale 🍂</h2>
      <p className="text-lg mb-4">Up to 50% off on selected items</p>
      <a
        href="/products?sort=discount"
        className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
      >
        Shop Now
      </a>
    </div>
  );
}
