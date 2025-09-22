"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";

const heroBanners = [
  {
    id: 1,
    title: "Shop Smarter, Dress Better",
    desc: "Discover exclusive deals on fashion – style starts here at Mingala Mart.",
    cta: "🛍 Browse Products",
    link: "/products?category=FASHION",
    image: assets.fashion_banner,
  },
  {
    id: 2,
    title: "New Arrivals Just Dropped",
    desc: "Check out the latest fashion trends and must-have gadgets.",
    cta: "✨ Explore Now",
    link: "/products?category=ELECTRONICS",
    image: assets.electronic_banner,
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
  const bgImage = typeof current.image === "string" ? current.image : current.image.src;

  return (
    <section className="relative mb-8">
      <div className="relative h-[260px] md:h-[340px] max-w-4xl mx-auto overflow-hidden rounded-lg shadow-md">
        {/* Background Image */}
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

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Text & CTA */}
        <motion.div
          key={`content-${current.id}`}
          className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{current.title}</h1>
          <p className="mb-4 text-sm md:text-base max-w-xl">{current.desc}</p>
          <Link
            href={current.link}
            className="bg-white text-blue-700 px-5 py-2 rounded-md shadow font-medium hover:bg-gray-100 transition text-sm md:text-base"
          >
            {current.cta}
          </Link>
        </motion.div>

        {/* Navigation Arrows */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-2">
        {heroBanners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full ${
              i === index ? "bg-blue-600" : "bg-gray-300"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
