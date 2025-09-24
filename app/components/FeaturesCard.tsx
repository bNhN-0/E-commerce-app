import React from 'react'

const FeaturesCard = () => {
  return (
<section className="mb-16">
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Featured Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { icon: "👕", name: "Fashion" },
            { icon: "💻", name: "Electronics" },
            { icon: "🏠", name: "Home & Living" },
            { icon: "💄", name: "Beauty & Health" },
            { icon: "⚽", name: "Sports & Outdoors" },
          ].map((cat) => (
            <div
              key={cat.name}
              className="bg-gray-100 rounded-lg p-8 text-center shadow hover:shadow-lg transition cursor-pointer"
            >
              <p className="text-3xl mb-2">{cat.icon}</p>
              <p className="text-lg font-semibold">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>  )
}

export default FeaturesCard