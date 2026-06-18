// ============================================================
// Saba Store — Shared Utilities
// ============================================================
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui className merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// SLUG GENERATION
// ============================================================
export function generateSlug(text: string): string {
  // Handle Arabic text by transliterating common chars
  const arabicToLatin: Record<string, string> = {
    "ا": "a", "أ": "a", "إ": "a", "آ": "aa",
    "ب": "b", "ت": "t", "ث": "th", "ج": "j",
    "ح": "h", "خ": "kh", "د": "d", "ذ": "th",
    "ر": "r", "ز": "z", "س": "s", "ش": "sh",
    "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
    "ع": "a", "غ": "gh", "ف": "f", "ق": "q",
    "ك": "k", "ل": "l", "م": "m", "ن": "n",
    "ه": "h", "و": "w", "ي": "y", "ى": "a",
    "ة": "a", "ء": "a",
    " ": "-",
  };

  let slug = text.toLowerCase().trim();

  // Replace Arabic chars
  slug = slug
    .split("")
    .map((char) => arabicToLatin[char] ?? char)
    .join("");

  // Clean up
  slug = slug
    .replace(/[^a-z0-9-]/g, "-") // replace non-slug chars
    .replace(/-+/g, "-")          // collapse multiple dashes
    .replace(/^-|-$/g, "");       // trim dashes

  return slug;
}

// ============================================================
// CURRENCY FORMATTING (Arabic)
// ============================================================
export function formatCurrency(
  amount: number,
  currency: string = "ILS"
): string {
  const formatters: Record<string, string> = {
    ILS: "₪",
    JOD: "دينار",
    USD: "$",
    EUR: "€",
  };

  const symbol = formatters[currency] ?? currency;
  const formatted = new Intl.NumberFormat("ar-PS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === "ILS") return `${formatted} ₪`;
  if (currency === "JOD") return `${formatted} دينار`;
  return `${symbol}${formatted}`;
}

// ============================================================
// DATE FORMATTING (Arabic)
// ============================================================
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });
  const diffInSeconds = (Date.now() - d.getTime()) / 1000;

  if (diffInSeconds < 60) return "الآن";
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  return formatDate(d);
}

// ============================================================
// TRIAL STATUS HELPERS
// ============================================================
export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(
  status: string,
  trialEndsAt: string | null
): boolean {
  if (status !== "trialing") return false;
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

// ============================================================
// MISC UTILITIES
// ============================================================
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
