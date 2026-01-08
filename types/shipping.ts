// Tipos para la API de Starken

export interface StarkenQuoteRequest {
  codigoCiudadOrigen: number
  codigoCiudadDestino: number
  codigoAgenciaOrigen: number // Siempre 0
  codigoAgenciaDestino: number // Siempre 0
  alto: number // cm
  ancho: number // cm
  largo: number // cm
  kilos: number // kg
  cuentaCorriente?: string // Condicional: si se usa, no usar rutCliente
  cuentaCorrienteDV?: string // Condicional: requerido si se usa cuentaCorriente
  rutCliente?: string // Condicional: si se usa, no usar cuentaCorriente
}

export interface StarkenTipoEntrega {
  codigoTipoEntrega: number // 1 = AGENCIA, 2 = DOMICILIO
  descripcionTipoEntrega: string
}

export interface StarkenTipoServicio {
  codigoTipoServicio: number // 0 = NORMAL, 1 = EXPRESS
  descripcionTipoServicio: string
}

export interface StarkenTarifa {
  costoTotal: number
  diasEntrega: number
  tipoEntrega: StarkenTipoEntrega
  tipoServicio: StarkenTipoServicio
}

export interface StarkenQuoteResponse {
  type: string
  codigoRespuesta: number
  mensajeRespuesta: string
  listaTarifas: StarkenTarifa[]
}

export interface StarkenCiudad {
  codigoCiudad: number
  codigoRegion: number
  TipoSalida: number
  nombreCiudad: string
}

export interface StarkenCitiesResponse {
  type?: string
  codigoRespuesta?: number
  mensajeRespuesta?: string
  listaCiudades?: StarkenCiudad[]
}

// Tipos simplificados para uso en la aplicación
export interface ShippingQuote {
  cost: number
  deliveryDays: number
  deliveryType: 'agency' | 'home' // 1 = agency, 2 = home
  serviceType: 'normal' | 'express' // 0 = normal, 1 = express
  description: string // Descripción legible
}

export interface ShippingCity {
  code: number
  regionCode: number
  name: string
}

