'use client'

import { useEffect, useState } from 'react'

interface AppSettings {
  primaryColor?: string
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#0284c7')

  useEffect(() => {
    setMounted(true)
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: AppSettings) => {
        if (data.primaryColor) {
          setPrimaryColor(data.primaryColor)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mounted) {
      // Aplicar el color como variable CSS
      document.documentElement.style.setProperty('--color-primary-600', primaryColor)
      
      // Calcular variaciones del color para hover states
      const rgb = hexToRgb(primaryColor)
      if (rgb) {
        // primary-700 (más oscuro para hover)
        const darker = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`
        document.documentElement.style.setProperty('--color-primary-700', darker)
        
        // primary-200 (más claro para backgrounds)
        const lighter = `rgb(${Math.min(255, rgb.r + 100)}, ${Math.min(255, rgb.g + 100)}, ${Math.min(255, rgb.b + 100)})`
        document.documentElement.style.setProperty('--color-primary-200', lighter)
      }
    }
  }, [mounted, primaryColor])

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

