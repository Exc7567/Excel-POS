import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tbuyrgetbjdjhpnxcanv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_hSgeRqz_mqczgunz2sCaPA_JAyOTp6r';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
