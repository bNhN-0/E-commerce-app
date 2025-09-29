"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "@/assets/assets";

// Slides
const heroBanners = [
  {
    id: 1,
    title: "Welcome to Mingala Mart",
    desc: "Your one-stop shop for fashion, beauty, sports, and tech essentials.",
    cta: "🛍 Shop now !",
    link: "/products",
    image: assets.welcome_banner,
  },
  {
    id: 2,
    title: "Shop Smarter, Dress Better",
    desc: "Discover exclusive deals on fashion – style starts here at Mingala Mart.",
    cta: "🛍 Browse Products",
    link: "/products?category=FASHION",
    image: assets.fashion_banner,
  },
  {
    id: 3,
    title: "New Arrivals Just Dropped",
    desc: "Check out the latest fashion trends and must-have gadgets.",
    cta: "✨ Explore Now",
    link: "/products?category=ELECTRONICS",
    image: assets.electronic_banner,
  },
  {
    id: 4,
    title: "Big Savings Await You",
    desc: "Get discounts up to 50% on selected categories!",
    cta: "💸 Grab Deals",
    link: "/products",
    image: "/images/hero-sale.jpg",
  },
];

const toSrc = (img: string | { src?: string }) =>
  typeof img === "string" ? img : img?.src || "";

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [progress, setProgress] = useState(0); 
  const touchStartX = useRef<number | null>(null);
  const autoplayMs = 5000;

  const next = () => setIndex((i) => (i + 1) % heroBanners.length);
  const prev = () => setIndex((i) => (i - 1 + heroBanners.length) % heroBanners.length);
  const goTo = (i: number) => setIndex(((i % heroBanners.length) + heroBanners.length) % heroBanners.length);

  const current = heroBanners[index];
  const bgImage = toSrc(current.image);

  useEffect(() => {
    const nextIdx = (index + 1) % heroBanners.length;
    const img = new Image();
    img.src = toSrc(heroBanners[nextIdx].image);
  }, [index]);

  // Autoplay with pause on hover/visibility/reduced motion
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId: number | null = null;
    let start = performance.now();

    const tick = (t: number) => {
      const hidden = typeof document !== "undefined" && document.hidden;
      if (hovering || hidden || prefersReduced) {
        // freeze progress while paused
        start = t - (progress / 100) * autoplayMs;
      } else {
        const elapsed = t - start;
        const pct = Math.min(100, (elapsed / autoplayMs) * 100);
        setProgress(pct);
        if (pct >= 100) {
          setProgress(0);
          start = t;
          next();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [hovering, index, autoplayMs, progress]);

  // Keyboard nav (← / →)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const threshold = 40; 
    if (dx > threshold) prev();
    if (dx < -threshold) next();
  };

  return (
    <section
      className="relative mb-8"
      role="region"
      aria-label="Promoted content"
    >
      <div
        className="relative h-[260px] md:h-[380px] max-w-5xl mx-auto overflow-hidden rounded-2xl shadow-lg"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`img-${current.id}`}
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </AnimatePresence>

        {/* Gradient scrims for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/30" />
        <div className="absolute inset-0 bg-black/10" />

        {/* Content */}
        <motion.div
          key={`content-${current.id}`}
          className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="text-white drop-shadow-md text-[22px] md:text-4xl font-extrabold tracking-tight mb-2 md:mb-3">
            {current.title}
          </h1>
          <p className="text-white/90 drop-shadow-sm text-sm md:text-base max-w-2xl mb-4 md:mb-6">
            {current.desc}
          </p>
          <Link
            href={current.link}
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 md:px-6 py-2 md:py-2.5 rounded-full shadow hover:shadow-md hover:bg-gray-100 transition"
            aria-label={current.cta}
          >
            {current.cta}
          </Link>
        </motion.div>

        {/* Progress bar (autoplay) */}
        <div className="absolute left-0 right-0 bottom-0 h-1.5 bg-white/20">
          <div
            className="h-full bg-white/90 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Nav buttons */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/45 text-white w-9 h-9 rounded-full grid place-items-center hover:bg-black/60 transition"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/45 text-white w-9 h-9 rounded-full grid place-items-center hover:bg-black/60 transition"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="mt-3 flex justify-center gap-2">
        {heroBanners.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              i === index ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
