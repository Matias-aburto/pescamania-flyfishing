'use client'

import { useEffect } from 'react'

interface FaviconUpdaterProps {
  faviconUrl?: string
}

export default function FaviconUpdater({ faviconUrl }: FaviconUpdaterProps) {
  useEffect(() => {
    if (faviconUrl) {
      // Buscar el link del favicon existente o crear uno nuevo
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      
      link.href = faviconUrl
    }
  }, [faviconUrl])

  return null
}

