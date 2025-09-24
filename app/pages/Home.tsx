"use client";


import HeroSection from "../components/HeroSection";
import FeaturesCard from "../components/FeaturesCard";
import Footer from "../components/Footer"
import FeaturesLayout from "../components/FeaturesLayout"




export default function HomePage() {
  
  return (
    <main className="max-w-7xl mx-auto">
       <HeroSection></HeroSection>
       <FeaturesLayout></FeaturesLayout>
      {/* Featured Products */}
      <section className="mb-16">
        
      </section>

      {/* Features Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          🚚 <p className="font-semibold mt-2">Free Shipping</p>
          <p className="text-sm text-gray-600">On all orders over $50</p>
        </div>
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          🔒 <p className="font-semibold mt-2">Secure Payment</p>
          <p className="text-sm text-gray-600">100% safe & encrypted</p>
        </div>
        <div className="p-6 bg-gray-100 rounded-lg shadow text-center">
          📞 <p className="font-semibold mt-2">24/7 Support</p>
          <p className="text-sm text-gray-600">We’re here to help anytime</p>
        </div>
      </section>

      <Footer></Footer>

 
    </main>
  );
}
