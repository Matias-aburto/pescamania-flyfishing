'use client'

import { useCartStore } from '@/store/cartStore'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AppSettings {
  whatsappNumber: string
  logo: string
  announcementBar?: {
    enabled: boolean
    messages: string[]
    position: 'top' | 'bottom'
    backgroundColor?: string
    textColor?: string
    rotationInterval?: number
  }
}

export default function Navbar() {
  const { getTotalItems, openCart, items } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    setMounted(true)
    // Cargar configuración
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        // Migrar formato antiguo si existe
        if (data.announcementBar?.message && !data.announcementBar?.messages) {
          data.announcementBar.messages = [data.announcementBar.message]
          delete data.announcementBar.message
        }
        setSettings(data)
      })
      .catch(() => {})
  }, [])

  // Calcular totalItems solo después de montar para evitar error de hidratación
  const totalItems = mounted ? getTotalItems() : 0

  // Verificar si hay barra de anuncios arriba
  const hasTopAnnouncement = settings?.announcementBar?.enabled && 
                              settings.announcementBar?.position === 'top' && 
                              settings.announcementBar?.messages &&
                              settings.announcementBar.messages.length > 0

  // Calcular la altura de la barra de anuncios (py-2.5 = 0.625rem arriba + 0.625rem abajo + contenido ~20px)
  // Total aproximado: ~42px
  const announcementBarHeight = hasTopAnnouncement ? 42 : 0

  return (
    <nav 
      className={`sticky z-50`}
      style={{
        top: `${announcementBarHeight + 8}px`, // Agregar margen superior para efecto flotante
        padding: '0 16px',
      }}
    >
      <div className="container mx-auto">
        <div
          className="backdrop-blur-lg bg-white/80 border border-white/20 rounded-2xl"
          style={{
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div className="px-4 relative">
            <div className="flex items-center justify-between h-20">
              {/* Logo centrado y sobresaliente */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                    style={{
                      marginBottom: '-8px', // Hace que el logo sobresalga hacia abajo
                    }}
                  >
                    {settings?.logo ? (
                      <>
                        <img
                          src={settings.logo}
                          alt="Logo"
                          className="h-20 w-auto object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                            const textFallback = img.nextElementSibling as HTMLElement
                            if (textFallback) {
                              textFallback.style.display = 'block'
                            }
                          }}
                        />
                        <h1 className="text-3xl font-bold text-primary-600 hidden">
                          Pescamania Fly
                        </h1>
                      </>
                    ) : (
                      <h1 className="text-3xl font-bold text-primary-600">
                        Pescamania Fly
                      </h1>
                    )}
                  </motion.div>
                </Link>
              </div>

              {/* Menú izquierdo - vacío para balancear */}
              <div className="flex-1"></div>

              {/* Menú derecho */}
              <div className="flex items-center space-x-6 flex-1 justify-end">
                <Link
                  href="/"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Catálogo
                </Link>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCart}
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart size={24} />
                  {mounted && totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

