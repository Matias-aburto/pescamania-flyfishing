import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import CartSidebar from '@/components/CartSidebar'
import AnnouncementBar from '@/components/AnnouncementBar'
import MainContent from '@/components/MainContent'
import ThemeProvider from '@/components/ThemeProvider'
import { getSettings } from '@/lib/settings'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Pescamania Fly - Catálogo de Moscas',
  description: 'Catálogo de patrones de moscas para fly fishing',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()
  
  // Calcular variaciones del color para CSS
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

  const primaryColor = settings.primaryColor || '#0284c7'
  const rgb = hexToRgb(primaryColor)
  const darker = rgb ? `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})` : primaryColor
  const lighter = rgb ? `rgb(${Math.min(255, rgb.r + 100)}, ${Math.min(255, rgb.g + 100)}, ${Math.min(255, rgb.b + 100)})` : primaryColor
  
  return (
    <html lang="es">
      <head>
        {/* Inyectar favicon directamente en el head */}
        {settings.favicon && (
          <link rel="icon" href={settings.favicon} />
        )}
        {/* Inyectar settings y CSS variables críticas antes del render */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__APP_SETTINGS__ = ${JSON.stringify(settings)};
              (function() {
                const root = document.documentElement;
                root.style.setProperty('--color-primary-600', '${primaryColor}');
                root.style.setProperty('--color-primary-700', '${darker}');
                root.style.setProperty('--color-primary-200', '${lighter}');
              })();
            `,
          }}
        />
        {/* CSS variables inline para evitar flash */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary-600: ${primaryColor};
                --color-primary-700: ${darker};
                --color-primary-200: ${lighter};
              }
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} ${poppins.className}`}>
        <ThemeProvider initialSettings={settings}>
          <AnnouncementBar position="top" />
          <Navbar initialSettings={settings} />
          <MainContent initialSettings={settings}>
            {children}
          </MainContent>
          <AnnouncementBar position="bottom" />
          <CartSidebar />
        </ThemeProvider>
      </body>
    </html>
  )
}

