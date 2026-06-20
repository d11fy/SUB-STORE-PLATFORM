export const E2E_BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export const MERCHANT_EMAIL = process.env.E2E_MERCHANT_EMAIL || "";
export const MERCHANT_PASSWORD = process.env.E2E_MERCHANT_PASSWORD || "";
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "";
export const STORE_SLUG = process.env.E2E_STORE_SLUG || "";

export const hasMerchantCreds = !!(MERCHANT_EMAIL && MERCHANT_PASSWORD);
export const hasAdminCreds = !!(ADMIN_EMAIL && ADMIN_PASSWORD);
export const hasStoreSlug = !!STORE_SLUG;
