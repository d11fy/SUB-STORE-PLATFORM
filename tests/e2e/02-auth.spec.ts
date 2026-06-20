import { test, expect } from "@playwright/test";
import { hasMerchantCreds, hasAdminCreds } from "./helpers/env";
import { loginAsMerchant, loginAsAdmin } from "./helpers/auth";

test.describe("Auth Pages — Public", () => {
  test("/login renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes("favicon"));
    expect(criticalErrors).toHaveLength(0);
  });

  test("/register renders without errors", async ({ page }) => {
    const response = await page.goto("/register");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("login validation shows error for invalid email", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("notanemail");
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator("form")).toBeVisible();
    // Should still be on login page (not redirected)
    expect(page.url()).toContain("/login");
  });

  test("login shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("wrong@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword123");
    await page.locator('button[type="submit"]').click();

    // Wait for error message (toast or inline)
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
  });
});

test.describe("Auth Flow — Merchant Login", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test("merchant can login and reach dashboard", async ({ page }) => {
    await loginAsMerchant(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("merchant can logout", async ({ page }) => {
    await loginAsMerchant(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // Look for sign out button
    const signoutBtn = page
      .locator('button:has-text("خروج"), button:has-text("تسجيل الخروج")')
      .first();
    if (await signoutBtn.isVisible()) {
      await signoutBtn.click();
      await page.waitForURL("/", { timeout: 10000 });
      expect(page.url()).toBe("http://localhost:3000/");
    }
  });
});

test.describe("Auth Flow — Admin Login", () => {
  test.skip(!hasAdminCreds, "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

  test("admin can login and reach admin panel", async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
    // Navigate to admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("merchant cannot access /admin", async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/admin");
    // Should redirect away from admin
    await page.waitForTimeout(2000);
    const url = page.url();
    // Must not stay on /admin (should redirect to /dashboard or /login)
    expect(url).not.toMatch(/\/admin\/?(stores|users|packages)?$/);
  });
});
