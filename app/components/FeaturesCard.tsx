import React from "react";

const FeaturesCard = () => {
  const categories = [
    { icon: "👕", name: "Fashion" },
    { icon: "💻", name: "Electronics" },
    { icon: "🏠", name: "Home & Living" },
    { icon: "💄", name: "Beauty & Health" },
    { icon: "⚽", name: "Sports & Outdoors" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-center">
        Featured Categories
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex flex-col items-center cursor-pointer group"
          >
            {/* Circle wrapper */}
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-md group-hover:shadow-lg group-hover:scale-105 transition">
              <span className="text-3xl">{cat.icon}</span>
            </div>
            {/* Label */}
            <p className="mt-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {cat.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesCard;
