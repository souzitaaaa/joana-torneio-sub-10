/* =====================================================================
   CLIENTE SUPABASE
   Preenche estes dois valores com os do teu projeto:
   Supabase → Project Settings → API → "Project URL" e "anon public key".
   A anon key é segura de expor no browser (é para isso que existe) —
   quem protege os dados a sério são as políticas de RLS no Postgres,
   não esta chave.
   ===================================================================== */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://rqgbxusuucmabqeqhqna.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G65L1hosf_pu1qqbqNahjg_6aClXQGR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
