// ============================================================
// Saba Store — D4 Safe Custom CSS: Server-side Sanitizer + Scoper
// Never imported by client code. Called only from server actions
// and the /store/[slug]/theme.css route handler.
//
// Two-stage pipeline:
//   sanitizeCustomCss(raw)           — strips dangerous patterns
//   scopeCustomCss(sanitized, id)    — wraps every rule under .store-{id}
//
// IMPORTANT: Always run sanitizeCustomCss BEFORE scopeCustomCss.
// ============================================================

export const MAX_CUSTOM_CSS_CHARS = 5_000;

// ── Stage 1: Sanitizer ────────────────────────────────────────────────────────

interface BlockRule {
  pattern: RegExp;
  label: string;
}

// Patterns that execute code, load external resources, or escape
// the <style> tag context. Each is replaced with a CSS comment so
// the developer can see what was removed rather than a silent drop.
const BLOCK_RULES: BlockRule[] = [
  { pattern: /expression\s*\(/gi,    label: "expression()" },
  { pattern: /behavior\s*:/gi,       label: "behavior:" },
  { pattern: /-moz-binding/gi,       label: "-moz-binding" },
  { pattern: /javascript\s*:/gi,     label: "javascript:" },
  { pattern: /vbscript\s*:/gi,       label: "vbscript:" },
  { pattern: /@import\b/gi,          label: "@import" },
  { pattern: /url\s*\(/gi,           label: "url()" },
  // Closing/opening HTML tags inside CSS — tries to escape the <style> block
  { pattern: /<\/?\s*style\b/gi,     label: "</style>" },
  // data: URI inside any remaining url()-like pattern (belt-and-suspenders)
  { pattern: /data\s*:/gi,           label: "data:" },
];

export interface CssSanitizeResult {
  css: string;
  violations: string[];
}

export function sanitizeCustomCss(raw: string): CssSanitizeResult {
  const violations: string[] = [];
  let css = raw;

  // Strip any HTML tags — blocks injection through concatenation bugs.
  const noHtml = css.replace(/<[^>]*>/g, "");
  if (noHtml !== css) {
    violations.push("تم حذف وسوم HTML من الكود");
    css = noHtml;
  }

  // Apply each block rule — replace with a visible comment marker.
  for (const { pattern, label } of BLOCK_RULES) {
    const next = css.replace(pattern, `/* ${label}: محظور */`);
    if (next !== css) {
      violations.push(`"${label}" محظور لأسباب أمنية`);
      css = next;
    }
  }

  return { css: css.trim(), violations };
}

// ── Stage 2: Scoper ───────────────────────────────────────────────────────────
//
// scopeCustomCss wraps every CSS rule so it only matches elements that
// are descendants of the store's root element (.store-{storeId}).
//
// This prevents a merchant's CSS from leaking into:
//   - Platform UI elements injected into the same page
//   - Other tenants' storefronts if ever rendered in the same document
//   - Any element outside the .store-{id} boundary
//
// How to apply the scope anchor in the layout:
//   <div className={`... store-${store.id}`} ...>
//
// Special selector handling:
//   body, html, :root  →  replaced with .store-{id}  (not appended — these
//                          are ancestors of the scope div, not descendants)
//   *                  →  .store-{id} *              (scoped universal)
//   .my-class          →  .store-{id} .my-class
//   @media (...)       →  inner rules are recursively scoped
//   @keyframes         →  passed through unchanged (named, not global)
//   @font-face         →  passed through unchanged (no selector)
//   everything else    →  dropped (safe default)
//
// Scoping happens at serve time (route handler), NOT at save time.
// The DB stores the raw merchant CSS so the editor shows clean code.

export function scopeCustomCss(sanitizedCss: string, storeId: string): string {
  // UUID chars are a-f0-9 and hyphens — all valid in CSS class names.
  // Strip anything unexpected before using in a selector.
  const safeId = storeId.replace(/[^a-zA-Z0-9-]/g, "");
  if (!safeId) return sanitizedCss;

  const scope = `.store-${safeId}`;

  // Strip CSS comments first to prevent false brace-counting inside comment text.
  const noComments = sanitizedCss.replace(/\/\*[\s\S]*?\*\//g, " ");

  return parseAndScope(noComments, scope).trim();
}

// ── Internal: character-level CSS block parser ────────────────────────────────

// Reads from `start` (which must point at an opening '{') through the matching
// closing '}', correctly counting nested brace pairs.
// Returns: { inner: content between { }, end: index after the closing } }
function readBlock(css: string, start: number): { inner: string; end: number } {
  let depth = 0;
  let i = start;
  while (i < css.length) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        return {
          inner: css.slice(start + 1, i),
          end: i + 1,
        };
      }
    }
    i++;
  }
  // Unclosed block — return everything remaining
  return { inner: css.slice(start + 1), end: css.length };
}

