"use client";
import Link from "next/link";
import { assets } from "@/assets/assets";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo + About */}
        <div>
          <Link href="/" className="flex items-center mb-4">
            <Image src={assets.logo} alt="Mingala Mart" className="h-10 w-10 mr-2" />
            <span className="text-xl font-bold text-white">Mingala Mart</span>
          </Link>
          <p className="text-sm text-gray-400">
            Your one-stop shop for fashion, electronics, and more.  
            Quality products, secure checkout, and fast delivery.
          </p>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products?category=Fashion" className="hover:text-white">Fashion</Link></li>
            <li><Link href="/products?category=Electronics" className="hover:text-white">Electronics</Link></li>
            <li><Link href="/products?category=Home Living" className="hover:text-white">Home & Living</Link></li>
            <li><Link href="/products?category=Beauty" className="hover:text-white">Beauty & Health</Link></li>
            <li><Link href="/products?category=Sports" className="hover:text-white">Sports & Outdoors</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Customer Service</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
            <li><Link href="/returns" className="hover:text-white">Returns & Refunds</Link></li>
            <li><Link href="/shipping" className="hover:text-white">Shipping Info</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQs</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Stay Connected</h4>
          <p className="text-sm text-gray-400 mb-4">
            Subscribe to get the latest deals and offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Your email"
              className="px-4 py-2 rounded-lg text-black w-full"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition"
            >
              Subscribe
            </button>
          </form>
          <div className="flex space-x-4 mt-6">
            <a href="#" aria-label="Facebook" className="hover:text-white">🌐</a>
            <a href="#" aria-label="Instagram" className="hover:text-white">📸</a>
            <a href="#" aria-label="Twitter" className="hover:text-white">🐦</a>
            <a href="#" aria-label="YouTube" className="hover:text-white">▶️</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Mingala Mart. All rights reserved.
      </div>
    </footer>
  );
}
