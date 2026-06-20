import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
];

const PUBLIC_ROUTES = [
  { path: "/", name: "Landing Page" },
  { path: "/login", name: "Login Page" },
  { path: "/register", name: "Register Page" },
];

for (const viewport of VIEWPORTS) {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} — no overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(
        bodyWidth,
        `Horizontal overflow at ${viewport.name} on ${route.path}: body=${bodyWidth} viewport=${viewport.width}`
      ).toBeLessThanOrEqual(viewport.width + 5);
    });
  }
}

test.describe("Login Form — Mobile Layout", () => {
  for (const viewport of VIEWPORTS.slice(0, 3)) {
    test(`login form single-column at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Inputs should be full width (not overflowing)
      const emailWidth = await emailInput.evaluate((el) => el.getBoundingClientRect().width);
      const pageWidth = viewport.width;
      expect(emailWidth).toBeLessThanOrEqual(pageWidth);
    });
  }
});

test.describe("Landing Page — Tablet", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("tablet layout — no overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(overflow).toBe(false);
  });

  test("pricing section visible on tablet", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#pricing").scrollIntoViewIfNeeded();
    const section = page.locator("#pricing");
    await expect(section).toBeVisible();
  });
});
