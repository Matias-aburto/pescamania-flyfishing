import { NextResponse } from 'next/server'
import { consultarTarifas, calcularDimensionesCarrito } from '@/lib/starken'
import { StarkenQuoteRequest } from '@/types/shipping'
import { getSettings } from '@/lib/settings'

// Cache corta para cotizaciones (30 segundos)
export const revalidate = 30

export async function POST(request: Request) {
  let body: any = null
  try {
    body = await request.json()
    const {
      codigoCiudadOrigen,
      codigoCiudadDestino,
      alto,
      ancho,
      largo,
      kilos,
      cuentaCorriente,
      cuentaCorrienteDV,
      rutCliente,
      items, // Opcional: si se envía, se calculan dimensiones automáticamente
    } = body

    // Validar campos requeridos
    if (
      codigoCiudadOrigen === undefined ||
      codigoCiudadDestino === undefined
    ) {
      return NextResponse.json(
        { error: 'Ciudad de origen y destino son requeridas' },
        { status: 400 }
      )
    }

    // Si se envían items, calcular dimensiones automáticamente
    let finalAlto = alto
    let finalAncho = ancho
    let finalLargo = largo
    let finalKilos = kilos

    if (items && Array.isArray(items) && items.length > 0) {
      try {
        // Obtener settings para usar dimensiones por defecto configuradas
        const settings = await getSettings()
        const dimensiones = await calcularDimensionesCarrito(items, {
          alto: settings.starkenDefaultAlto,
          ancho: settings.starkenDefaultAncho,
          largo: settings.starkenDefaultLargo,
          kilos: settings.starkenDefaultKilos,
        })
        finalAlto = dimensiones.alto
        finalAncho = dimensiones.ancho
        finalLargo = dimensiones.largo
        finalKilos = dimensiones.kilos
        console.log('Dimensiones calculadas:', dimensiones)
      } catch (error) {
        console.error('Error calculando dimensiones:', error)
        return NextResponse.json(
          { error: 'Error al calcular dimensiones del carrito' },
          { status: 400 }
        )
      }
    }

    // Validar dimensiones
    if (!finalAlto || !finalAncho || !finalLargo || !finalKilos) {
      console.error('Dimensiones faltantes:', { finalAlto, finalAncho, finalLargo, finalKilos })
      return NextResponse.json(
        { error: 'Dimensiones y peso son requeridos' },
        { status: 400 }
      )
    }
    
    console.log('Request a Starken:', {
      codigoCiudadOrigen,
      codigoCiudadDestino,
      alto: finalAlto,
      ancho: finalAncho,
      largo: finalLargo,
      kilos: finalKilos,
    })

    // Si no se proporciona cuentaCorriente ni rutCliente, usar rutCliente por defecto
    // según el ejemplo del usuario que funcionó con Postman
    const defaultRutCliente = process.env.STARKEN_DEFAULT_RUT_CLIENTE || '13061694'
    
    const quoteRequest: StarkenQuoteRequest = {
      codigoCiudadOrigen: Number(codigoCiudadOrigen),
      codigoCiudadDestino: Number(codigoCiudadDestino),
      codigoAgenciaOrigen: 0,
      codigoAgenciaDestino: 0,
      alto: Number(finalAlto),
      ancho: Number(finalAncho),
      largo: Number(finalLargo),
      kilos: Number(finalKilos),
      ...(cuentaCorriente
        ? {
            cuentaCorriente: String(cuentaCorriente),
            cuentaCorrienteDV: cuentaCorrienteDV || '',
            rutCliente: '',
          }
        : rutCliente
        ? {
            rutCliente: String(rutCliente),
            cuentaCorriente: '',
            cuentaCorrienteDV: '',
          }
        : {
            // Por defecto, usar rutCliente si no se especifica nada
            rutCliente: defaultRutCliente,
            cuentaCorriente: '',
            cuentaCorrienteDV: '',
          }),
    }

    const tarifas = await consultarTarifas(quoteRequest)
    
    // Aplicar porcentaje adicional si está configurado
    const settings = await getSettings()
    const porcentajeAdicional = settings.starkenPorcentajeAdicional || 0
    
    const tarifasConAjuste = tarifas.map(tarifa => {
      let costoFinal = tarifa.cost
      
      if (porcentajeAdicional !== 0) {
        const ajuste = costoFinal * (porcentajeAdicional / 100)
        costoFinal = costoFinal + ajuste
      }
      
      // Redondear a número entero (sin decimales) para Chile
      costoFinal = Math.max(0, Math.round(costoFinal))
      
      return {
        ...tarifa,
        cost: costoFinal,
      }
    })

    return NextResponse.json(tarifasConAjuste, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
      },
    })
  } catch (error) {
    console.error('Error en /api/shipping/quote:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack, body })
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    )
  }
}

