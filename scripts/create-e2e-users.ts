import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables locally
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const [key, ...values] = line.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
} catch (e) {
  console.log("Could not load local .env, falling back to process.env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MERCHANT_EMAIL = "e2e_merchant@test.com";
const ADMIN_EMAIL = "e2e_admin@test.com";
const PASSWORD = "Password123!";
const STORE_SLUG = "teststore";

async function run() {
  console.log("🚀 Setting up E2E test users...");

  // 1. Clean up existing users to have a fresh state
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Error listing users:", listError.message);
    process.exit(1);
  }

  for (const u of users) {
    if (u.email === MERCHANT_EMAIL || u.email === ADMIN_EMAIL) {
      console.log(`🗑️ Deleting existing user: ${u.email}`);
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  // Wait a moment for deletions to propagate through DB cascade
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. Create merchant user
  console.log(`👤 Creating merchant user: ${MERCHANT_EMAIL}`);
  const { data: merchantAuth, error: merchantErr } = await supabase.auth.admin.createUser({
    email: MERCHANT_EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "تاجر تجريبي",
      role: "merchant"
    }
  });

  if (merchantErr || !merchantAuth.user) {
    console.error("❌ Failed to create merchant auth user:", merchantErr?.message);
    process.exit(1);
  }
  const merchantId = merchantAuth.user.id;
  console.log(`✅ Merchant created in Auth (ID: ${merchantId})`);

  // 3. Create admin user
  console.log(`👤 Creating admin user: ${ADMIN_EMAIL}`);
  const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "مدير تجريبي",
      role: "platform_admin"
    }
  });

  if (adminErr || !adminAuth.user) {
    console.error("❌ Failed to create admin auth user:", adminErr?.message);
    process.exit(1);
  }
  const adminId = adminAuth.user.id;
  console.log(`✅ Admin created in Auth (ID: ${adminId})`);

  // Wait a moment for trigger execution (which populates public.users)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Update Admin role in public.users to 'platform_admin'
  console.log("👑 Promoting admin to platform_admin role...");
  const { error: promoteErr } = await supabase
    .from("users")
    .update({ role: "platform_admin" })
    .eq("id", adminId);

  if (promoteErr) {
    console.error("❌ Failed to promote admin in public.users:", promoteErr.message);
    process.exit(1);
  }
  console.log("✅ Admin promoted successfully");

  // 5. Get a default package and theme to link to the new store
  const { data: packages, error: pkgErr } = await supabase
    .from("packages")
    .select("id")
    .eq("slug", "pro")
    .single();

  const { data: themes, error: themeErr } = await supabase
    .from("themes")
    .select("id")
    .eq("slug", "fashion")
    .single();

  const packageId = packages?.id;
  const themeId = themes?.id;

  if (!packageId || !themeId) {
    console.warn("⚠️ Could not find 'pro' package or 'fashion' theme. Will query any available.");
  }

  const finalPackageId = packageId || (await supabase.from("packages").select("id").limit(1).single()).data?.id;
  const finalThemeId = themeId || (await supabase.from("themes").select("id").limit(1).single()).data?.id;

  if (!finalPackageId || !finalThemeId) {
    console.error("❌ No packages or themes found in database. Seed the database first!");
    process.exit(1);
  }

  // 6. Create the store for the merchant
  console.log(`🏪 Creating store '${STORE_SLUG}' for merchant...`);
  const { data: store, error: storeErr } = await supabase
    .from("stores")
    .insert({
      owner_id: merchantId,
      name: "متجر تجريبي E2E",
      slug: STORE_SLUG,
      status: "active",
      package_id: finalPackageId,
      current_theme_id: finalThemeId,
      currency: "ILS",
      country: "PS"
    })
    .select()
    .single();

  if (storeErr || !store) {
    console.error("❌ Failed to create store in database:", storeErr?.message);
    process.exit(1);
  }
  console.log(`✅ Store created successfully (ID: ${store.id})`);

  // 7. Add AI Credits for the store
  console.log("🪙 Seeding AI credits...");
  const { error: creditsErr } = await supabase
    .from("ai_credits")
    .insert({
      store_id: store.id,
      credits_total: 1000,
      credits_used: 0
    });

  if (creditsErr) {
    console.warn("⚠️ Failed to seed AI credits (they might be auto-created):", creditsErr.message);
  } else {
    console.log("✅ AI credits seeded");
  }

  // 8. Add a default theme settings
  console.log("🎨 Seeding store theme settings...");
  const { error: themeSettingsErr } = await supabase
    .from("store_theme_settings")
    .insert({
      store_id: store.id,
      theme_id: finalThemeId,
      primary_color: "#1B4FD8",
      secondary_color: "#7C3AED",
      font_family: "Cairo",
      hero_title: "أهلاً بك في متجرنا التجريبي",
      hero_subtitle: "تصفح أحدث المنتجات والعروض المميزة"
    });

  if (themeSettingsErr) {
    console.warn("⚠️ Failed to seed theme settings (might be auto-created):", themeSettingsErr.message);
  } else {
    console.log("✅ Store theme settings seeded");
  }

  // 9. Add a test product
  console.log("📦 Creating test product...");
  const { data: product, error: productErr } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      name: "منتج تجريبي E2E",
      slug: "test-product",
      description: "وصف المنتج التجريبي لاختبار عملية الشراء والطلب.",
      price: 150.00,
      stock_quantity: 10,
      track_inventory: true,
      is_active: true
    })
    .select()
    .single();

  if (productErr) {
    console.error("❌ Failed to create product:", productErr.message);
  } else {
    console.log(`✅ Product created: ${product.name} (ID: ${product.id})`);

    // Add product image
    const { error: imageErr } = await supabase
      .from("product_images")
      .insert({
        store_id: store.id,
        product_id: product.id,
        url: "/themes/fashion/preview.jpg",
        is_primary: true
      });
    if (imageErr) {
      console.warn("⚠️ Failed to create product image:", imageErr.message);
    } else {
      console.log("✅ Product image added");
    }
  }

  console.log("\n🎉 E2E setup complete!");
  console.log(`Email/Password (Merchant): ${MERCHANT_EMAIL} / ${PASSWORD}`);
  console.log(`Email/Password (Admin): ${ADMIN_EMAIL} / ${PASSWORD}`);
  console.log(`Store Slug: ${STORE_SLUG}`);
}

run();
