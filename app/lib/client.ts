import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE as string

supabaseUrl || console.warn("Warning: NEXT_PUBLIC_SUPABASE_URL is not set in the environment variables. Please check your .env file.")
supabaseKey || console.warn("Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in the environment variables. Please check your .env file.")

export const supabase = createClient(supabaseUrl, supabaseKey)

// Cliente admin para operaciones del servidor (API routes)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

  supabaseServiceKey || console.warn("Warning: SUPABASE_SERVICE_ROLE_KEY is not set in the environment variables. Admin client will not be available. Please check your .env file.")