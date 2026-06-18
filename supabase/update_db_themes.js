// One-time migration script. Do not run repeatedly unless needed.
// This script updates existing theme slugs and details in-place to preserve foreign key constraints.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse environment variables manually from .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envVars[key] = val;
    }
  });

  return envVars;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env');
  process.exit(1);
}

// Create Supabase Client with service role to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const themeMapping = {
  nasma: {
    newSlug: 'fashion',
    name: 'قالب الملابس',
    description: 'تصميم أزياء قوي، صور كبيرة، بنرات عروض، أقسام وصل حديثًا والأكثر مبيعًا، بطاقات منتجات أنيقة.',
    category: 'fashion',
    preview_image: '/themes/fashion/preview.jpg',
    config: {
      hero_style: 'fullscreen_image',
      product_card: 'minimal',
      color_scheme: 'light_elegant',
      font_style: 'serif_arabic'
    }
  },
  ampere: {
    newSlug: 'electronics',
    name: 'قالب الأدوات الإلكترونية والكهربائية',
    description: 'تصميم تقني قوي، بطاقات منتجات تعرض مواصفات مختصرة، عروض واضحة، ألوان تقنية، مناسب للأجهزة والأدوات الكهربائية.',
    category: 'electronics',
    preview_image: '/themes/electronics/preview.jpg',
    config: {
      hero_style: 'video_bg',
      product_card: 'comparison_table',
      color_scheme: 'tech_blue',
      font_style: 'bold_arabic'
    }
  },
  matbakhi: {
    newSlug: 'subscriptions',
    name: 'قالب متجر الاشتراكات الرقمية',
    description: 'تصميم قريب من SaaS/pricing pages، بطاقات اشتراك، فوائد الخدمة، مقارنة باقات، CTA قوي، مناسب لبيع اشتراكات رقمية وخدمات عضوية.',
    category: 'subscriptions',
    preview_image: '/themes/subscriptions/preview.jpg',
    config: {
      hero_style: 'pricing_grid',
      product_card: 'subscription_card',
      color_scheme: 'purple_neon',
      font_style: 'modern_arabic'
    }
  },
  pixel: {
    newSlug: 'books',
    name: 'قالب الكتب والمنتجات الرقمية',
    description: 'تصميم مكتبة رقمية، عرض أغلفة كتب/ملفات، تصنيفات معرفية، وصف واضح، مناسب للكتب وPDF والدورات والقوالب الرقمية.',
    category: 'books',
    preview_image: '/themes/books/preview.jpg',
    config: {
      hero_style: 'tech_gradient',
      product_card: 'card_dark',
      color_scheme: 'dark_neon',
      font_style: 'mono_arabic'
    }
  },
  durra: {
    newSlug: 'accessories',
    name: 'قالب الإكسسوارات',
    description: 'تصميم فاخر، راقٍ، مناسب للهدايا والساعات والمجوهرات والإكسسوارات، تفاصيل دقيقة وبطاقات أنيقة.',
    category: 'accessories',
    preview_image: '/themes/accessories/preview.jpg',
    config: {
      hero_style: 'split_screen',
      product_card: 'luxury',
      color_scheme: 'gold_dark',
      font_style: 'modern_arabic'
    }
  },
  bayti: {
    newSlug: 'blank',
    name: 'القالب الفارغ للتخصيص من الصفر',
    description: 'قالب مرن ومحايد وقوي، مبني على Sections منظمة، يصلح لأي نشاط، ويكون الأساس لاحقًا للـ page builder.',
    category: 'blank',
    preview_image: '/themes/blank/preview.jpg',
    config: {
      hero_style: 'lifestyle_grid',
      product_card: 'room_scene',
      color_scheme: 'neutral_warm',
      font_style: 'clean_arabic'
    }
  },
  zahra: {
    newSlug: 'personal_services',
    name: 'قالب الخدمات الشخصية',
    description: 'مناسب للمدربين والاستشاريين والمصممين ومقدمي الخدمات، يحتوي أقسام خدمات، آراء العملاء، نبذة عن صاحب الخدمة، CTA للحجز أو الطلب.',
    category: 'personal_services',
    preview_image: '/themes/personal_services/preview.jpg',
    config: {
      hero_style: 'gradient_banner',
      product_card: 'rounded_soft',
      color_scheme: 'rose_pink',
      font_style: 'soft_arabic'
    }
  },
  souq: {
    newSlug: 'general',
    name: 'قالب المتجر العام متعدد الاستخدامات',
    description: 'قالب عملي وقوي لأي متجر، فئات واضحة، شبكة منتجات، عروض، مناسب للمبتدئين والمتاجر المتنوعة.',
    category: 'general',
    preview_image: '/themes/general/preview.jpg',
    config: {
      hero_style: 'deals_banner',
      product_card: 'classic_grid',
      color_scheme: 'vibrant_green',
      font_style: 'clear_arabic'
    }
  }
};

