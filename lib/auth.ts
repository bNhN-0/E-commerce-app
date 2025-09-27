// lib/auth.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Options we pass through to Next's cookies().set(...) */
type CookieOptions = {
  domain?: string;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  expires?: Date;
};

/**
 * Get the logged-in user from Supabase and match with your Prisma User row.
 */
export async function getUserSession() {
  const cookieStore = await cookies(); // <-- no await

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Return all cookies as an array of { name, value }
          return Array.from(cookieStore.getAll()).map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setCookie(name: string, value: string, options?: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...(options ?? {}) });
          } catch {
            // ignore if headers already sent
          }
        },
        removeCookie(name: string, options?: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...(options ?? {}) });
          } catch {
            // ignore if headers already sent
          }
        },
      },
    }
  );

  // 1) Supabase user
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // 2) Match to Prisma user (to read role, etc.)
  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
  return dbUser;
}
