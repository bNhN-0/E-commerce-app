"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="font-bold text-lg">
        <Link href="/">E-commerce template</Link>
      </div>
      <div className="space-x-4">
        <Link href="/">Home</Link>
        <Link href="/cart">Cart</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/account">Account</Link>
        <Link href="/admin/products">Admin Dashboard</Link>
        {!user ? (
          <Link href="/auth/">Login / Signup</Link>
        ) : (
          <button onClick={handleLogout} className="bg-red-500 px-2 py-1 rounded">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
