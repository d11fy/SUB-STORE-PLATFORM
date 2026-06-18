/**
 * Saba Store — Admin Promotion Script
 * 
 * WARNING: This is a local one-time admin promotion script. 
 * Do not expose service role keys. Do not run this on the client.
 * 
 * Usage:
 * npx tsx scripts/promote-admin.ts admin@example.com
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables locally
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const [key, ...values] = line.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
} catch (e) {
  console.log("Could not load local .env, falling back to process.env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address.");
  console.error("Usage: npx tsx scripts/promote-admin.ts user@example.com");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteAdmin() {
  console.log(`🔍 Searching for user with email: ${email}`);

  // 1. Find user in auth.users (optional, but we need the ID from public.users)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("email", email)
    .single();

  if (userError || !user) {
    console.error("❌ User not found in public.users table.");
    process.exit(1);
  }

  if (user.role === "platform_admin") {
    console.log("✅ User is already a platform_admin.");
    process.exit(0);
  }

  // 2. Promote to platform_admin
  const { error: updateError } = await supabase
    .from("users")
    .update({ role: "platform_admin" })
    .eq("id", user.id);

  if (updateError) {
    console.error("❌ Failed to promote user:", updateError.message);
    process.exit(1);
  }

  console.log("🎉 Success! User has been promoted to platform_admin.");
  console.log("You can now access the admin dashboard at /admin");
}

promoteAdmin();
