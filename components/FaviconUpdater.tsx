'use client'

import { useEffect } from 'react'

interface FaviconUpdaterProps {
  faviconUrl?: string
}

export default function FaviconUpdater({ faviconUrl }: FaviconUpdaterProps) {
  useEffect(() => {
    // El favicon ya está en el head del servidor, pero actualizamos si cambia
    const settings = (window as any).__APP_SETTINGS__
    const url = faviconUrl || settings?.favicon
    
    if (url) {
      // Buscar el link del favicon existente o crear uno nuevo
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      
      link.href = url
    }
  }, [faviconUrl])

  return null
}

