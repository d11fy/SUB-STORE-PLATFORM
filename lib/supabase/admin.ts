// ============================================================
// Supabase Admin Client (Service Role)
// Used in: Server Actions + API Routes that bypass RLS
// NEVER use in client components or expose to browser
// ============================================================
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { TypedDatabase as Database } from "@/lib/types/database";

// Singleton pattern — reuse the client across requests
let adminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  adminClient = createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
