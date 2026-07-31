import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://faxmgbqzhwiwgsfqhzrw.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Vite env vars start with VITE_
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
