"use client";
import Link from "next/link";
import { assets } from "@/assets/assets";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-700 py-12 mt-12 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center mb-4">
            <Image
              src={assets.logo}
              alt="Mingala Mart"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="text-xl font-bold text-gray-900">Mingala Mart</span>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your one-stop shop for fashion, electronics, and more.
            Quality products, secure checkout, and fast delivery.
          </p>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products?category=Fashion" className="hover:text-indigo-600">Fashion</Link></li>
            <li><Link href="/products?category=Electronics" className="hover:text-indigo-600">Electronics</Link></li>
            <li><Link href="/products?category=Home Living" className="hover:text-indigo-600">Home & Living</Link></li>
            <li><Link href="/products?category=Beauty" className="hover:text-indigo-600">Beauty & Health</Link></li>
            <li><Link href="/products?category=Sports" className="hover:text-indigo-600">Sports & Outdoors</Link></li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Service</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help" className="hover:text-indigo-600">Help Center</Link></li>
            <li><Link href="/returns" className="hover:text-indigo-600">Returns & Refunds</Link></li>
            <li><Link href="/shipping" className="hover:text-indigo-600">Shipping Info</Link></li>
            <li><Link href="/faq" className="hover:text-indigo-600">FAQs</Link></li>
            <li><Link href="/contact" className="hover:text-indigo-600">Contact Us</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Stay Connected</h4>
          <p className="text-sm text-gray-500 mb-4">
            Subscribe to get the latest deals and offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Your email"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-900 w-full sm:flex-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Subscribe
            </button>
          </form>
          <div className="flex space-x-4 mt-6 justify-center sm:justify-start">
            <a href="#" aria-label="Facebook" className="hover:text-indigo-600">🌐</a>
            <a href="#" aria-label="Instagram" className="hover:text-indigo-600">📸</a>
            <a href="#" aria-label="Twitter" className="hover:text-indigo-600">🐦</a>
            <a href="#" aria-label="YouTube" className="hover:text-indigo-600">▶️</a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 mt-10 pt-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Mingala Mart. All rights reserved.
      </div>
    </footer>
  );
}
