import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton para el cliente del servidor (solo se crea una vez)
let supabaseAdminInstance: SupabaseClient | null = null

// Cliente de Supabase para uso en el servidor (API routes)
// Usa la secret key (nueva API key) para operaciones administrativas
// Esta clave tiene privilegios elevados y puede omitir RLS
export function getSupabaseAdmin() {
  // Si ya existe una instancia, reutilizarla
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar SUPABASE_SECRET_KEY (nueva) o SUPABASE_SERVICE_ROLE_KEY (legacy) para compatibilidad
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY')
  }

  supabaseAdminInstance = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return supabaseAdminInstance
}

// Singleton para el cliente del navegador (solo se crea una vez por sesión)
let supabaseClientInstance: SupabaseClient | null = null

// Cliente de Supabase para uso en el cliente (browser)
// Usa la publishable key (nueva API key) para operaciones del cliente
// Esta clave respeta las políticas RLS
export function getSupabaseClient() {
  // En el cliente, verificar si ya existe una instancia en el contexto del navegador
  if (typeof window !== 'undefined') {
    // Usar una variable global para almacenar la instancia en el cliente
    if ((window as any).__supabaseClient) {
      return (window as any).__supabaseClient
    }
  } else {
    // En el servidor, usar la instancia del módulo
    if (supabaseClientInstance) {
      return supabaseClientInstance
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (nueva) o NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy) para compatibilidad
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase environment variables. Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  const client = createClient(supabaseUrl, supabasePublishableKey)

  if (typeof window !== 'undefined') {
    // Almacenar en el contexto del navegador
    (window as any).__supabaseClient = client
  } else {
    // Almacenar en el módulo para el servidor
    supabaseClientInstance = client
  }

  return client
}

