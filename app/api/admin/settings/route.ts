import { NextResponse } from 'next/server'
import { getSettings, saveSettings, AppSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await getSettings()
    // Migrar formato antiguo si existe
    let announcementBar = settings.announcementBar || {
      enabled: false,
      messages: [],
      position: 'top',
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      rotationInterval: 5,
    }
    
    // Si tiene el formato antiguo (message), migrar a messages
    if ((announcementBar as any).message && !announcementBar.messages) {
      announcementBar = {
        ...announcementBar,
        messages: [(announcementBar as any).message],
        rotationInterval: 5,
      }
      delete (announcementBar as any).message
    }
    
    // Asegurar que siempre tenga la estructura completa
    const fullSettings: AppSettings = {
      whatsappNumber: settings.whatsappNumber || '',
      logo: settings.logo || '',
      favicon: settings.favicon || '',
      primaryColor: settings.primaryColor || '#0284c7',
      minimumPurchase: settings.minimumPurchase !== undefined ? settings.minimumPurchase : 0,
      pickupAddress: settings.pickupAddress || '',
      menuItems: settings.menuItems || [],
      announcementBar: {
        enabled: announcementBar.enabled || false,
        messages: announcementBar.messages || [],
        position: announcementBar.position || 'top',
        backgroundColor: announcementBar.backgroundColor || '#0ea5e9',
        textColor: announcementBar.textColor || '#ffffff',
        rotationInterval: announcementBar.rotationInterval || 5,
      },
    }
    return NextResponse.json(fullSettings)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    // Migrar formato antiguo si existe
    let announcementBar = body.announcementBar || {
      enabled: false,
      messages: [],
      position: 'top',
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      rotationInterval: 5,
    }
    
    // Si tiene el formato antiguo (message), migrar a messages
    if (announcementBar.message && !announcementBar.messages) {
      announcementBar = {
        ...announcementBar,
        messages: [announcementBar.message],
        rotationInterval: announcementBar.rotationInterval || 5,
      }
      delete announcementBar.message
    }
    
    const settings: AppSettings = {
      whatsappNumber: body.whatsappNumber || '',
      logo: body.logo || '',
      favicon: body.favicon || '',
      primaryColor: body.primaryColor || '#0284c7',
      minimumPurchase: body.minimumPurchase !== undefined ? body.minimumPurchase : 0,
      pickupAddress: body.pickupAddress || '',
      menuItems: body.menuItems || [],
      announcementBar: {
        enabled: announcementBar.enabled || false,
        messages: announcementBar.messages || [],
        position: announcementBar.position || 'top',
        backgroundColor: announcementBar.backgroundColor || '#0ea5e9',
        textColor: announcementBar.textColor || '#ffffff',
        rotationInterval: announcementBar.rotationInterval || 5,
      },
    }
    await saveSettings(settings)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Error al guardar configuración', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// También exportar POST como alternativa (algunos servidores pueden requerirlo)
export async function POST(request: Request) {
  return PUT(request)
}

