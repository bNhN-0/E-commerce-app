"use client";

import Footer from "../components/Footer";
import FeaturesLayout from "../components/FeaturesLayout";
import HeroSection from "../components/HeroSection";

export default function HomePage() {
  return (
    <main className="w-full">
      {/* 🏠 Hero Section */}
     
        <HeroSection />
    


      {/* Featured Products + Categories */}
      <div className="mb-16">
        <FeaturesLayout />
      </div>

      {/* Features Row */}
      <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="flex flex-col items-center p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition text-center">
          🚚
          <p className="font-semibold mt-2 text-lg">Free Shipping</p>
          <p className="text-sm text-gray-700">On all orders over $50</p>
        </div>

        <div className="flex flex-col items-center p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition text-center">
          🔒
          <p className="font-semibold mt-2 text-lg">Secure Payment</p>
          <p className="text-sm text-gray-700">100% safe & encrypted</p>
        </div>

        <div className="flex flex-col items-center p-6 bg-white/70 backdrop-blur-md rounded-xl shadow-sm hover:shadow-md transition text-center">
          📞
          <p className="font-semibold mt-2 text-lg">24/7 Support</p>
          <p className="text-sm text-gray-700">We’re here to help anytime</p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
