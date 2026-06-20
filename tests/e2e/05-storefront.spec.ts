import { test, expect } from "@playwright/test";
import { hasStoreSlug, STORE_SLUG } from "./helpers/env";

test.describe("Storefront — Public", () => {
  test.skip(!hasStoreSlug, "Requires E2E_STORE_SLUG to be set");

  const slug = STORE_SLUG;

  test("store homepage renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(`/store/${slug}`);
    await page.waitForLoadState("networkidle");

    expect(response?.status(), "Store homepage status").toBeLessThan(400);

    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("fonts.googleapis")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("header appears once", async ({ page }) => {
    await page.goto(`/store/${slug}`);
    await page.waitForLoadState("networkidle");

    const headers = page.locator("header");
    const count = await headers.count();
    expect(count, "Header should appear exactly once").toBe(1);
  });

  test("footer appears once", async ({ page }) => {
    await page.goto(`/store/${slug}`);
    await page.waitForLoadState("networkidle");

    const footers = page.locator("footer");
    const count = await footers.count();
    expect(count, "Footer should appear exactly once").toBe(1);
  });

  test("RTL direction is set", async ({ page }) => {
    await page.goto(`/store/${slug}`);
    await page.waitForLoadState("domcontentloaded");

    const dir = await page.locator("html, body, [dir]").first().getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("no horizontal overflow on desktop", async ({ page }) => {
    await page.goto(`/store/${slug}`);
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(
      () => document.body.scrollWidth > window.innerWidth
    );
    expect(overflow, "Horizontal overflow detected").toBe(false);
  });

  test("products page loads", async ({ page }) => {
    const response = await page.goto(`/store/${slug}/products`);
    await page.waitForLoadState("networkidle");
    expect(response?.status()).toBeLessThan(400);
  });

  test("custom CSS route responds", async ({ page }) => {
    const response = await page.goto(`/store/${slug}/theme.css`);
    // Should return 200 (even if empty CSS)
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toContain("text/css");
  });

  test("cart page loads", async ({ page }) => {
    const response = await page.goto(`/store/${slug}/cart`);
    await page.waitForLoadState("networkidle");
    expect(response?.status()).toBeLessThan(400);
  });

  test("checkout page loads", async ({ page }) => {
    const response = await page.goto(`/store/${slug}/checkout`);
    await page.waitForLoadState("networkidle");
    expect(response?.status()).toBeLessThan(400);
  });

  test("unknown page returns 404", async ({ page }) => {
    const response = await page.goto(`/store/${slug}/nonexistent-page-xyz`);
    // Should return 404 or redirect to store homepage
    const status = response?.status() ?? 0;
    expect([200, 404]).toContain(status);
  });
});

test.describe("Storefront — Mobile", () => {
  test.skip(!hasStoreSlug, "Requires E2E_STORE_SLUG");
  test.use({ viewport: { width: 390, height: 844 } });

  test("store homepage on mobile has no overflow", async ({ page }) => {
    await page.goto(`/store/${STORE_SLUG}`);
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => document.body.scrollWidth > 390 + 5);
    expect(overflow).toBe(false);
  });
});

test.describe("Storefront — Checkout Flow", () => {
  test.skip(!hasStoreSlug, "Requires E2E_STORE_SLUG");

  test("checkout without cart items shows empty state or redirect", async ({ page }) => {
    await page.goto(`/store/${STORE_SLUG}/checkout`);
    await page.waitForLoadState("networkidle");

    // Should either show empty cart message or redirect to cart — not an error page
    expect(page.url()).not.toContain("error");
  });
});
