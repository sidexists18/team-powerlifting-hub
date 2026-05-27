import { createClient } from '@supabase/supabase-js'

// Pull the secure keys we just configured in our environment file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize and export the single database connection instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey)