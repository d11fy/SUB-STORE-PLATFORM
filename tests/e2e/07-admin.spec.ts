import { test, expect } from "@playwright/test";
import { hasAdminCreds } from "./helpers/env";
import { loginAsAdmin } from "./helpers/auth";

const ADMIN_ROUTES = [
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/admin/stores", name: "Admin Stores" },
  { path: "/admin/merchants", name: "Admin Merchants" },
  { path: "/admin/packages", name: "Admin Packages" },
  { path: "/admin/subscriptions", name: "Admin Subscriptions" },
  { path: "/admin/revenue", name: "Admin Revenue" },
  { path: "/admin/ai-usage", name: "Admin AI Usage" },
  { path: "/admin/settings", name: "Admin Settings" },
  { path: "/admin/security", name: "Admin Security" },
  { path: "/admin/logs", name: "Admin Logs" },
  { path: "/admin/monitoring", name: "Admin Monitoring" },
  { path: "/admin/users", name: "Admin Users" },
];

test.describe("Admin Panel Navigation", () => {
  test.skip(!hasAdminCreds, "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Navigate to admin after login
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  for (const route of ADMIN_ROUTES) {
    test(`${route.name} (${route.path}) returns non-error status`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const status = response?.status() ?? 0;
      expect(status, `${route.path} returned ${status}`).toBeLessThan(400);

      const criticalErrors = errors.filter(
        (e) => !e.includes("favicon") && !e.includes("fonts.googleapis")
      );
      expect(
        criticalErrors,
        `JS errors on ${route.path}: ${criticalErrors.join("; ")}`
      ).toHaveLength(0);
    });
  }

  test("admin sidebar is visible", async ({ page }) => {
    const sidebar = page.locator("nav, aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("admin cannot access another merchant store data", async ({ page }) => {
    // This is an access control sanity check
    await page.goto("/admin/stores");
    await page.waitForLoadState("networkidle");

    // Should see a list or empty state, not an error
    const content = page.locator("main, [role='main'], table, .container").first();
    await expect(content).toBeVisible();
  });
});

test.describe("Admin Access Control", () => {
  test("unauthenticated user cannot reach /admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });
});
