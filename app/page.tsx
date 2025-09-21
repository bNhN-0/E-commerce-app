'use client';

import HomePage from "./pages/Home";

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#120b26] text-white overflow-x-hidden">

      <main className="flex-1 w-full overflow-y-auto scroll-smooth snap-y snap-mandatory">
        {/* Header Section */}
        <section id="header" className="relative z-10 snap-start mt-24">
          <HomePage />
        </section>

      
      </main>
    </div>
  );
}