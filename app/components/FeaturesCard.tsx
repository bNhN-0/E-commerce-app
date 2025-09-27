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
    <aside className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-5 w-52 border border-gray-100">
      <h2 className="text-base font-semibold mb-4 text-gray-800 text-center">
        🛍 Categories
      </h2>

      <div className="grid grid-cols-2 gap-5 justify-items-center">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="flex flex-col items-center cursor-pointer group"
          >
            {/* Icon bubble */}
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-50 shadow-sm group-hover:shadow-md group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-indigo-50 group-hover:scale-105 transition-all duration-200">
              <Image
                src={cat.icon}
                alt={cat.name}
                width={26}
                height={26}
                className="object-contain"
              />
            </div>

            {/* Label */}
            <p className="mt-2 text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default FeaturesCard;
