import { Page } from "@playwright/test";
import { MERCHANT_EMAIL, MERCHANT_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD } from "./env";

export async function loginAsMerchant(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="email"]').fill(MERCHANT_EMAIL);
  await page.locator('input[type="password"]').fill(MERCHANT_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Admin redirects to /admin after login
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
}

export async function logout(page: Page): Promise<void> {
  // Find and click the logout button in dashboard sidebar
  const logoutBtn = page.locator('[data-testid="logout-btn"], button:has-text("تسجيل الخروج")');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL("/", { timeout: 10000 });
  }
}
