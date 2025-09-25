"use client";

import HomePage from "./pages/Home";

export default function Home() {
  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-rose-100 via-sky-50 to-emerald-100/30" />
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-rose-300/40 to-orange-200/40 blur-3xl animate-pulse -z-10" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-sky-300/40 to-indigo-200/40 blur-3xl animate-[spin_60s_linear_infinite] -z-10" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-bl from-yellow-200/40 to-pink-200/40 blur-2xl opacity-70 -z-10" />
      <section className="relative z-10 w-full max-w-7xl pt-16 sm:pt-24 lg:pt-28">
        <HomePage />
      </section>
    </main>
  );
}
