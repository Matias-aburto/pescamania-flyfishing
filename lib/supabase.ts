import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para uso en el servidor (API routes)
// Usa la secret key (nueva API key) para operaciones administrativas
// Esta clave tiene privilegios elevados y puede omitir RLS
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar SUPABASE_SECRET_KEY (nueva) o SUPABASE_SERVICE_ROLE_KEY (legacy) para compatibilidad
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Cliente de Supabase para uso en el cliente (browser)
// Usa la publishable key (nueva API key) para operaciones del cliente
// Esta clave respeta las políticas RLS
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (nueva) o NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy) para compatibilidad
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return createClient(supabaseUrl, supabasePublishableKey)
}

