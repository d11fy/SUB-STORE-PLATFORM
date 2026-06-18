const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Query RLS status
  const { data: rlsStatus, error: rlsErr } = await supabase.rpc('check_rls', {}) || {};
  
  // Alternative: write a direct SQL check using supabase.from or a query if rpc check_rls is not defined
  // Wait, let's just run custom sql if we can. Wait, we don't have a direct sql rpc.
  // But we can check postgres policies or just disable RLS on themes via SQL if we have a sql runner.
  // Wait! Let's check if there is an rpc or a function in db.
  console.log('Checking via REST API...');
  
  // Let's check pg_class directly by executing an ad-hoc query or looking at the schema.
  // Wait, can we execute arbitrary SQL through a migration or another script?
  // Let's check if the packages table also returns 0 rows using the Anon Key!
  const { data: pkgs, error: pErr } = await supabase.from('packages').select('*');
  console.log('Packages using Service Role:', pkgs ? pkgs.length : null, 'Error:', pErr);
  
  const anonSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: anonPkgs, error: apErr } = await anonSupabase.from('packages').select('*');
  console.log('Packages using Anon Key:', anonPkgs ? anonPkgs.length : null, 'Error:', apErr);
}
run();
