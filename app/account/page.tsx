"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UserMetadata = {
  name?: string;
  full_name?: string;
  username?: string;
  // allow extra keys without using `any`
  [key: string]: unknown;
};

type SBUser = {
  email?: string | null;
  created_at?: string;
  user_metadata?: UserMetadata;
};

export default function AccountPage() {
  const router = useRouter();
  const [sbUser, setSbUser] = useState<SBUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) {
        setSbUser(null);
        return;
      }
      // map supabase-js User → our SBUser without `any`
      setSbUser({
        email: u.email ?? null,
        created_at: u.created_at ?? undefined,
        user_metadata: (u.user_metadata as UserMetadata) ?? undefined,
      });
    });
  }, []);

  const displayName = useMemo(() => {
    const meta = sbUser?.user_metadata;
    const metaName =
      (typeof meta?.name === "string" && meta.name) ||
      (typeof meta?.full_name === "string" && meta.full_name) ||
      (typeof meta?.username === "string" && meta.username) ||
      "";
    if (metaName.trim()) return metaName.trim();
    const emailLocal = (sbUser?.email || "").split("@")[0];
    return emailLocal || "Your Account";
  }, [sbUser]);

  const joinedYear = useMemo(() => {
    if (!sbUser?.created_at) return "";
    const d = new Date(sbUser.created_at);
    return Number.isFinite(d.getTime()) ? d.getFullYear() : "";
  }, [sbUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const menuItems = [
    { href: "/account/profile",   icon: "👤", title: "Profile",       desc: "Manage your personal details" },
    { href: "/account/addresses", icon: "🏠", title: "Addresses",     desc: "Saved shipping locations" },
    { href: "/account/payments",  icon: "💳", title: "Banks & Cards", desc: "Manage your payment methods" },
    { href: "/account/purchases", icon: "📦", title: "My Purchases",  desc: "View your order history" },
    { href: "/account/settings",  icon: "⚙️", title: "Settings",      desc: "Customize preferences" },
    { href: "/admin/products",    icon: "🛠️", title: "Admin",         desc: "Manage products (admin only)" },
  ] as const;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#404BB3] via-indigo-700 to-indigo-900 text-white">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Hero / Header */}
        <section className="rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar bubble */}
            <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full ring-2 ring-white/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-300 to-blue-400" />
              {/* If you store avatar URL, place an <img> here */}
            </div>

            {/* Identity / Stats */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                {joinedYear && (
                  <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-white/10 ring-1 ring-white/20">
                    Member since {joinedYear}
                  </span>
                )}
              </div>

              <p className="mt-1 text-white/80 text-sm">
                Manage your profile, orders, and account settings — all in one place.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Stat label="Orders" value="—" />
                <Stat label="Saved Addresses" value="—" />
                <Stat label="Payment Methods" value="—" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href="/account/profile"
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50"
              >
                Edit Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-500/90 text-white font-semibold hover:bg-rose-600"
              >
                Logout
              </button>
            </div>
          </div>
        </section>

        {/* Menu grid */}
        <section className="mt-8">
          <h2 className="mb-3 text-sm uppercase tracking-wide text-white/70">Account</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {menuItems.map((item, i) => (
              <Link key={i} href={item.href} className="group relative">
                <div className="rounded-2xl p-[1px] bg-gradient-to-br from-white/40 via-blue-200/40 to-white/10">
                  <div className="rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 p-5 h-full shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-xl shadow-sm">
                          {item.icon}
                        </span>
                        <div>
                          <div className="text-gray-900 dark:text-white font-semibold">
                            {item.title}
                          </div>
                          <p className="text-sm text-gray-600/80 dark:text-gray-300/80">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <span className="mt-1 opacity-60 transition group-hover:translate-x-1">
                        <Arrow />
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-px w-2/3 bg-gradient-to-r from-black/10 via-black/10 to-transparent dark:from-white/15 dark:via-white/15" />
                      <span className="text-[11px] px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                        Open
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

/* tiny helpers */
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 ring-1 ring-white/20">
      <span className="opacity-80">{label}:</span> <span className="ml-1">{value}</span>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M7 12h10M13 8l4 4-4 4"
        className="stroke-current"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
