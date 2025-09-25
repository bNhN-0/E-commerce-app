"use client";

export default function PromoHighlights() {
  const promos = [
    {
      title: "🚚 Free Shipping",
      desc: "On all orders over $50",
      color: "from-blue-500/80 to-indigo-500/80",
    },
    {
      title: "🎁 Buy 1 Get 1",
      desc: "Selected items only",
      color: "from-pink-400/80 to-rose-500/80",
    },
    {
      title: "🎓 Student Discount",
      desc: "Save 15% with Student ID",
      color: "from-emerald-400/80 to-teal-500/80",
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo, i) => (
          <div
            key={i}
            className={`rounded-2xl shadow-md p-6 text-white bg-gradient-to-br ${promo.color} backdrop-blur-lg flex flex-col justify-center items-start hover:scale-[1.02] transition-transform duration-300`}
          >
            <h3 className="text-lg font-semibold mb-1">{promo.title}</h3>
            <p className="text-sm opacity-90">{promo.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
