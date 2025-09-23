"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Searchbar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search)}`);
      setSearch("");
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Centered Search Bar */}
        <div className="flex-1 flex justify-center">
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-lg items-center"
          >
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
        </div>

        
      </div>
  );
}
