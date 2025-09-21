"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";

const heroBanners = [
  {
    id: 1,
    title: "Shop Smarter, Live Better",
    desc: "Discover exclusive deals on fashion, electronics, and more.",
    cta: "🛍 Browse Products",
    link: "/products",
    image: assets.fashion_banner, // Next.js import
  },
  {
    id: 2,
    title: "New Arrivals Just Dropped",
    desc: "Check out the latest fashion trends and must-have gadgets.",
    cta: "✨ Explore Now",
    link: "/products",
    image: "/images/hero-tech.jpg",
  },
  {
    id: 3,
    title: "Big Savings Await You",
    desc: "Get discounts up to 50% on selected categories!",
    cta: "💸 Grab Deals",
    link: "/products",
    image:  "/images/hero-sale.jpg",
  },
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev + 1) % heroBanners.length);
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);

  const current = heroBanners[index];
  const bgImage =
    typeof current.image === "string" ? current.image : current.image.src;

  return (
    <section className="relative mb-12">
      <div className="relative rounded-lg shadow-lg overflow-hidden h-[450px] md:h-[550px]">
        <AnimatePresence mode="wait">
          {/* Background Image */}
          <motion.div
            key={`bg-${current.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          {/* Text & CTA */}
          <motion.div
            key={`content-${current.id}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col justify-center items-center text-center text-white h-full px-6"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              {current.title}
            </h1>
            <p className="mb-6 text-lg max-w-2xl">{current.desc}</p>
            <Link
              href={current.link}
              className="bg-white text-blue-700 px-8 py-3 rounded-lg shadow font-semibold hover:bg-gray-100 transition"
            >
              {current.cta}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
      >
        ›
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-4 gap-2">
        {heroBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-3 h-3 rounded-full ${
              i === index ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
