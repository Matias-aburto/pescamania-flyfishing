'use client'

import { useEffect } from 'react'
import { AppSettings } from '@/lib/settings'

interface ThemeProviderProps {
  children: React.ReactNode
  initialSettings?: AppSettings
}

export default function ThemeProvider({ children, initialSettings }: ThemeProviderProps) {
  useEffect(() => {
    // Los valores ya están inyectados en el HTML, pero actualizamos si hay cambios
    // Esto permite actualizaciones en tiempo real sin recargar la página
    const updateFromWindow = () => {
      const settings = (window as any).__APP_SETTINGS__
      if (settings?.primaryColor) {
        const primaryColor = settings.primaryColor
        const rgb = hexToRgb(primaryColor)
        if (rgb) {
          const darker = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`
          const lighter = `rgb(${Math.min(255, rgb.r + 100)}, ${Math.min(255, rgb.g + 100)}, ${Math.min(255, rgb.b + 100)})`
          
          document.documentElement.style.setProperty('--color-primary-600', primaryColor)
          document.documentElement.style.setProperty('--color-primary-700', darker)
          document.documentElement.style.setProperty('--color-primary-200', lighter)
        }
      }
    }

    // Usar valores iniciales si están disponibles
    if (initialSettings?.primaryColor) {
      const primaryColor = initialSettings.primaryColor
      const rgb = hexToRgb(primaryColor)
      if (rgb) {
        const darker = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`
        const lighter = `rgb(${Math.min(255, rgb.r + 100)}, ${Math.min(255, rgb.g + 100)}, ${Math.min(255, rgb.b + 100)})`
        
        document.documentElement.style.setProperty('--color-primary-600', primaryColor)
        document.documentElement.style.setProperty('--color-primary-700', darker)
        document.documentElement.style.setProperty('--color-primary-200', lighter)
      }
    } else {
      // Fallback: usar valores de window si están disponibles
      updateFromWindow()
    }

    // Escuchar actualizaciones de settings (opcional, para actualizaciones en tiempo real)
    const handleSettingsUpdate = () => updateFromWindow()
    window.addEventListener('settingsUpdated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate)
    }
  }, [initialSettings])

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }

  return <>{children}</>
}

