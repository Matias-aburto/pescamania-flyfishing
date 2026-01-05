'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // Verificar sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          router.push('/admin/login')
          return
        }

        // Verificar si el usuario es admin
        const { data: userData, error: userError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (userError || !userData) {
          // Usuario no es admin, cerrar sesión y redirigir
          await supabase.auth.signOut()
          router.push('/admin/login')
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Escuchar cambios en la autenticación
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/admin/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

