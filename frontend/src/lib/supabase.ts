// ============================================================
//  lib/supabase.ts — Cliente de Supabase para Realtime
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Variables de Supabase no configuradas. Realtime desactivado.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
