/**
 * Apply migration 00003 to fix profile creation.
 * Also checks if any profiles exist and creates one for existing users.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// Parse .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  env[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing SUPABASE_URL or ANON_KEY');
  process.exit(1);
}

function supabaseRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    } else {
      options.headers['Authorization'] = `Bearer ${ANON_KEY}`;
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('=== Checking Supabase connection ===');
  console.log('URL:', SUPABASE_URL);

  // 1. Check if profiles table has any rows
  console.log('\n--- Checking profiles table ---');
  const profiles = await supabaseRequest('GET', '/rest/v1/profiles?select=id,email,role&limit=5');
  console.log('Profiles status:', profiles.status);
  console.log('Profiles data:', JSON.stringify(profiles.data, null, 2));

  // 2. Check if auth users exist (via listing — may need service role)
  console.log('\n--- Checking restaurant_settings (public read) ---');
  const settings = await supabaseRequest('GET', '/rest/v1/restaurant_settings?select=id');
  console.log('Settings status:', settings.status);
  console.log('Settings data:', JSON.stringify(settings.data, null, 2));

  // 3. Try to sign in with a test account to check auth flow
  console.log('\n--- Testing sign in ---');
  const signIn = await supabaseRequest('POST', '/auth/v1/token?grant_type=password', {
    email: 'test@test.com',
    password: 'test1234',
  });
  console.log('Sign in status:', signIn.status);
  if (signIn.status === 200 && signIn.data.access_token) {
    console.log('Sign in SUCCESS. User ID:', signIn.data.user?.id);
    const token = signIn.data.access_token;

    // Check profile for this user
    const userId = signIn.data.user?.id;
    console.log('\n--- Checking profile for signed-in user ---');
    const userProfile = await supabaseRequest(
      'GET',
      `/rest/v1/profiles?select=*&id=eq.${userId}`,
      null,
      token
    );
    console.log('Profile status:', userProfile.status);
    console.log('Profile data:', JSON.stringify(userProfile.data, null, 2));

    // Try the RPC function
    console.log('\n--- Trying ensure_profile RPC ---');
    const rpc = await supabaseRequest(
      'POST',
      '/rest/v1/rpc/ensure_profile',
      { p_user_id: userId, p_email: signIn.data.user?.email || '', p_name: 'Test User' },
      token
    );
    console.log('RPC status:', rpc.status);
    console.log('RPC data:', JSON.stringify(rpc.data, null, 2));

    // If RPC failed, try direct insert
    if (rpc.status !== 200) {
      console.log('\n--- RPC not available, trying direct upsert ---');
      const upsert = await supabaseRequest(
        'POST',
        '/rest/v1/profiles',
        { id: userId, email: signIn.data.user?.email, name: 'Test User', role: 'customer' },
        token
      );
      console.log('Upsert status:', upsert.status);
      console.log('Upsert data:', JSON.stringify(upsert.data, null, 2));
    }

    // Re-check profile
    console.log('\n--- Re-checking profile after fix attempt ---');
    const recheck = await supabaseRequest(
      'GET',
      `/rest/v1/profiles?select=*&id=eq.${userId}`,
      null,
      token
    );
    console.log('Recheck status:', recheck.status);
    console.log('Recheck data:', JSON.stringify(recheck.data, null, 2));
  } else {
    console.log('Sign in failed:', JSON.stringify(signIn.data));
    console.log('(This is expected if test@test.com does not exist)');
  }

  console.log('\n=== DONE ===');
  console.log('\nIMPORTANT: You need to apply migration 00003 in the Supabase SQL editor:');
  console.log('Go to: https://supabase.com/dashboard → SQL Editor');
  console.log('Paste the contents of: supabase/migrations/00003_fix_profile_creation.sql');
  console.log('Then run it.');
}

main().catch(console.error);
