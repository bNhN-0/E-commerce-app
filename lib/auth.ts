// lib/auth.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User as DBUser } from "@prisma/client";

/**
 * Get the logged-in user from Supabase and match it with your Prisma User table.
 */
export async function getUserSession(): Promise<DBUser | null> {
  // In your setup, cookies() is async
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase env vars missing.");
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string): string | undefined {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions): void {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // ignore if headers already sent
        }
      },
      remove(name: string, options: CookieOptions): void {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // ignore if headers already sent
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
  });

  return dbUser;
}
