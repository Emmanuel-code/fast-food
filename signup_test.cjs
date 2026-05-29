const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    envConfig[match[1]] = val;
  }
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  const email = `test_${Date.now()}@test.com`;
  const password = 'TestPassword123!';
  const name = 'Test User';

  console.log(`Signing up ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
    return;
  }

  const userId = signUpData.user.id;
  console.log(`User created with ID: ${userId}. Waiting 2 seconds...`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Querying profiles table...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  } else {
    console.log('Profile created in DB:', profiles);
  }
}

testSignup();
