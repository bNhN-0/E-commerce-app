"use client";
import Link from "next/link";
import { assets } from "@/assets/assets";

const categories = [
  { name: "Fashion", icon: assets.fashion_icon, link: "/products?category=Fashion" },
  { name: "Electronics", icon: assets.electronics_icon, link: "/products?category=Electronics" },
  { name: "Home & Living", icon: assets.home_icon, link: "/products?category=Home Living" },
  { name: "Beauty & Health", icon: assets.beauty_icon, link: "/products?category=Beauty" },
  { name: "Sports & Outdoors", icon: assets.sports_icon, link: "/products?category=Sports" },
];

export default function CategoryShowcase() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-2xl font-bold text-center mb-8">Shop by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
          >
            <img src={cat.icon} alt={cat.name} className="h-12 w-12 mb-3" />
            <span className="text-sm font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
