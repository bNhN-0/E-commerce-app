"use client";

import Footer from "../components/Footer";
import FeaturesLayout from "../components/FeaturesLayout";
import HeroSection from "../components/HeroSection";
import BestSellers from "../components/BestSellers";
import PromoBanner from "../components/PromoBanner";
import Testimonials from "../components/Testimonials";
import NewsletterCTA from "../components/NewslettCTA";

export default function HomePage() {
  return (
    <main className="w-full text-gray-900">
      {/* Hero */}
      <HeroSection />

      {/* Featured Benefits / Features */}
      <section className="mb-16">
        <FeaturesLayout />
      </section>

      {/* Promotional Banner */}
      <PromoBanner />

      {/* Best Sellers */}
      <section className="py-12">
        <BestSellers />
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <Testimonials />
      </section>

      {/* Newsletter / CTA */}
      <section className="py-16 bg-indigo-600 text-white">
        <NewsletterCTA />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
