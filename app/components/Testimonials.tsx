"use client";
import { useState } from "react";

type Testimonial = { name: string; review: string; image?: string };

const testimonials: Testimonial[] = [
  { name: "Sofia R.", review: "Mingala Mart has amazing deals and fast delivery!", image: "" },
  { name: "James L.", review: "I love the clean design and easy checkout process.", image: "" },
  { name: "Maria K.", review: "Customer service was super helpful with my order.", image: "" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">
        What Our Customers Say
      </h2>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} {...t} />
        ))}
      </div>
    </section>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        className="w-12 h-12 rounded-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-full grid place-items-center text-xs font-semibold text-white"
      style={{ background: "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)" }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function TestimonialCard({ name, review, image }: Testimonial) {
  return (
    <figure className="p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-indigo-50 ring-1 ring-indigo-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="flex items-center gap-3 sm:gap-4 mb-3">
        <Avatar name={name} src={image} />
        <figcaption className="font-semibold text-slate-900 text-sm sm:text-base">{name}</figcaption>
      </div>

      {/* Stars */}
      <div className="mb-2 flex gap-1 text-amber-500 text-sm sm:text-base" aria-label="5 out of 5 stars">
        {"★★★★★"}
      </div>

      {/* Quote */}
      <div className="relative pl-6">
        <svg
          className="absolute left-0 top-1 w-3 h-3 sm:w-4 sm:h-4 text-indigo-400"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M7.17 6A4.17 4.17 0 0 0 3 10.17V21h8v-8H7.17A4.17 4.17 0 0 1 11 8.83V6H7.17Zm9 0A4.17 4.17 0 0 0 12 10.17V21h8v-8h-3.83A4.17 4.17 0 0 1 21 8.83V6h-4.83Z" />
        </svg>
        <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
          “{review}”
        </p>
      </div>
    </figure>
  );
}
