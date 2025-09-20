"use client";

import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}
