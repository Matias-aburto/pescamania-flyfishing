'use client'

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

export default function MainContent({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  // Calcular padding-top dinámico
  // Navbar: 80px (h-20)
  // Barra de anuncios arriba: ~42px si está habilitada
  const hasTopAnnouncement = mounted && 
                              settings?.announcementBar?.enabled && 
                              settings.announcementBar?.position === 'top' && 
                              settings.announcementBar?.messages &&
                              settings.announcementBar.messages.length > 0

  // Ajustar padding-top considerando el navbar flotante (80px + 8px margen + 8px extra para el logo)
  const paddingTop = hasTopAnnouncement ? 138 : 96 // 42px (barra) + 80px (navbar) + 8px (margen) + 8px (logo sobresaliente)

  return (
    <main 
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white" 
      style={{ paddingTop: `${paddingTop}px` }}
    >
      {children}
    </main>
  )
}

