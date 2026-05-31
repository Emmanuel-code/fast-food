import { createClient } from '@supabase/supabase-js';

const url = "https://jbltrwsuekmixqnlocwx.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibHRyd3N1ZWttaXhxbmxvY3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTEwNDEsImV4cCI6MjA5NTEyNzA0MX0.wO0K17JYq-97H9R-u3BEO3a5wARdzJODYw3IEcHtPzg";

const supabase = createClient(url, key);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, role, email');
  console.log("Profiles:", profiles);
  console.log("Error:", error);
}

check();
