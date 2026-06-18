// ============================================================
// Saba Store — D4 Safe Custom CSS: Server-side Sanitizer
// Never imported by client code. Called only from server actions
// and the /store/[slug]/theme.css route handler.
// ============================================================

export const MAX_CUSTOM_CSS_CHARS = 5_000;

interface BlockRule {
  pattern: RegExp;
  label: string;
}

// Patterns that execute code, load external resources, or escape
// the <style> tag context. Each is replaced with a CSS comment so
// the developer can see what was removed rather than a silent drop.
const BLOCK_RULES: BlockRule[] = [
  { pattern: /expression\s*\(/gi, label: "expression()" },
  { pattern: /behavior\s*:/gi, label: "behavior:" },
  { pattern: /-moz-binding/gi, label: "-moz-binding" },
  { pattern: /javascript\s*:/gi, label: "javascript:" },
  { pattern: /vbscript\s*:/gi, label: "vbscript:" },
  { pattern: /@import\b/gi, label: "@import" },
  { pattern: /url\s*\(/gi, label: "url()" },
  // Closing/opening HTML tags inside CSS — tries to escape the <style> block
  { pattern: /<\/?\s*style\b/gi, label: "</style>" },
];

export interface CssSanitizeResult {
  css: string;
  violations: string[];
}

export function sanitizeCustomCss(raw: string): CssSanitizeResult {
  const violations: string[] = [];
  let css = raw;

  // 1. Strip any remaining HTML tags (belt-and-suspenders: should never
  //    appear in CSS, but blocks injection through concatenation bugs).
  const noHtml = css.replace(/<[^>]*>/g, "");
  if (noHtml !== css) {
    violations.push("تم حذف وسوم HTML من الكود");
    css = noHtml;
  }

  // 2. Apply each block rule — replace match with visible comment marker.
  for (const { pattern, label } of BLOCK_RULES) {
    const next = css.replace(pattern, `/* ${label}: محظور */`);
    if (next !== css) {
      violations.push(`"${label}" محظور لأسباب أمنية`);
      css = next;
    }
  }

  return { css: css.trim(), violations };
}
