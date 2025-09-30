"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { assets } from "@/assets/assets";

const FeaturesCard = () => {
  const categories = [
    { icon: assets.fashion_icon, name: "Men's Fashion", link: "/products?category=Men's Fashion" },
    { icon: assets.electronics_icon, name: "Electronics", link: "/products?category=Electronics" },
    { icon: assets.home_icon, name: "Home Living", link: "/products?category=Home Living" },
    { icon: assets.beauty_icon, name: "Beauty & Health", link: "/products?category=Beauty & Health" },
    { icon: assets.sports_icon, name: "Sports & Outdoors", link: "/products?category=Sports & Outdoors" },
  ];

  return (
    <>
<div className="lg:hidden px-2 py-2 mb-4 overflow-x-auto no-scrollbar">
  <div className="flex gap-3">
    {categories.map((cat) => (
      <Link
        key={cat.name}
        href={cat.link}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-orange-100 hover:text-orange-600 transition whitespace-nowrap"
      >
        <Image
          src={cat.icon}
          alt={cat.name}
          width={16}
          height={16}
          className="object-contain"
        />
        <span>{cat.name}</span>
      </Link>
    ))}
  </div>
</div>

     {/* --- Desktop Sidebar --- */}
<aside className="hidden lg:block bg-white/80 backdrop-blur-sm shadow-md rounded-xl p-4 w-44 border border-gray-100">
  <h2 className="text-sm font-semibold mb-3 text-gray-700 text-center">🛍 Categories</h2>
  <div className="grid gap-4">
    {categories.map((cat) => (
      <Link
        key={cat.name}
        href={cat.link}
        className="flex flex-col items-center cursor-pointer group"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 shadow-sm group-hover:shadow-md transition">
          <Image
            src={cat.icon}
            alt={cat.name}
            width={18}
            height={18}
            className="object-contain"
          />
        </div>
        <p className="mt-1 text-[11px] font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">
          {cat.name}
        </p>
      </Link>
    ))}
  </div>
</aside>

    </>
  );
};

export default FeaturesCard;
