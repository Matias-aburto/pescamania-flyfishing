'use client'

import { useState, useEffect } from 'react'
import { AppSettings } from '@/lib/settings'

interface MainContentProps {
  children: React.ReactNode
  initialSettings?: AppSettings
}

export default function MainContent({ children, initialSettings }: MainContentProps) {
  const [settings, setSettings] = useState<AppSettings | null>(initialSettings || null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const loadSettings = () => {
      // Usar valores iniciales del window si están disponibles
      if ((window as any).__APP_SETTINGS__) {
        const windowSettings = (window as any).__APP_SETTINGS__
        // Migrar formato antiguo si existe
        if (windowSettings.announcementBar?.message && !windowSettings.announcementBar?.messages) {
          windowSettings.announcementBar.messages = [windowSettings.announcementBar.message]
          delete windowSettings.announcementBar.message
        }
        setSettings(windowSettings)
      } else if (initialSettings) {
        setSettings(initialSettings)
      } else {
        // Verificar si ya hay settings en window y son recientes
        const windowSettings = (window as any).__APP_SETTINGS__
        const lastFetch = (window as any).__APP_SETTINGS_LAST_FETCH
        const now = Date.now()
        
        if (windowSettings && lastFetch && (now - lastFetch) < 60000) {
          // Usar settings del window si son recientes
          if (windowSettings.announcementBar?.message && !windowSettings.announcementBar?.messages) {
            windowSettings.announcementBar.messages = [windowSettings.announcementBar.message]
            delete windowSettings.announcementBar.message
          }
          setSettings(windowSettings)
          return
        }
        
        // Solo hacer fetch si no hay settings recientes en window
        fetch('/api/admin/settings')
          .then(res => res.json())
          .then(data => {
            // Migrar formato antiguo si existe
            if (data.announcementBar?.message && !data.announcementBar?.messages) {
              data.announcementBar.messages = [data.announcementBar.message]
              delete data.announcementBar.message
            }
            setSettings(data)
            ;(window as any).__APP_SETTINGS__ = data
            ;(window as any).__APP_SETTINGS_LAST_FETCH = now
          })
          .catch(() => {})
      }
    }

    loadSettings()

    // Escuchar eventos de actualización
    const handleSettingsUpdate = () => {
      // Usar settings del window si son recientes (menos de 60 segundos)
      const windowSettings = (window as any).__APP_SETTINGS__
      const lastFetch = (window as any).__APP_SETTINGS_LAST_FETCH
      const now = Date.now()
      
      if (windowSettings && lastFetch && (now - lastFetch) < 60000) {
        if (windowSettings.announcementBar?.message && !windowSettings.announcementBar?.messages) {
          windowSettings.announcementBar.messages = [windowSettings.announcementBar.message]
          delete windowSettings.announcementBar.message
        }
        setSettings(windowSettings)
        return
      }
      
      // Solo hacer fetch si no hay settings recientes
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data.announcementBar?.message && !data.announcementBar?.messages) {
            data.announcementBar.messages = [data.announcementBar.message]
            delete data.announcementBar.message
          }
          setSettings(data)
          ;(window as any).__APP_SETTINGS__ = data
          ;(window as any).__APP_SETTINGS_LAST_FETCH = now
        })
        .catch(() => {})
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate)
    }
  }, [initialSettings])

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

