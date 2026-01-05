'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AppSettings {
  whatsappNumber: string
  logo: string
  announcementBar: {
    enabled: boolean
    messages: string[]
    position: 'top' | 'bottom'
    backgroundColor?: string
    textColor?: string
    rotationInterval?: number
  }
}

interface AnnouncementBarProps {
  position: 'top' | 'bottom'
}

export default function AnnouncementBar({ position }: AnnouncementBarProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [mounted, setMounted] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

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

  // Rotación automática de mensajes
  useEffect(() => {
    if (!settings?.announcementBar?.enabled || !settings.announcementBar.messages || settings.announcementBar.messages.length <= 1) {
      return
    }

    const interval = (settings.announcementBar.rotationInterval || 5) * 1000
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        (prev + 1) % settings.announcementBar.messages.length
      )
    }, interval)

    return () => clearInterval(timer)
  }, [settings?.announcementBar?.enabled, settings?.announcementBar?.messages, settings?.announcementBar?.rotationInterval])

  if (!mounted || !settings || !settings.announcementBar?.enabled || !settings.announcementBar?.messages || settings.announcementBar.messages.length === 0) {
    return null
  }

  // Solo mostrar si la posición coincide
  if (settings.announcementBar.position !== position) {
    return null
  }

  const { messages, backgroundColor = '#0ea5e9', textColor = '#ffffff' } = settings.announcementBar
  const currentMessage = messages[currentMessageIndex] || messages[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
      className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-[60]`}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-center">
          <div className="text-center relative min-h-[20px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium"
              >
                {currentMessage}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

