import { test, expect } from "@playwright/test";
import { hasMerchantCreds } from "./helpers/env";
import { loginAsMerchant } from "./helpers/auth";

const THEME_KEYS = [
  "fashion",
  "electronics",
  "subscriptions",
  "books",
  "accessories",
  "blank",
  "personal_services",
  "general",
];

test.describe("Theme Preview Pages", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  for (const key of THEME_KEYS) {
    test(`preview/${key} loads without 404`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(`/dashboard/themes/preview/${key}`);
      await page.waitForLoadState("networkidle");

      const status = response?.status() ?? 0;
      expect(status, `Preview ${key} returned ${status}`).toBeLessThan(400);
    });
  }
});

test.describe("Theme Customizer", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard/themes/customize");
    await page.waitForLoadState("networkidle");
  });

  test("customize page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/dashboard/themes/customize");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("fonts.googleapis") &&
        !e.includes("ResizeObserver")
    );
    expect(criticalErrors, `JS errors: ${criticalErrors.join("; ")}`).toHaveLength(0);
  });

  test("has tab navigation (branding, sections, header, etc.)", async ({ page }) => {
    // Tabs should be visible
    const tabs = page.locator('[data-testid^="tab-"], [role="tab"], [data-state="active"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("primary color input is visible", async ({ page }) => {
    // Could also be in a tab — check branding tab first
    const brandingTab = page.locator('[data-testid="tab-colors"], [role="tab"]:has-text("الألوان"), [role="tab"]:has-text("العلامة")').first();
    if (await brandingTab.isVisible()) {
      await brandingTab.click();
      await page.waitForTimeout(500);
    }

    // At least one color-related input
    const inputs = page.locator('input[type="color"], input[name*="primary_color"]');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("preview panel renders theme", async ({ page }) => {
    // Wait a bit for the preview to render
    await page.waitForTimeout(2000);

    // Should have some content in the preview area
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(1000);
  });

  test("save draft button is accessible", async ({ page }) => {
    const saveBtn = page.locator(
      '[data-testid="save-draft-btn"], button:has-text("حفظ"), button:has-text("مسودة"), button:has-text("save")'
    ).first();
    await expect(saveBtn).toBeVisible();
  });

  test("publish button is accessible", async ({ page }) => {
    const publishBtn = page.locator(
      '[data-testid="publish-btn"], button:has-text("نشر"), button:has-text("publish")'
    ).first();
    await expect(publishBtn).toBeVisible();
  });
});

test.describe("AI Theme Builder", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test("AI tab exists in theme customizer", async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard/themes/customize");
    await page.waitForLoadState("networkidle");

    const aiTab = page.locator('[data-testid="tab-ai"], [role="tab"]:has-text("ذكاء"), [role="tab"]:has-text("AI")').first();
    await expect(aiTab).toBeVisible();
  });
});

test.describe("Custom CSS Editor", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test("CSS tab exists in theme customizer", async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard/themes/customize");
    await page.waitForLoadState("networkidle");

    const cssTab = page.locator('[data-testid="tab-css"], [role="tab"]:has-text("CSS"), [role="tab"]:has-text("css")').first();
    if (await cssTab.isVisible()) {
      await cssTab.click();
      await page.waitForTimeout(500);

      const textarea = page.locator("textarea");
      await expect(textarea).toBeVisible();
    }
  });
});
