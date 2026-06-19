// ============================================================
// Saba Store — Environment Variable Validation
// Called once at module load; throws on missing required vars.
// ============================================================
import { z } from "zod";

const envSchema = z.object({
  // Supabase — always required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // AI provider (optional — features degrade gracefully if absent)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Node env
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");

    const message = `\n[saba-store] Missing or invalid environment variables:\n${missing}\n`;

    // In production, crash fast so the deployment fails visibly
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    // In dev, warn but continue so the dev server still starts
    console.warn(message);
    return result.data as unknown as Env; // partial data — fine for dev
  }

  return result.data;
}

// Singleton — validated once per cold start
export const env = validateEnv();
