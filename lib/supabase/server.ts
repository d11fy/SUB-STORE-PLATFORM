// ============================================================
// Supabase Server Client
// Used in: Server Components, Server Actions, Route Handlers
// ============================================================
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { TypedDatabase as Database } from "@/lib/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from Server Component — cookies are read-only
            // This is expected and safe to ignore
          }
        },
      },
    }
  );
}
