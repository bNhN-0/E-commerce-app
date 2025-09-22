"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { assets } from "@/assets/assets";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`);
      setIsOpen(false);
      setSearch("");
    }
  };

  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
  ];

  return (
    <nav className="bg-[#404bb3]/90 backdrop-blur-md fixed w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image
            src={assets.logo}
            alt="Mingala Mart Logo"
            width={35}
            height={35}
            className="mb-1"
          />
          <span className="text-white text-xs font-medium">Mingala Mart</span>
        </div>

        {/* Desktop Links + Search */}
        <div className="hidden md:flex space-x-6 items-center text-white">
          {baseLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative transition ${
                pathname === link.href
                  ? "text-teal-400 font-semibold"
                  : "hover:text-teal-300"
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-teal-400 rounded"></span>
              )}
            </Link>
          ))}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1 rounded-l bg-white text-black text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-r text-sm"
            >
              🔍
            </button>
          </form>

          {/* Auth toggle */}
          {!user ? (
            <Link
              href="/auth"
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
            >
              Login / Signup
            </Link>
          ) : (
            <Link
              href="/account"
              className="bg-purple-600 px-3 py-1 rounded hover:bg-purple-700"
            >
              Account
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div
          className="flex flex-col space-y-1 cursor-pointer md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-white"
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block h-0.5 w-6 bg-white"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-6 bg-white"
          />
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1a1035]/95 px-6 pb-6 flex flex-col items-center space-y-6 shadow-lg md:hidden"
          >
            {baseLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition text-lg ${
                  pathname === link.href
                    ? "text-teal-400 font-semibold"
                    : "text-white hover:text-teal-300"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Search in mobile */}
            <form onSubmit={handleSearch} className="flex w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 rounded-l bg-white text-black text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-r text-sm"
              >
                🔍
              </button>
            </form>

            {/* Auth toggle */}
            {!user ? (
              <Link
                href="/auth"
                className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 w-full text-center transition"
                onClick={() => setIsOpen(false)}
              >
                Login / Signup
              </Link>
            ) : (
              <Link
                href="/account"
                className="bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-700 w-full text-center transition"
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
