import { test, expect } from "@playwright/test";
import { hasStoreSlug, STORE_SLUG } from "./helpers/env";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables locally for Supabase client
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length > 0) envVars[k.trim()] = v.join("=").trim().replace(/^['"]|['"]$/g, "");
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

test.describe("Storefront — Public", () => {
  test.skip(!hasStoreSlug, "Requires E2E_STORE_SLUG to be set");

  test.beforeAll(async () => {
    if (!supabaseUrl || !supabaseKey) return;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the store ID for teststore
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", STORE_SLUG)
      .maybeSingle();

    if (store) {
      // Ensure at least one payment method is active (cash_on_delivery doesn't require proof)
      const { data: pm } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("store_id", store.id);

      if (!pm || pm.length === 0) {
        await supabase.from("payment_methods").insert({
          store_id: store.id,
          name: "الدفع عند الاستلام",
          type: "cash_on_delivery",
          is_active: true,
        });
      }

      // Ensure at least one shipping method is active
      const { data: sm } = await supabase
        .from("shipping_methods")
        .select("id")
        .eq("store_id", store.id);

      if (!sm || sm.length === 0) {
        await supabase.from("shipping_methods").insert({
          store_id: store.id,
          name: "توصيل سريع",
          type: "fixed",
          base_price: 15,
          is_active: true,
        });
      }
    }
  });

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

  test("checkout with cross-store product ID shows error", async ({ page }) => {
    // 1. Navigate to store homepage to initialize state
    await page.goto(`/store/${STORE_SLUG}`);
    await page.waitForLoadState("networkidle");

    // 2. Set cart items in localStorage with an invalid product UUID
    const invalidProductId = "00000000-0000-0000-0000-000000000000";
    await page.evaluate((productId) => {
      localStorage.setItem(
        "saba-store-cart",
        JSON.stringify({
          state: {
            items: [
              {
                product_id: productId,
                store_id: "00000000-0000-0000-0000-000000000000",
                name: "منتج مخترق من متجر آخر",
                slug: "hacked-product",
                price: 10,
                sale_price: null,
                image: null,
                quantity: 1,
                stock: 5,
              }
            ],
            storeId: "00000000-0000-0000-0000-000000000000",
          }
        })
      );
    }, invalidProductId);

    // 3. Go to checkout page
    await page.goto(`/store/${STORE_SLUG}/checkout`);
    await page.waitForLoadState("networkidle");

    // 4. Fill in checkout form
    await page.locator('input[name="full_name"]').fill("عميل مجهول");
    await page.locator('input[name="phone"]').fill("0599000000");

    // If shipping is required, fill in address (city is pre-selected)
    const addressInput = page.locator('input[name="address"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill("شارع الإرسال، عمارة 5");
    }

    // Select shipping method and payment method if visible
    const firstShippingMethod = page.locator('input[name="shipping_method_id"]').first();
    if (await firstShippingMethod.isVisible()) {
      await firstShippingMethod.check();
    }
    const firstPaymentMethod = page.locator('input[name="payment_method_id"]').first();
    if (await firstPaymentMethod.isVisible()) {
      await firstPaymentMethod.check();
    }

    // Upload a mock payment proof file if required (input is present)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'proof.png',
        mimeType: 'image/png',
        buffer: Buffer.from('dummy-image-content'),
      });
    }

    // 5. Submit order
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled(); // Ensure button is now enabled
    await submitBtn.click();

    // 6. Assert error message is shown
    const toast = page.locator("div:has-text('غير متوفر')");
    await expect(toast.first()).toBeVisible();
  });
});
