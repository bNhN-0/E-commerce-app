import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type SessionUserLite = {
  id: string;
  role: "CUSTOMER" | "ADMIN";
  email: string | null;
};

export async function getUserSessionLite(): Promise<SessionUserLite | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  const u = data.user;
  if (!u) return null;

  const role = (u.user_metadata?.role as "ADMIN" | "CUSTOMER") ?? "CUSTOMER";
  return { id: u.id, role, email: u.email ?? null };
}
