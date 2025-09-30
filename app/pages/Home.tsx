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
      <HeroSection />

      <section className="mb-16">
        <FeaturesLayout />
      </section>

      <PromoBanner />

      <BestSellers days={30} limit={3} className="mt-10" />

      <section className="py-12 bg-white">
        <Testimonials />
      </section>

      <section className="py-16 bg-indigo-600 text-white">
        <NewsletterCTA />
      </section>
      <Footer />
    </main>
  );
}
