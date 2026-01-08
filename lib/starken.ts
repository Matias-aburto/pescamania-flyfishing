import {
  StarkenQuoteRequest,
  StarkenQuoteResponse,
  StarkenCitiesResponse,
  StarkenCiudad,
  ShippingQuote,
  ShippingCity,
} from '@/types/shipping'

// Configuración de la API de Starken
const STARKEN_QA_BASE_URL = 'https://restservices-qa.starken.cl/apiqa/starkenservices/rest'
const STARKEN_RUT = process.env.STARKEN_RUT || '76211240'
const STARKEN_KEY = process.env.STARKEN_KEY || 'key'

// Headers de autorización
function getAuthHeaders() {
  return {
    'Rut': STARKEN_RUT,
    'clave': STARKEN_KEY,
    'Content-Type': 'application/json',
  }
}

/**
 * Consulta tarifas de envío a Starken
 */
export async function consultarTarifas(
  request: StarkenQuoteRequest
): Promise<ShippingQuote[]> {
  try {
    const response = await fetch(`${STARKEN_QA_BASE_URL}/consultarTarifas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        codigoCiudadOrigen: request.codigoCiudadOrigen,
        codigoCiudadDestino: request.codigoCiudadDestino,
        codigoAgenciaOrigen: 0, // Siempre 0 según documentación
        codigoAgenciaDestino: 0, // Siempre 0 según documentación
        alto: request.alto,
        ancho: request.ancho,
        largo: request.largo,
        kilos: request.kilos,
        ...(request.cuentaCorriente
          ? {
              cuentaCorriente: request.cuentaCorriente,
              cuentaCorrienteDV: request.cuentaCorrienteDV || '',
              rutCliente: '',
            }
          : request.rutCliente
          ? {
              rutCliente: request.rutCliente,
              cuentaCorriente: '',
              cuentaCorrienteDV: '',
            }
          : {}),
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Error de autenticación con Starken. Verifica las credenciales.')
      }
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      throw new Error(`Error en API Starken: ${response.status} ${response.statusText}`)
    }

    const data: StarkenQuoteResponse = await response.json()
    console.log('Respuesta de consultarTarifas:', JSON.stringify(data).substring(0, 500))

    if (data.codigoRespuesta !== 1) {
      throw new Error(data.mensajeRespuesta || 'Error al consultar tarifas')
    }
    
    if (!data.listaTarifas || data.listaTarifas.length === 0) {
      throw new Error('No se encontraron tarifas para esta ruta')
    }

    // Convertir tarifas de Starken al formato simplificado
    return data.listaTarifas.map((tarifa) => ({
      cost: tarifa.costoTotal,
      deliveryDays: tarifa.diasEntrega,
      deliveryType: tarifa.tipoEntrega.codigoTipoEntrega === 1 ? 'agency' : 'home',
      serviceType: tarifa.tipoServicio.codigoTipoServicio === 0 ? 'normal' : 'express',
      description: `${tarifa.tipoEntrega.descripcionTipoEntrega} - ${tarifa.tipoServicio.descripcionTipoServicio}`,
    }))
  } catch (error) {
    console.error('Error consultando tarifas de Starken:', error)
    throw error
  }
}

/**
 * Obtiene lista de ciudades de origen
 */
export async function listarCiudadesOrigen(): Promise<ShippingCity[]> {
  try {
    const response = await fetch(`${STARKEN_QA_BASE_URL}/listarCiudadesOrigen`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Error de autenticación con Starken. Verifica las credenciales.')
      }
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      throw new Error(`Error en API Starken: ${response.status} ${response.statusText}`)
    }

    const data: any = await response.json()
    console.log('Respuesta de listarCiudadesOrigen:', JSON.stringify(data).substring(0, 500))

    // La respuesta viene con listaCiudadesOrigen
    let ciudades: StarkenCiudad[] = []

    if (data.listaCiudadesOrigen && Array.isArray(data.listaCiudadesOrigen)) {
      if (data.codigoRespuesta && data.codigoRespuesta !== 1) {
        throw new Error(data.mensajeRespuesta || 'Error al obtener ciudades de origen')
      }
      ciudades = data.listaCiudadesOrigen
    } else if (Array.isArray(data)) {
      // Fallback: Array directo
      ciudades = data
    } else {
      console.error('Formato de respuesta inesperado:', data)
      throw new Error('Formato de respuesta inesperado de la API de Starken')
    }

    return ciudades.map((ciudad: StarkenCiudad) => ({
      code: ciudad.codigoCiudad,
      regionCode: ciudad.codigoRegion,
      name: ciudad.nombreCiudad,
    }))
  } catch (error) {
    console.error('Error obteniendo ciudades de origen de Starken:', error)
    throw error
  }
}

/**
 * Obtiene lista de ciudades de destino
 */
export async function listarCiudadesDestino(): Promise<ShippingCity[]> {
  try {
    const response = await fetch(`${STARKEN_QA_BASE_URL}/listarCiudadesDestino`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Error de autenticación con Starken. Verifica las credenciales.')
      }
      const errorText = await response.text()
      console.error('Error response body:', errorText)
      throw new Error(`Error en API Starken: ${response.status} ${response.statusText}`)
    }

    const data: any = await response.json()
    console.log('Respuesta de listarCiudadesDestino:', JSON.stringify(data).substring(0, 500))

    // La respuesta viene con listaCiudadesDestino
    let ciudades: StarkenCiudad[] = []

    if (data.listaCiudadesDestino && Array.isArray(data.listaCiudadesDestino)) {
      if (data.codigoRespuesta && data.codigoRespuesta !== 1) {
        throw new Error(data.mensajeRespuesta || 'Error al obtener ciudades de destino')
      }
      ciudades = data.listaCiudadesDestino
    } else if (Array.isArray(data)) {
      // Fallback: Array directo
      ciudades = data
    } else {
      console.error('Formato de respuesta inesperado:', data)
      throw new Error('Formato de respuesta inesperado de la API de Starken')
    }

    return ciudades.map((ciudad: StarkenCiudad) => ({
      code: ciudad.codigoCiudad,
      regionCode: ciudad.codigoRegion,
      name: ciudad.nombreCiudad,
    }))
  } catch (error) {
    console.error('Error obteniendo ciudades de destino de Starken:', error)
    throw error
  }
}

/**
 * Calcula dimensiones y peso total del carrito
 */
export interface CartDimensions {
  alto: number // cm
  ancho: number // cm
  largo: number // cm
  kilos: number // kg
}

export async function calcularDimensionesCarrito(
  items: Array<{ quantity: number }>,
  defaultDimensions?: {
    alto?: number
    ancho?: number
    largo?: number
    kilos?: number
  }
): Promise<CartDimensions> {
  // Valores por defecto: usar los proporcionados o los valores hardcodeados
  const ALTO_POR_ITEM = defaultDimensions?.alto || 10 // cm
  const ANCHO_POR_ITEM = defaultDimensions?.ancho || 10 // cm
  const LARGO_POR_ITEM = defaultDimensions?.largo || 10 // cm
  const KILOS_POR_ITEM = defaultDimensions?.kilos || 0.1 // kg

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  // Si no hay items, retornar valores mínimos
  if (totalItems === 0) {
    return {
      alto: ALTO_POR_ITEM,
      ancho: ANCHO_POR_ITEM,
      largo: LARGO_POR_ITEM,
      kilos: KILOS_POR_ITEM,
    }
  }

  // Calcular dimensiones totales (asumiendo que se apilan)
  // Para múltiples items, aumentar las dimensiones proporcionalmente
  return {
    alto: ALTO_POR_ITEM * Math.ceil(Math.sqrt(totalItems)),
    ancho: ANCHO_POR_ITEM * Math.ceil(Math.sqrt(totalItems)),
    largo: LARGO_POR_ITEM * Math.ceil(Math.sqrt(totalItems)),
    kilos: Math.max(0.1, totalItems * KILOS_POR_ITEM), // Mínimo 0.1 kg
  }
}

