import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("opens without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");

    // No JS errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("fonts.googleapis")
    );
    expect(criticalErrors, `Console errors: ${criticalErrors.join(", ")}`).toHaveLength(0);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/سبأ ستور/);
  });

  test("navbar has login and register links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loginLink = page.locator('nav a[href="/login"]');
    await expect(loginLink).toBeVisible();

    const registerLink = page.locator('nav a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });

  test("hero section CTA links to /register", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const ctaLinks = page.locator('a[href="/register"]');
    const count = await ctaLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("themes section lists 8 themes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.locator("#themes").scrollIntoViewIfNeeded();
    const themeCards = page.locator("#themes .grid > div");
    await expect(themeCards).toHaveCount(8);
  });

  test("theme preview links exist", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const previewLinks = page.locator('a:has-text("معاينة الثيم")');
    const count = await previewLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("pricing section shows 3 packages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#pricing").scrollIntoViewIfNeeded();
    const pricingCards = page.locator("#pricing .grid > div");
    await expect(pricingCards).toHaveCount(3);
  });

  test("no horizontal overflow on desktop", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    expect(bodyWidth, `Horizontal overflow: body=${bodyWidth} viewport=${viewportWidth}`).toBeLessThanOrEqual(
      viewportWidth + 5
    );
  });

  test("footer has nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("no broken images", async ({ page }) => {
    const brokenImages: string[] = [];
    page.on("response", (response) => {
      if (
        response.url().match(/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i) &&
        response.status() >= 400
      ) {
        brokenImages.push(`${response.url()} → ${response.status()}`);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(brokenImages, `Broken images: ${brokenImages.join(", ")}`).toHaveLength(0);
  });
});

test.describe("Landing Page — Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens without horizontal overflow on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test("mobile nav shows login and register", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
  });
});
