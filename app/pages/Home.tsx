"use client";

import Footer from "../components/Footer";
import FeaturesLayout from "../components/FeaturesLayout";
import HeroSection from "../components/HeroSection";
import BestSellers from "../components/BestSellers";
import PromoBanner from "../components/PromoBanner";
import Testimonials from "../components/Testimonials";

export default function HomePage() {
  return (
    <main className="w-full text-gray-900">
      <HeroSection />

      <section className="mb-16">
        <FeaturesLayout />
      </section>

      <PromoBanner />

      <BestSellers days={30} limit={4} />

      <section className="py-12">
        <Testimonials />
      </section>
      <Footer />
    </main>
  );
}
