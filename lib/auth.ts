import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Get the logged-in user from Supabase and match it with your Prisma User table.
 */
export async function getUserSession() {
  const cookieStore = await cookies();

  //  Create a Supabase client using Next.js cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore if headers already sent
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore if headers already sent
          }
        },
      },
    }
  );

  //  Step 1: Get Supabase user
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  //  Step 2: Match with Prisma User (so we know role, etc.)
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
  });

  return dbUser;
}
