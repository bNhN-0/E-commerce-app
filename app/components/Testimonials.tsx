"use client";

const testimonials = [
  { name: "Sofia R.", review: "Mingala Mart has amazing deals and fast delivery!", image: "/images/users/user1.jpg" },
  { name: "James L.", review: "I love the clean design and easy checkout process.", image: "/images/users/user2.jpg" },
  { name: "Maria K.", review: "Customer service was super helpful with my order.", image: "/images/users/user3.jpg" },
];

export default function Testimonials() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-2xl font-bold text-center mb-8">What Our Customers Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full mb-4" />
            <p className="italic text-gray-700 mb-3">“{t.review}”</p>
            <h4 className="font-semibold">{t.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}
