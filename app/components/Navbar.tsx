"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { assets } from "@/assets/assets";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Common nav links
  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
    { href: "/admin/products", label: "Admin Dashboard" },
  ];

  return (
    <nav className="bg-[#092029]/80 backdrop-blur-md fixed w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center text-white font-extrabold tracking-wide px-2 ">
          <Image src={assets.logo} alt="Logo" width={60} height={60} />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 text-white items-center">
          {baseLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-teal-400 transition"
            >
              {link.label}
            </Link>
          ))}

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

        {/* Hamburger Menu (Mobile) */}
        <div
          className="flex flex-col space-y-1 cursor-pointer md:hidden"
          onClick={toggleMenu}
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

      {/* Dropdown Menu (Mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1a1035]/95 px-6 pb-6 flex flex-col items-center space-y-6 shadow-lg rounded-b-2xl md:hidden"
          >
            {baseLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-purple-400 transition text-lg"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth toggle */}
            {!user ? (
              <Link
                href="/auth"
                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 w-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Login / Signup
              </Link>
            ) : (
              <Link
                href="/account"
                className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 w-full text-center"
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
