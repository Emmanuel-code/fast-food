const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Connecting to Supabase...');
  const { data, error } = await supabase
    .from('restaurant_settings')
    .update({
      Your location      restaurant_lat: 10.882261,
      restaurant_lng: -1.083476,
      timezone: 'Africa/Accra'
    })
    .eq('id', 1)
    .select();

  if (error) {
    console.error('Failed to update restaurant settings:', error);
    process.exit(1);
  }

  console.log('Successfully updated restaurant settings in database:', data);
}

run();
