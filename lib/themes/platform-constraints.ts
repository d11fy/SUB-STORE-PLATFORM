// ============================================================
// Saba Store — D3.6 Platform Constraints Lock
// Design Budget + Theme Rule Engine + AI Output Governor
// All guards run server-side — cannot be bypassed by client.
// ============================================================

import type { SectionType } from "./customization-types";
import type { AiThemeConfig } from "@/lib/validations/ai-theme-config";

// ── Design Budget ────────────────────────────────────────────
// Single source of truth for all platform limits.
export const DESIGN_BUDGET = {
  MAX_SECTIONS_PER_PAGE: 15,      // D2 Pages Builder (matches Zod schema)
  MAX_SECTIONS_PER_THEME: 20,     // D1 Theme Customizer (matches Zod schema)
  MAX_AI_SECTIONS_PER_DRAFT: 10,  // D3 AI Theme Builder (matches Zod schema)
  MAX_HERO_VARIANTS: 4,           // light | split | branded | dark
  MAX_ACTIVE_COLORS: 3,           // primary + secondary + accent only
  MAX_CARDS_PER_ROW: 4,           // product grid CSS max-cols constraint
  MAX_NAV_LINKS: 8,               // header nav (matches Zod schema)
} as const;

// ── Single-instance section types ─────────────────────────────
// These types may appear at most once per theme configuration.
export const SINGLE_INSTANCE_TYPES = new Set<SectionType>([
  "hero",
  "about_text",
  "contact_section",
  "newsletter",
  "promo_banner",
]);

// ── Product-grid section types ────────────────────────────────
// Not allowed in service/subscription-only themes.
export const PRODUCT_SECTION_TYPES = new Set<SectionType>([
  "featured_products",
  "best_sellers",
  "latest_products",
]);

// ── Per-theme hard rules ──────────────────────────────────────
interface ThemeRule {
  label: string;
  blocked_section_types?: Set<SectionType>;
  blocked_hero_styles?: Set<string>;
  no_ai_injection?: boolean;
}

// Hard rule registry — applied at publish + AI apply time.
export const THEME_RULES: Record<string, ThemeRule> = {
  accessories: {
    label: "إكسسوارات فاخرة",
    // Accessories must stay light/elegant — dark hero breaks the luxury aesthetic.
    blocked_hero_styles: new Set(["dark"]),
  },
  subscriptions: {
    label: "اشتراكات رقمية",
    // Subscriptions is a SaaS layout — product grids make no sense here.
    // Use pricing_cards / services_list instead.
    blocked_section_types: new Set<SectionType>([
      "featured_products",
      "best_sellers",
      "latest_products",
    ]),
  },
  blank: {
    label: "ثيم فارغ (كانفاس)",
    // Blank is a canvas for manual design — AI layout injection is blocked.
    no_ai_injection: true,
  },
  personal_services: {
    label: "خدمات شخصية",
    // Services-only — use services_list and pricing_cards, not product grids.
    blocked_section_types: new Set<SectionType>([
      "featured_products",
      "best_sellers",
      "latest_products",
    ]),
  },
};

// ── Internal: section compatibility check ─────────────────────
type SectionLike = {
  type: string;
  enabled: boolean;
  label?: string;
};

function collectSectionTypeViolations(
  sections: SectionLike[],
  rule: ThemeRule
): string[] {
  const violations: string[] = [];
  if (!rule.blocked_section_types) return violations;

  for (const s of sections) {
    if (s.enabled && rule.blocked_section_types.has(s.type as SectionType)) {
      const display = s.label ? `"${s.label}"` : `(${s.type})`;
      violations.push(
        `قسم ${display} غير مسموح في ثيم "${rule.label}" — استخدم بديلاً مناسباً`
      );
    }
  }
  return violations;
}

// ── Guard 1: AI injection allowed? ───────────────────────────
export function checkAiInjectionAllowed(activeThemeSlug: string): {
  allowed: boolean;
  reason?: string;
} {
  const rule = THEME_RULES[activeThemeSlug];
  if (rule?.no_ai_injection) {
    return {
      allowed: false,
      reason: `ثيم "${rule.label}" لا يدعم حقن تخطيط الذكاء الاصطناعي — فعّل ثيماً آخر أولاً أو استخدم التخصيص اليدوي`,
    };
  }
  return { allowed: true };
}

