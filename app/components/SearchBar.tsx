"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Searchbar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`);
      setSearch("");
    }
  };

  return (
    <div className="bg-white shadow-sm border-t border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex w-full max-w-lg">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-l bg-gray-100 text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#404BB3]"
          />
          <button
            type="submit"
            className="bg-orange-400 hover:bg-orange-500 px-4 py-2 rounded-r text-white text-sm"
          >
            🔍
          </button>
        </form>

        {/* Cart */}
        <button
          aria-label="Cart"
          className="relative ml-6 text-gray-700 hover:text-[#404BB3] transition"
        >
          🛒
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
            3
          </span>
        </button>
      </div>
    </div>
  );
}
