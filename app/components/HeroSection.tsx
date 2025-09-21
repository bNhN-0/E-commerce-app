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
    image: assets.fashion_banner, // StaticImport or string
  },
  {
    id: 2,
    title: "New Arrivals Just Dropped",
    desc: "Check out the latest fashion trends and must-have gadgets.",
    cta: "✨ Explore Now",
    link: "/products",
    image:  "/images/hero-tech.jpg",
  },
  {
    id: 3,
    title: "Big Savings Await You",
    desc: "Get discounts up to 50% on selected categories!",
    cta: "💸 Grab Deals",
    link: "/products",
    image: "/images/hero-sale.jpg",
  },
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((i) => (i + 1) % heroBanners.length);
  const prevSlide = () => setIndex((i) => (i - 1 + heroBanners.length) % heroBanners.length);

  const current = heroBanners[index];
  const bgImage =
    typeof current.image === "string" ? current.image : current.image.src;

  return (
    <section className="relative mb-12">
      <div className="relative h-[450px] md:h-[550px] overflow-hidden rounded-lg shadow-lg">
        {/* Background Image (fades) */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`bg-${current.id}`}
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        </AnimatePresence>

        {/* Dark overlay (also non-interactive) */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Text & CTA */}
        <motion.div
          key={`content-${current.id}`}
          className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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

        {/* Arrows (now on top, clickable) */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {heroBanners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-3 w-3 rounded-full ${
              i === index ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
