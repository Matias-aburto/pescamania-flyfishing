'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CartItem } from '@/types/product'
import { formatPrice } from '@/lib/formatPrice'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { getImageUrl } from '@/lib/imageCache'
import { ShoppingCart, ArrowLeft, Share2, Copy, Check, Package, Truck } from 'lucide-react'
import Link from 'next/link'

interface AppSettings {
  pickupAddress?: string
}

interface SharedCart {
  id: string
  items: CartItem[]
  deliveryType?: 'retiro' | 'envio' | null
  comuna?: string
  customerName?: string
  createdAt: string
  expiresAt?: string
}

export default function SharedCartPage() {
  const params = useParams()
  const [cart, setCart] = useState<SharedCart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    if (params.id) {
      // El servidor ya maneja el caché con revalidación (5s)
      // El navegador puede usar su caché HTTP normal
      fetch(`/api/cart/${params.id}`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              setError('Carrito no encontrado')
            } else if (res.status === 410) {
              setError('Este carrito ha expirado')
            } else {
              setError('Error al cargar el carrito')
            }
            setLoading(false)
            return
          }
          return res.json()
        })
        .then(data => {
          if (data) {
            setCart(data)
          }
          setLoading(false)
        })
        .catch(() => {
          setError('Error al cargar el carrito')
          setLoading(false)
        })
    }
    
    // Cargar configuración para obtener dirección de retiro
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: AppSettings) => {
        setSettings(data)
      })
      .catch(() => {})
  }, [params.id])

  const getTotalPrice = () => {
    if (!cart) return 0
    return cart.items.reduce((total, item) => {
      const price = item.variant?.price ?? item.product.price
      return total + (price * item.quantity)
    }, 0)
  }

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando carrito...</div>
      </div>
    )
  }

  if (error || !cart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              {error || 'Error'}
            </h2>
            <p className="text-red-600 mb-4">
              {error || 'No se pudo cargar el carrito compartido'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ArrowLeft size={16} />
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart size={32} className="text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Carrito Compartido
                </h1>
                {cart.customerName && (
                  <p className="text-gray-700 font-medium text-sm mb-1">
                    Cliente: {cart.customerName}
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  Creado el {new Date(cart.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copiar Link
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Productos ({cart.items.length})
          </h2>
          <div className="space-y-4">
            {cart.items.map((item) => {
              const itemPrice = item.variant?.price ?? item.product.price
              const baseImage = item.variant?.image || item.product.image
              const itemImage = getImageUrl(baseImage, item.product.updatedAt) || PLACEHOLDER_IMAGE
              return (
                <div
                  key={`${item.product.id}-${item.variant?.id || 'no-variant'}`}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={itemImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                      }}
                    />
                    {item.variant && (
                      <div
                        className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: item.variant.color }}
                        title={item.variant.name}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {item.product.name}
                      {item.variant && (
                        <span className="text-sm text-gray-500 ml-2">
                          - {item.variant.name}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Cantidad: {item.quantity}
                    </p>
                    <p className="text-lg font-bold text-primary-600">
                      {formatPrice(itemPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Información de Despacho */}
        {(cart.deliveryType || cart.comuna) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Información de Despacho
            </h2>
            {cart.deliveryType && (
              <div className="flex items-start gap-3 mb-3">
                {cart.deliveryType === 'retiro' ? (
                  <Package size={20} className="text-primary-600 mt-1" />
                ) : (
                  <Truck size={20} className="text-primary-600 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Tipo de Despacho:</p>
                  <p className="font-semibold text-gray-900">
                    {cart.deliveryType === 'retiro' ? 'Retiro en Tienda' : 'Envío a Domicilio'}
                  </p>
                  {cart.deliveryType === 'retiro' && settings?.pickupAddress && (
                    <p className="text-sm text-gray-600 mt-1">
                      {settings.pickupAddress}
                    </p>
                  )}
                </div>
              </div>
            )}
            {cart.deliveryType === 'envio' && cart.comuna && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Comuna:</p>
                <p className="font-semibold text-gray-900">{cart.comuna}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Resumen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between text-2xl font-bold mb-4">
            <span>Total:</span>
            <span className="text-primary-600">
              {formatPrice(getTotalPrice())}
            </span>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              <ArrowLeft size={20} />
              Ver Catálogo
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

