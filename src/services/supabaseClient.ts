import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
