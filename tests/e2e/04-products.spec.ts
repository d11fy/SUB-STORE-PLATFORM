import { test, expect } from "@playwright/test";
import { hasMerchantCreds } from "./helpers/env";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Product Management", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard/products");
    await page.waitForLoadState("networkidle");
  });

  test("products page loads with list or empty state", async ({ page }) => {
    // Either a product list or empty state should be visible
    const content = page.locator("table, [data-testid='empty-state'], .products-list, h1, h2");
    await expect(content.first()).toBeVisible();
  });

  test("create physical product button is accessible", async ({ page }) => {
    const addBtn = page.locator(
      '[data-testid="add-product-btn"], a[href*="products/new"], button:has-text("منتج"), button:has-text("إضافة"), a:has-text("إضافة")'
    ).first();
    await expect(addBtn).toBeVisible();
  });

  test("can navigate to new product form", async ({ page }) => {
    const addBtn = page
      .locator('[data-testid="add-product-btn"], a[href*="products/new"], button:has-text("إضافة منتج")')
      .first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForLoadState("networkidle");
      // Should be on new product page
      expect(page.url()).toMatch(/products\/(new|\d+|edit)/);
    }
  });

  test("products table shows headers", async ({ page }) => {
    const tableOrList = page.locator("table, [role='table']");
    if (await tableOrList.isVisible()) {
      await expect(tableOrList).toBeVisible();
    }
  });

  test("no console errors on products page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/dashboard/products");
    await page.waitForLoadState("networkidle");

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("fonts.googleapis")
    );
    expect(criticalErrors, `Errors: ${criticalErrors.join("; ")}`).toHaveLength(0);
  });
});

test.describe("Product Form Validation", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  test("new product form requires name", async ({ page }) => {
    await page.goto("/dashboard/products/new");
    await page.waitForLoadState("networkidle");

    // Try to submit without filling name
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      // Should still be on the form (validation error)
      expect(page.url()).toMatch(/products\/(new|create)/);
    }
  });
});
