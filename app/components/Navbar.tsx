"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation"; // 👈 to highlight active link
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { assets } from "@/assets/assets";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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

  // nav links
  const baseLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    { href: "/orders", label: "Orders" },
    { href: "/admin/products", label: "Admin" },
  ];

  return (
    <nav className="bg-[#091752]/90 backdrop-blur-md fixed w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src={assets.logo}
            alt="Logo"
            width={48}
            height={48}
            className="mr-2"
          />
        </div>

        {/* Desktop Links */}
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

          {/* Auth toggle */}
          {!user ? (
            <Link
              href="/auth"
              className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Login / Signup
            </Link>
          ) : (
            <Link
              href="/account"
              className="bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-700 transition"
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

            {/* Auth toggle */}
            {!user ? (
              <Link
                href="/auth"
                className="bg-blue-600 px-5 py-2 rounded-md hover:bg-blue-700 w-full text-center transition"
                onClick={() => setIsOpen(false)}
              >
                Login / Signup
              </Link>
            ) : (
              <Link
                href="/account"
                className="bg-purple-600 px-5 py-2 rounded-md hover:bg-purple-700 w-full text-center transition"
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
