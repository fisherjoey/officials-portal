import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase client (safe for browser use)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for Netlify Functions only)
// Only initialize if service key is available (server-side only)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Type-safe table accessors for direct Supabase access
export const publicNewsTable = () => supabase.from('public_news')
export const publicTrainingTable = () => supabase.from('public_training_events')
export const publicResourcesTable = () => supabase.from('public_resources')
export const publicPagesTable = () => supabase.from('public_pages')
export const officialsTable = () => supabase.from('officials')