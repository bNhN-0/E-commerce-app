"use client";

import HomePage from "./pages/Home";

export default function Home() {
  return (
    <div className="relative flex flex-col w-full min-h-screen bg-gradient-to-br from-rose-100 via-pink-100 to-sky-100 text-gray-900 overflow-hidden">
      <div className="absolute top-[-15%] left-[-20%] w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] rounded-full bg-gradient-to-br from-rose-400 to-pink-300 blur-3xl opacity-70 animate-pulse -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-sky-400 to-indigo-300 blur-3xl opacity-70 animate-[spin_50s_linear_infinite] -z-10" />
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none -z-10" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <section className="relative z-10 w-full max-w-7xl pt-16 sm:pt-24 lg:pt-28">
          <HomePage />
        </section>
      </main>
    </div>
  );
}