async function runMigration() {
  console.log('--- DB THEMES MIGRATION START ---');

  // 1. Fetch current themes in database to check existing slugs and match counts
  const { data: currentThemes, error: fetchError } = await supabase
    .from('themes')
    .select('id, slug, name');

  if (fetchError) {
    console.error('Error fetching existing themes from database:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${currentThemes.length} themes currently in the database:`);
  currentThemes.forEach(t => {
    console.log(` - ID: ${t.id} | Slug: ${t.slug} | Name: ${t.name}`);
  });

  // Count matches to be updated
  console.log('\nChecking update counts:');
  let updatesCount = 0;
  for (const oldSlug of Object.keys(themeMapping)) {
    const match = currentThemes.find(t => t.slug === oldSlug);
    if (match) {
      console.log(` - Old theme slug "${oldSlug}" exists (ID: ${match.id}) and will be updated to "${themeMapping[oldSlug].newSlug}".`);
      updatesCount++;
    } else {
      console.log(` - Old theme slug "${oldSlug}" NOT found (might have already been updated or doesn't exist).`);
    }
  }

  if (updatesCount === 0) {
    console.log('\nNo old slugs found to update. Checking if new slugs are already present...');
    const hasNewSlugs = currentThemes.some(t => Object.values(themeMapping).map(m => m.newSlug).includes(t.slug));
    if (hasNewSlugs) {
      console.log('New slugs already present. The migration might have already been executed.');
    } else {
      console.log('WARNING: Neither old slugs nor new slugs were found in database.');
    }
  }

  // 2. Perform updates in-place
  console.log('\nPerforming updates...');
  for (const oldSlug of Object.keys(themeMapping)) {
    const mapping = themeMapping[oldSlug];
    const match = currentThemes.find(t => t.slug === oldSlug);
    
    if (match) {
      console.log(`Updating "${oldSlug}" to "${mapping.newSlug}"...`);
      const { error: updateError } = await supabase
        .from('themes')
        .update({
          slug: mapping.newSlug,
          name: mapping.name,
          description: mapping.description,
          category: mapping.category,
          preview_image: mapping.preview_image,
          config: mapping.config
        })
        .eq('id', match.id);

      if (updateError) {
        console.error(`Error updating theme ID ${match.id} (slug: ${oldSlug}):`, updateError);
      } else {
        console.log(`Successfully updated theme ID ${match.id} to slug "${mapping.newSlug}".`);
      }
    }
  }

  // 3. Print final report
  console.log('\nFetching final themes table state...');
  const { data: finalThemes, error: finalError } = await supabase
    .from('themes')
    .select('id, slug, name, category');

  if (finalError) {
    console.error('Error fetching final themes:', finalError);
  } else {
    console.log('\n--- FINAL THEMES IN DATABASE ---');
    finalThemes.forEach(t => {
      console.log(` - ID: ${t.id} | Slug: ${t.slug} | Name: ${t.name} | Category: ${t.category}`);
    });
  }

  console.log('--- DB THEMES MIGRATION COMPLETED ---');
}

runMigration().catch(err => {
  console.error('Migration crashed with error:', err);
});
