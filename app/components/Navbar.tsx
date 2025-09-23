"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { assets } from "@/assets/assets";
import { useCart } from "./CartContext"; 
import Searchbar from "./SearchBar";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount } = useCart();

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-[#404BB3]/40 backdrop-blur-md fixed top-4 left-1/2 transform -translate-x-1/2 w-[95%] z-50 shadow-md rounded-2xl">
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

        {/*  Search Bar  */}
        <Searchbar></Searchbar>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-4 text-white text-xl">
          <Link href="/">🏠</Link>
          <Link href="/products">🛍️</Link>
          <Link href="/orders">📦</Link>
          <Link href="/cart" className="relative">
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </Link>

          {/*  Auth toggle */}
          {!user ? (
            <Link href="/auth">🔑</Link>
          ) : (
            <Link href="/account">👤</Link>
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
            className="bg-[#1a1035]/95 px-6 pb-6 flex flex-col items-center space-y-6 shadow-lg md:hidden rounded-b-2xl text-2xl"
          >
            <Link href="/" onClick={() => setIsOpen(false)}>🏠</Link>
            <Link href="/products" onClick={() => setIsOpen(false)}>🛍️</Link>
            <Link href="/orders" onClick={() => setIsOpen(false)}>📦</Link>
            <Link href="/cart" onClick={() => setIsOpen(false)} className="relative">
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                  {cartCount}
                </span>
              )}
            </Link>

            {/*  Auth toggle */}
            {!user ? (
              <Link href="/auth" onClick={() => setIsOpen(false)}>🔑</Link>
            ) : (
              <Link href="/account" onClick={() => setIsOpen(false)}>👤</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
