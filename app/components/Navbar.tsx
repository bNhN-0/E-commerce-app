"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { assets } from "@/assets/assets";
import { useCart } from "./CartContext";
import Searchbar from "./SearchBar";

type NavItem = {
  href: string;
  label: string;
  icon: StaticImageData;
  testId?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Home",     icon: assets.home_icon,     testId: "nav-home" },
  { href: "/products", label: "Products", icon: assets.shopping_icon, testId: "nav-products" },
  { href: "/orders",   label: "Orders",   icon: assets.product_icon,  testId: "nav-orders" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false); 

  const { cartCount } = useCart();
  const badgeCount = useMemo(() => (Number.isFinite(cartCount) ? Number(cartCount) : 0), [cartCount]);

  useEffect(() => setMounted(true), []);

  // Auth state (client)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = document.getElementById("mm-navbar");
    const onScroll = () => {
      if (!el) return;
      const scrolled = window.scrollY > 4;
      el.dataset.scrolled = scrolled ? "true" : "false";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mounted]);

  return (
    <nav
      id="mm-navbar"
      className="
        fixed top-0 inset-x-0 z-50
        transition-shadow
        data-[scrolled=true]:shadow-[0_8px_30px_rgb(0,0,0,0.15)]
      "
    >
      <div
        className="
          bg-[#3442c2]/80
          backdrop-blur-md
          border-b border-white/10
          [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,.75))]
        "
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/" className="group flex items-center gap-2.5" aria-label="Mingala Mart - Home">
              <div className="relative h-8 w-10 overflow-hidden rounded-xl ring-1 ring-white/20">
                <Image src={assets.logo} alt="Mingala Mart Logo" fill className="object-cover" priority />
              </div>
              <span className="text-white/90 font-semibold tracking-wide">
               Mingala <span className="text-yellow-300">Mart</span>
              </span>

              <span className="sr-only">Go to homepage</span>
            </Link>

            {/* Search (collapses on mobile) */}
            <div className="hidden md:block flex-1 max-w-xl">
              <Searchbar />
            </div>

            {/* Desktop nav/actions */}
            <div className="hidden md:flex items-center gap-3">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={active}
                  />
                );
              })}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative grid place-items-center rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                aria-label={`Cart ${badgeCount > 0 ? `with ${badgeCount} items` : ""}`}
              >
                <Image src={assets.cart_icon} alt="Cart" width={20} height={20} />
                {/* Reserved space to avoid layout shift */}
                <span className="pointer-events-none absolute -top-1.5 -right-1.5">
                  <AnimatePresence initial={false}>
                    {mounted && badgeCount > 0 && (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow"
                        aria-live="polite"
                      >
                        {badgeCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </Link>

              {/* Auth / Account r */}
              {mounted ? (
                user ? (
                  <Link
                    href="/account"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                  >
                    <Image src={assets.profile_icon} alt="Account" width={18} height={18} />
                    <span className="text-white/90 text-sm">Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                  >
                    <Image src={assets.profile_icon} alt="Login" width={18} height={18} />
                    <span className="text-white/90 text-sm">Login</span>
                  </Link>
                )
              ) : (
                <span className="inline-block w-[92px] h-9 rounded-xl bg-white/5 ring-1 ring-black/10" />
              )}
            </div>

            {/* Mobile: search icon + burger */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/products"
                className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-black/10 hover:ring-white/20 transition"
                aria-label="Browse products"
              >
                <Image src={assets.shopping_icon} alt="Products" width={18} height={18} />
              </Link>

              <button
                aria-label="Toggle menu"
                aria-expanded={isOpen}
                aria-controls="mm-mobile-menu"
                onClick={() => setIsOpen((s) => !s)}
                className="grid h-9 w-9 place-items-center rounded-xl ring-1 ring-black/10 hover:ring-white/20 transition"
              >
                <Burger isOpen={isOpen} />
              </button>
            </div>
          </div>

          {/* Mobile: search bar under row */}
          <div className="md:hidden py-2">
            <Searchbar />
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="mm-mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="mx-auto max-w-6xl px-4 sm:px-6 pb-4"
            >
              <div className="rounded-2xl bg-white/6 ring-1 ring-black/10 p-3 text-white/90">
                <div className="grid grid-cols-2 gap-2">
                  {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition
                          ${active ? "ring-indigo-400/40 bg-indigo-500/10" : "ring-black/10 hover:ring-white/20"}
                        `}
                      >
                        <Image src={item.icon} alt={item.label} width={18} height={18} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Cart (mobile) */}
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className="relative flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                  >
                    <Image src={assets.cart_icon} alt="Cart" width={18} height={18} />
                    <span className="text-sm">Cart</span>
                    {badgeCount > 0 && (
                      <span className="ml-auto inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        {badgeCount}
                      </span>
                    )}
                  </Link>

                  {/* Auth / Account (mobile) */}
                  {user ? (
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                    >
                      <Image src={assets.profile_icon} alt="Account" width={18} height={18} />
                      <span className="text-sm">Account</span>
                    </Link>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 hover:ring-white/20 transition"
                    >
                      <Image src={assets.profile_icon} alt="Login" width={18} height={18} />
                      <span className="text-sm">Login</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}


function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      data-active={active ? "true" : "false"}
      href={item.href}
      className="
        group relative flex items-center gap-2 rounded-xl px-3 py-2
        ring-1 ring-black/10 hover:ring-white/20
        data-[active=true]:ring-indigo-400/40
        transition
      "
    >
      <Image src={item.icon} alt={item.label} width={18} height={18} />
      <span className="text-white/90 text-sm">{item.label}</span>
      {/* Animated underline */}
      <span
        className="
          pointer-events-none absolute -bottom-px left-2 right-2 h-0.5 origin-left scale-x-0
          bg-gradient-to-r from-indigo-600 to-violet-300
          group-hover:scale-x-100
          data-[active=true]:scale-x-100
          transition-transform
        "
        data-active={active ? "true" : "false"}
      />
    </Link>
  );
}

function Burger({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative h-4 w-5">
      <motion.span
        className="absolute left-0 top-0 h-0.5 w-5 bg-white"
        animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
      />
      <motion.span
        className="absolute left-0 top-1/2 -mt-0.5 h-0.5 w-5 bg-white"
        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="absolute left-0 bottom-0 h-0.5 w-5 bg-white"
        animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
      />
    </div>
  );
}
