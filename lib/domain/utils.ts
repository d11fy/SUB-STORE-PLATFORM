// Reserved domains/patterns that cannot be registered
const PLATFORM_DOMAINS = ["sabastore.com", "vercel.app", "vercel.dev", "now.sh", "pages.dev"];

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")   // strip path
    .replace(/\.$/, "")     // trailing dot
    .replace(/:[\d]+$/, ""); // strip port
}

export type DomainValidationResult =
  | { valid: true; normalized: string; isApex: boolean; isWww: boolean; isSubdomain: boolean }
  | { valid: false; error: string };

export function validateDomain(input: string): DomainValidationResult {
  const normalized = normalizeDomain(input);

  if (!normalized) return { valid: false, error: "أدخل اسم النطاق" };

  // Block localhost
  if (normalized === "localhost" || normalized.endsWith(".localhost"))
    return { valid: false, error: "النطاق localhost غير مسموح" };

  // Block IP addresses (simple check)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized))
    return { valid: false, error: "عناوين IP غير مسموح بها — استخدم اسم نطاق" };

  // Block wildcard
  if (normalized.startsWith("*"))
    return { valid: false, error: "النطاقات البطاقية (wildcard) غير مدعومة حاليًا" };

  // Block platform domains
  for (const pd of PLATFORM_DOMAINS) {
    if (normalized === pd || normalized.endsWith("." + pd))
      return { valid: false, error: `النطاق "${pd}" محجوز للمنصة` };
  }

  // Basic domain regex: supports subdomain.example.com, example.com, www.example.com
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  if (!domainRegex.test(normalized))
    return { valid: false, error: "صيغة النطاق غير صحيحة. مثال: mystore.com أو shop.example.com" };

  const parts = normalized.split(".");
  const isApex = parts.length === 2;
  const isWww = normalized.startsWith("www.") && parts.length === 3;
  const isSubdomain = !isApex && !isWww && parts.length >= 3;

  return { valid: true, normalized, isApex, isWww, isSubdomain };
}
