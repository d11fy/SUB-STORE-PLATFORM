import type {
  ExtendedThemeSettings,
  SectionConfig,
  SectionType,
} from "./customization-types";

/**
 * Returns the ordered, enabled sections for storefront rendering.
 *
 * Priority:
 *  1. settings.settings.sections_config (JSONB — written by D1 publish)
 *  2. themeDefaults (compile-time fallback — preserves pre-D5 behavior)
 *
 * The legacy sections_order column is intentionally skipped: it uses
 * old string keys ("featured", "banner") and omits sections like
 * trust_badges, so falling through to themeDefaults is safer.
 *
 * All JSONB access is wrapped in try/catch — a malformed settings blob
 * must never crash the storefront; it falls back to themeDefaults.
 */
export function getOrderedSections(
  settingsRow: Record<string, unknown> | null | undefined,
  themeDefaults: SectionConfig[]
): SectionConfig[] {
  try {
    const extended = (settingsRow as any)?.settings as
      | ExtendedThemeSettings
      | undefined;

    const sectionsConfig = extended?.sections_config;
    if (Array.isArray(sectionsConfig) && sectionsConfig.length > 0) {
      return sectionsConfig
        .filter((s) => s && typeof s === "object" && s.enabled !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  } catch {
    // Malformed JSONB — fall through to themeDefaults
  }

  return themeDefaults
    .filter((s) => s.enabled !== false)
    .sort((a, b) => a.order - b.order);
}

/** True if the section type appears in the ordered list. */
export function isSectionActive(
  orderedSections: SectionConfig[],
  type: SectionType
): boolean {
  return orderedSections.some((s) => s.type === type);
}
