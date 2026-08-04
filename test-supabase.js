const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);
supabase.from('deal').select('*').limit(1).then(({ data, error }) => {
  console.log('Data:', data);
  console.log('Error:', error);
});
