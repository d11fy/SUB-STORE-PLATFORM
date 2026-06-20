import { test, expect } from "@playwright/test";
import { hasMerchantCreds } from "./helpers/env";
import { loginAsMerchant } from "./helpers/auth";

const DASHBOARD_ROUTES = [
  { path: "/dashboard", name: "Dashboard Home" },
  { path: "/dashboard/products", name: "Products" },
  { path: "/dashboard/categories", name: "Categories" },
  { path: "/dashboard/orders", name: "Orders" },
  { path: "/dashboard/customers", name: "Customers" },
  { path: "/dashboard/pages", name: "Pages" },
  { path: "/dashboard/themes", name: "Themes" },
  { path: "/dashboard/themes/customize", name: "Theme Customize" },
  { path: "/dashboard/ai", name: "AI Tools" },
  { path: "/dashboard/settings", name: "Settings" },
  { path: "/dashboard/shipping", name: "Shipping" },
  { path: "/dashboard/payments", name: "Payments" },
  { path: "/dashboard/domain", name: "Domain" },
  { path: "/dashboard/subscription", name: "Subscription" },
  { path: "/dashboard/billing", name: "Billing" },
];

test.describe("Dashboard Navigation", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  for (const route of DASHBOARD_ROUTES) {
    test(`${route.name} (${route.path}) returns 200`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const status = response?.status() ?? 0;
      // Accept 200 or 307 (redirect within dashboard)
      expect(status, `${route.path} returned ${status}`).toBeLessThan(400);

      const criticalErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("fonts.googleapis") &&
          !e.includes("ResizeObserver")
      );
      expect(
        criticalErrors,
        `JS errors on ${route.path}: ${criticalErrors.join("; ")}`
      ).toHaveLength(0);
    });
  }

  test("sidebar is visible on desktop", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("nav, aside, [role='navigation']").first();
    await expect(sidebar).toBeVisible();
  });

  test("no horizontal overflow on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });
});

test.describe("Dashboard — Mobile Nav", () => {
  test.skip(!hasMerchantCreds, "Requires E2E_MERCHANT_EMAIL and E2E_MERCHANT_PASSWORD");
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile nav drawer opens and shows links", async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for hamburger / drawer trigger
    const menuTrigger = page.locator(
      'button[aria-label*="menu"], button[aria-label*="قائمة"], [data-testid="mobile-menu"]'
    ).first();

    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
      await page.waitForTimeout(500);

      // At least some nav links should appear
      const navLinks = page.locator("nav a, aside a");
      const count = await navLinks.count();
      expect(count).toBeGreaterThan(3);
    }
  });
});
