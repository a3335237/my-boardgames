import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lckukdusnzpkleioupmf.supabase.co'
const supabaseAnonKey = 'sb_publishable_1BqmlBXfQcUgFwt1kV9KsA_1KAd5L29'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)