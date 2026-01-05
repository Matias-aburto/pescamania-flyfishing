'use client'

import { useCartStore } from '@/store/cartStore'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, ShoppingCart, Plus, Minus, Trash2, AlertCircle } from 'lucide-react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AppSettings {
  whatsappNumber: string
  logo: string
  minimumPurchase?: number
  announcementBar?: {
    enabled: boolean
    messages: string[]
    position: 'top' | 'bottom'
    backgroundColor?: string
    textColor?: string
    rotationInterval?: number
  }
}

export default function CartSidebar() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getItemId,
  } = useCartStore()
  const [whatsappNumber, setWhatsappNumber] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Cargar número de WhatsApp desde configuración
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: any) => {
        // Migrar formato antiguo si existe
        if (data.announcementBar?.message && !data.announcementBar?.messages) {
          data.announcementBar.messages = [data.announcementBar.message]
          delete data.announcementBar.message
        }
        setSettings(data as AppSettings)
        if (data.whatsappNumber) {
          setWhatsappNumber(data.whatsappNumber)
        }
      })
      .catch(() => {})
  }, [])

  const handleViewCart = () => {
    closeCart()
    router.push('/cart')
  }

  const handleShareToWhatsApp = async () => {
    if (items.length === 0) {
      alert('El carrito está vacío')
      return
    }

    // Primero compartir el carrito para obtener el link
    setSharing(true)
    try {
      const response = await fetch('/api/cart/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      const data = await response.json()

      if (response.ok) {
        const sharedUrl = data.url
        
        // Enviar el link por WhatsApp
        const message = encodeURIComponent(`Hola! Me interesa solicitar este pedido:\n\n${sharedUrl}\n\nGracias!`)
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
        window.open(whatsappUrl, '_blank')
        closeCart()
      } else {
        alert(data.error || 'Error al compartir el carrito')
      }
    } catch (error) {
      alert('Error al compartir el carrito')
    } finally {
      setSharing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && items.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black bg-opacity-50 z-[70]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 w-full max-w-sm bg-white shadow-xl z-[70] flex flex-col"
            style={{
              top: (() => {
                // Calcular top dinámico según si hay barra de anuncios arriba
                if (!mounted || !settings?.announcementBar?.enabled) return '0px'
                if (settings.announcementBar.position === 'top' && 
                    settings.announcementBar.messages && 
                    settings.announcementBar.messages.length > 0) {
                  return '42px' // Altura de la barra de anuncios
                }
                return '0px'
              })(),
              bottom: (() => {
                // Calcular bottom dinámico según si hay barra de anuncios abajo
                if (!mounted || !settings?.announcementBar?.enabled) return '0px'
                if (settings.announcementBar.position === 'bottom' && 
                    settings.announcementBar.messages && 
                    settings.announcementBar.messages.length > 0) {
                  return '42px' // Altura de la barra de anuncios
                }
                return '0px'
              })(),
              maxHeight: (() => {
                // Calcular altura máxima considerando barras de anuncios
                let offset = 0
                if (mounted && settings?.announcementBar?.enabled) {
                  if (settings.announcementBar.position === 'top' && 
                      settings.announcementBar.messages && 
                      settings.announcementBar.messages.length > 0) {
                    offset += 42
                  }
                  if (settings.announcementBar.position === 'bottom' && 
                      settings.announcementBar.messages && 
                      settings.announcementBar.messages.length > 0) {
                    offset += 42
                  }
                }
                return offset > 0 ? `calc(100vh - ${offset}px)` : '100vh'
              })()
            }}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Carrito de Cotización
              </h2>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => {
                    const itemId = getItemId(item.product, item.variant)
                    const itemImage = item.variant?.image || item.product.image
                    const itemPrice = item.variant?.price ?? item.product.price
                    return (
                      <motion.div
                        key={itemId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex gap-4">
                          <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={itemImage || PLACEHOLDER_IMAGE}
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
                                <span className="text-xs text-gray-500 ml-2">
                                  - {item.variant.name}
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {formatPrice(itemPrice)} c/u
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(itemId, item.quantity - 1)
                                }
                                className="p-1 bg-white rounded border border-gray-300 hover:bg-gray-100"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(itemId, item.quantity + 1)
                                }
                                className="p-1 bg-white rounded border border-gray-300 hover:bg-gray-100"
                              >
                                <Plus size={16} />
                              </button>
                              <button
                                onClick={() => removeItem(itemId)}
                                className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 pb-12 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between text-lg font-bold mb-2">
                  <span>Total:</span>
                  <span className="text-primary-600">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>

                {/* Mensaje de mínimo de compra */}
                {settings?.minimumPurchase && settings.minimumPurchase > 0 && getTotalPrice() < settings.minimumPurchase && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-amber-800">
                          Mínimo de compra no alcanzado
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Faltan {formatPrice(settings.minimumPurchase - getTotalPrice())} para cumplir el mínimo de {formatPrice(settings.minimumPurchase)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewCart}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <ShoppingCart size={20} />
                  Ver carrito
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareToWhatsApp}
                  disabled={sharing}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {sharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Compartiendo...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={20} />
                      Solicitar pedido
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

