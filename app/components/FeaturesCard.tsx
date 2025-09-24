import React from "react";
import Link from "next/link";
import Image from "next/image";
import { assets } from "@/assets/assets";

const FeaturesCard = () => {
  const categories = [
    { icon: assets.fashion_icon, name: "Fashion", link: "/products?category=FASHION" },
    { icon: assets.electronics_icon, name: "Electronics", link: "/products?category=ELECTRONICS" },
    { icon: assets.home_icon, name: "Home", link: "/products?category=HOME_LIVING" },
    { icon: assets.beauty_icon, name: "Beauty", link: "/products?category=BEAUTY_HEALTH" },
    { icon: assets.sports_icon, name: "Sports", link: "/products?category=SPORTS_OUTDOORS" },
  ];

  return (
    <aside className="bg-white shadow-md rounded-xl p-4 w-44">
      <h2 className="text-sm font-semibold mb-3 text-center text-gray-800">
        Categories
      </h2>
      <div className="grid grid-cols-2 gap-4 justify-items-center">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="flex flex-col items-center cursor-pointer group"
          >
            {/* Circle with smaller Image */}
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-gray-200 group-hover:scale-105 transition overflow-hidden">
              <Image
                src={cat.icon}
                alt={cat.name}
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            {/* Label */}
            <p className="mt-1 text-[11px] font-medium text-gray-600 group-hover:text-gray-900 text-center leading-tight">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default FeaturesCard;
