"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { assets } from "@/assets/assets";
import { useCart } from "./CartContext";
import Searchbar from "./SearchBar";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { cartCount } = useCart();

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-[#404BB3]/60 backdrop-blur-md fixed top-0 left-0 right-0 w-full z-50 shadow-md">
      <div className="w-full px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Image
            src={assets.logo}
            alt="Mingala Mart Logo"
            width={30}
            height={30}
            className="mb-0.5"
          />
          <span className="text-white text-[10px] font-medium">Mingala Mart</span>
        </div>

        {/* Search Bar */}
        <Searchbar />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-5 text-white text-sm font-normal">
          <Link href="/" className="flex items-center gap-1.5 hover:text-gray-200">
            <Image src={assets.home_icon} alt="Home" width={18} height={18} />
            <span>Home</span>
          </Link>

          <Link href="/products" className="flex items-center gap-1.5 hover:text-gray-200">
            <Image src={assets.shopping_icon} alt="Products" width={18} height={18} />
            <span>Products</span>
          </Link>

          <Link href="/orders" className="flex items-center gap-1.5 hover:text-gray-200">
            <Image src={assets.product_icon} alt="Orders" width={18} height={18} />
            <span>Orders</span>
          </Link>

          <Link href="/cart" className="relative flex items-center gap-1.5 hover:text-gray-200">
            <Image src={assets.cart_icon} alt="Cart" width={18} height={18} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {cartCount}
              </span>
            )}
          </Link>

          {!user ? (
            <Link href="/auth" className="flex items-center gap-1.5 hover:text-gray-200">
              <Image src={assets.profile_icon} alt="Login" width={18} height={18} />
              <span>Login</span>
            </Link>
          ) : (
            <Link href="/account" className="flex items-center gap-1.5 hover:text-gray-200">
              <Image src={assets.profile_icon} alt="Account" width={18} height={18} />
              <span>Account</span>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div
          className="flex flex-col space-y-1 cursor-pointer md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-5 bg-white"
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block h-0.5 w-5 bg-white"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
            className="block h-0.5 w-5 bg-white"
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
            className="bg-[#1a1035]/20 px-6 pb-6 flex flex-col items-center space-y-4 shadow-lg md:hidden rounded-b-2xl text-sm font-normal text-white"
          >
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <Image src={assets.home_icon} alt="Home" width={20} height={20} />
              <span>Home</span>
            </Link>

            <Link href="/products" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <Image src={assets.shopping_icon} alt="Products" width={20} height={20} />
              <span>Products</span>
            </Link>

            <Link href="/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
              <Image src={assets.product_icon} alt="Orders" width={20} height={20} />
              <span>Orders</span>
            </Link>

            <Link href="/cart" onClick={() => setIsOpen(false)} className="relative flex items-center gap-2">
              <Image src={assets.cart_icon} alt="Cart" width={20} height={20} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              <Link href="/auth" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                <Image src={assets.profile_icon} alt="Login" width={20} height={20} />
                <span>Login</span>
              </Link>
            ) : (
              <Link href="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                <Image src={assets.profile_icon} alt="Account" width={20} height={20} />
                <span>Account</span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
