import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import CartSidebar from '@/components/CartSidebar'
import AnnouncementBar from '@/components/AnnouncementBar'
import MainContent from '@/components/MainContent'
import ThemeProvider from '@/components/ThemeProvider'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Pescamania Fly - Catálogo de Moscas',
  description: 'Catálogo de patrones de moscas para fly fishing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${poppins.className}`}>
        <ThemeProvider>
          <AnnouncementBar position="top" />
          <Navbar />
          <MainContent>
            {children}
          </MainContent>
          <AnnouncementBar position="bottom" />
          <CartSidebar />
        </ThemeProvider>
      </body>
    </html>
  )
}