// Scopes a single selector string (potentially comma-separated).
// Handles multi-selector rules like ".a, .b, h1" correctly.
function scopeSelector(selector: string, scope: string): string {
  const parts = selector.split(",");
  const scoped = parts
    .map((s) => {
      const t = s.trim();
      if (!t) return null;
      // body / html / :root → become the scope element (not a descendant query)
      if (/^(body|html|:root)$/.test(t)) return scope;
      return `${scope} ${t}`;
    })
    .filter((s): s is string => s !== null);

  return scoped.length > 0 ? scoped.join(",\n") : "";
}

// Recursively parses top-level CSS blocks and scopes every selector.
function parseAndScope(css: string, scope: string): string {
  const output: string[] = [];
  let i = 0;

  while (i < css.length) {
    // Skip whitespace / newlines between rules
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    if (css[i] === "@") {
      // ── @-rule ─────────────────────────────────────────────────────────────
      let j = i + 1;
      while (j < css.length && /[a-zA-Z-]/.test(css[j])) j++;
      const name = css.slice(i + 1, j).toLowerCase().replace(/^-[a-z]+-/, "");

      // Read prelude (everything up to { or ;)
      let k = j;
      while (k < css.length && css[k] !== "{" && css[k] !== ";") k++;

      if (k >= css.length) break;

      const prelude = css.slice(i, k).trimEnd();

      if (css[k] === ";") {
        // Single-line @-rule (charset, import, etc.) — drop
        i = k + 1;
        continue;
      }

      // Block @-rule
      const { inner, end } = readBlock(css, k);

      if (name === "keyframes" || name === "font-face") {
        // Pass through unchanged — keyframes are scoped by animation-name,
        // font-face has no selector.
        output.push(`${prelude} {\n${inner}\n}`);
      } else if (
        name === "media" ||
        name === "supports" ||
        name === "layer" ||
        name === "container"
      ) {
        // Wrapper @-rules: recursively scope their inner rules.
        const scopedInner = parseAndScope(inner, scope);
        if (scopedInner.trim()) {
          output.push(`${prelude} {\n${scopedInner}\n}`);
        }
      }
      // All other @-rules (charset, namespace, page, etc.) — drop silently.

      i = end;
    } else if (css[i] === "}") {
      // Orphan closing brace — skip
      i++;
    } else {
      // ── Regular selector rule ───────────────────────────────────────────────
      // Read selector text up to the opening brace.
      let j = i;
      while (j < css.length && css[j] !== "{" && css[j] !== "}") j++;

      if (j >= css.length || css[j] === "}") {
        i = j < css.length ? j + 1 : j;
        continue;
      }

      const rawSelector = css.slice(i, j).trim();
      if (!rawSelector) {
        const { end } = readBlock(css, j);
        i = end;
        continue;
      }

      const { inner, end } = readBlock(css, j);
      const declarations = inner.trim();

      if (!declarations) {
        i = end;
        continue;
      }

      const scoped = scopeSelector(rawSelector, scope);
      if (scoped) {
        output.push(`${scoped} {\n  ${declarations.replace(/\n/g, "\n  ")}\n}`);
      }

      i = end;
    }
  }

  return output.join("\n\n");
}
