// Configuration for Supabase
// Replace these with your actual Supabase project URL and anon key
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
}
