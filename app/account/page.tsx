"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth"); 
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/account/profile"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          👤 Profile
        </Link>
        <Link
          href="/account/addresses"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          🏠 Addresses
        </Link>
        <Link
          href="/account/payments"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          💳 Banks & Cards
        </Link>
        <Link
          href="/account/purchases"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          📦 My Purchases
        </Link>
        <Link
          href="/account/settings"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          ⚙️ Settings
        </Link>

         <Link
          href="/admin/products"
          className="p-4 border rounded shadow hover:bg-gray-50"
        >
          ⚙️ Admin
        </Link>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        🚪 Logout
      </button>
    </div>
  );
}