// ── Guard 2: D1 sections validation (Customizer + Publish) ───
export function validateD1SectionsConstraints(
  sections: SectionLike[],
  themeSlug: string
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  // Budget check
  if (sections.length > DESIGN_BUDGET.MAX_SECTIONS_PER_THEME) {
    violations.push(
      `عدد الأقسام (${sections.length}) يتجاوز الحد المسموح (${DESIGN_BUDGET.MAX_SECTIONS_PER_THEME} كحد أقصى)`
    );
  }

  // Theme rule check
  const rule = THEME_RULES[themeSlug];
  if (rule) {
    violations.push(...collectSectionTypeViolations(sections, rule));
  }

  return { valid: violations.length === 0, violations };
}

// ── Guard 3: AI section normalization (Output Governor) ──────
// Removes duplicate single-instance sections, caps at budget.
// Returns normalized sections + a log of applied normalizations.
export function normalizeAiSections(
  sections: AiThemeConfig["sections"]
): {
  normalized: AiThemeConfig["sections"];
  log: string[];
} {
  const log: string[] = [];
  let result = [...sections];

  // Step 1: Deduplicate single-instance types — keep first occurrence.
  const seenTypes = new Set<string>();
  result = result.filter((s) => {
    if (SINGLE_INSTANCE_TYPES.has(s.type as SectionType)) {
      if (seenTypes.has(s.type)) {
        log.push(`إزالة قسم مكرر: "${s.type}" (يُسمح بنسخة واحدة فقط)`);
        return false;
      }
      seenTypes.add(s.type);
    }
    return true;
  });

  // Step 2: Cap at budget (trim trailing sections).
  if (result.length > DESIGN_BUDGET.MAX_AI_SECTIONS_PER_DRAFT) {
    const excess = result.length - DESIGN_BUDGET.MAX_AI_SECTIONS_PER_DRAFT;
    result = result.slice(0, DESIGN_BUDGET.MAX_AI_SECTIONS_PER_DRAFT);
    log.push(
      `تقليص الأقسام بـ ${excess} للالتزام بالحد (${DESIGN_BUDGET.MAX_AI_SECTIONS_PER_DRAFT} أقسام)`
    );
  }

  // Step 3: Re-number orders sequentially after changes.
  result = result.map((s, i) => ({ ...s, order: i }));

  return { normalized: result, log };
}

// ── Guard 4: Full AI config constraint check ──────────────────
// Combines: AI injection guard + normalization + theme rules.
// Returns normalized config if valid, or list of violations.
export function validateAiConfigConstraints(
  config: AiThemeConfig,
  activeThemeSlug: string
): {
  valid: boolean;
  violations: string[];
  normalized: AiThemeConfig;
} {
  // 1. AI injection guard (blank theme, etc.)
  const injectionCheck = checkAiInjectionAllowed(activeThemeSlug);
  if (!injectionCheck.allowed) {
    return {
      valid: false,
      violations: [injectionCheck.reason!],
      normalized: config,
    };
  }

  // 2. Normalize AI sections (dedup + budget)
  const { normalized: normalizedSections, log } = normalizeAiSections(config.sections);
  if (log.length > 0) {
    console.info("[D3.6 AI Governor]", log);
  }
  const normalizedConfig: AiThemeConfig = { ...config, sections: normalizedSections };

  // 3. Theme rule checks on normalized sections
  const violations: string[] = [];
  const rule = THEME_RULES[activeThemeSlug];
  if (rule) {
    violations.push(
      ...collectSectionTypeViolations(normalizedSections as SectionLike[], rule)
    );

    // Hero style check (e.g., accessories blocks "dark" hero)
    if (rule.blocked_hero_styles?.has(config.hero.style)) {
      violations.push(
        `نمط الهيرو "${config.hero.style}" غير مسموح في ثيم "${rule.label}" — ` +
          `الأنماط المسموحة: ${["light", "split", "branded", "dark"]
            .filter((s) => !rule.blocked_hero_styles!.has(s))
            .join(", ")}`
      );
    }
  }

  // 4. Hero presence check (must survive normalization)
  const hasHero = normalizedSections.some((s) => s.type === "hero");
  if (!hasHero) {
    violations.push(
      "يجب أن يحتوي التخطيط على قسم هيرو واحد على الأقل بعد التطبيع"
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    normalized: normalizedConfig,
  };
}
