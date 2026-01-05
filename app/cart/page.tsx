'use client'

import { useCartStore } from '@/store/cartStore'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ArrowLeft, Share2, MessageCircle, Copy, Check, Package, Truck, Search, AlertCircle, MapPin } from 'lucide-react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { chileComunas } from '@/lib/chileComunas'

interface AppSettings {
  whatsappNumber: string
  logo: string
  minimumPurchase?: number
  pickupAddress?: string
}

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getItemId,
    deliveryType,
    comuna,
    customerName,
    setDeliveryType,
    setComuna,
    setCustomerName,
  } = useCartStore()
  const [whatsappNumber, setWhatsappNumber] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [comunaSearch, setComunaSearch] = useState<string>('')
  const [showComunaDropdown, setShowComunaDropdown] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [nameInput, setNameInput] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Sincronizar nameInput con customerName del store
    setNameInput(customerName || '')
  }, [customerName])

  useEffect(() => {
    // Cargar configuración
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: AppSettings) => {
        setSettings(data)
        if (data.whatsappNumber) {
          setWhatsappNumber(data.whatsappNumber)
        }
      })
      .catch(() => {})
  }, [])

  const handleShareCart = async () => {
    if (items.length === 0) {
      alert('El carrito está vacío')
      return
    }

    setSharing(true)
    try {
      const response = await fetch('/api/cart/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items,
          deliveryType,
          comuna: deliveryType === 'envio' ? comuna : undefined,
          customerName: customerName || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSharedUrl(data.url)
      } else {
        alert(data.error || 'Error al compartir el carrito')
      }
    } catch (error) {
      alert('Error al compartir el carrito')
    } finally {
      setSharing(false)
    }
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
        body: JSON.stringify({ 
          items,
          deliveryType,
          comuna: deliveryType === 'envio' ? comuna : undefined,
          customerName: customerName || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const sharedUrl = data.url
        setSharedUrl(sharedUrl)
        
        // Enviar el link por WhatsApp
        const message = encodeURIComponent(`Hola! Me interesa solicitar este pedido:\n\n${sharedUrl}\n\nGracias!`)
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`
        window.open(whatsappUrl, '_blank')
      } else {
        alert(data.error || 'Error al compartir el carrito')
      }
    } catch (error) {
      alert('Error al compartir el carrito')
    } finally {
      setSharing(false)
    }
  }

  const handleCopySharedLink = () => {
    if (sharedUrl) {
      navigator.clipboard.writeText(sharedUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  // Filtrar comunas según búsqueda
  const filteredComunas = comunaSearch
    ? chileComunas.filter(comuna => 
        comuna.toLowerCase().includes(comunaSearch.toLowerCase())
      )
    : chileComunas

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.comuna-dropdown-container')) {
        setShowComunaDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          Volver al catálogo
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          Carrito de Cotización
        </h1>
      </motion.div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white rounded-lg shadow-md"
        >
          <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Ver catálogo
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const itemId = getItemId(item.product, item.variant)
              const itemImage = item.variant?.image || item.product.image
              const itemPrice = item.variant?.price ?? item.product.price
              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                          className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: item.variant.color }}
                          title={item.variant.name}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {item.product.name}
                        {item.variant && (
                          <span className="text-sm text-gray-500 ml-2 font-normal">
                            - {item.variant.name}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {formatPrice(itemPrice)} c/u
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(itemId, item.quantity - 1)
                            }
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(itemId, item.quantity + 1)
                            }
                            className="p-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="text-lg font-bold text-primary-600 ml-auto">
                          {formatPrice(itemPrice * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(itemId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Botón Limpiar carrito */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4"
              >
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de limpiar el carrito?')) {
                      clearCart()
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Limpiar carrito
                </button>
              </motion.div>
            )}
          </div>

          {/* Resumen y acciones */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resumen
              </h2>
              
              {/* Campo de nombre del cliente */}
              {mounted && (
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value)
                      setCustomerName(e.target.value)
                    }}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {/* Tipo de Despacho */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Despacho <span className="text-gray-700 font-normal">(opcional)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeliveryType(deliveryType === 'retiro' ? null : 'retiro')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 relative ${
                      deliveryType === 'retiro'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Package 
                      size={24} 
                      className={deliveryType === 'retiro' ? 'text-primary-600' : 'text-gray-500'} 
                    />
                    <span className={`text-sm font-medium ${
                      deliveryType === 'retiro' ? 'text-primary-600' : 'text-gray-700'
                    }`}>
                      Retiro
                    </span>
                    {/* Dirección de retiro dentro del mismo botón */}
                    {settings?.pickupAddress && (
                      <div className="mt-1 w-full">
                        <p className="text-xs text-gray-600 mb-1 text-center px-1">
                          {settings.pickupAddress}
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.pickupAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors font-semibold"
                        >
                          <MapPin size={12} />
                          Ver dirección
                        </a>
                      </div>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeliveryType(deliveryType === 'envio' ? null : 'envio')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                      deliveryType === 'envio'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck 
                      size={24} 
                      className={deliveryType === 'envio' ? 'text-primary-600' : 'text-gray-500'} 
                    />
                    <span className={`text-sm font-medium ${
                      deliveryType === 'envio' ? 'text-primary-600' : 'text-gray-700'
                    }`}>
                      Envío
                    </span>
                  </motion.button>
                </div>

                {/* Selector de comuna si es envío */}
                {deliveryType === 'envio' && (
                  <div className="relative comuna-dropdown-container">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Comuna
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={comunaSearch || comuna}
                        onChange={(e) => {
                          setComunaSearch(e.target.value)
                          setShowComunaDropdown(true)
                        }}
                        onFocus={() => setShowComunaDropdown(true)}
                        placeholder="Buscar comuna..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Search 
                        size={18} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                      />
                      {showComunaDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredComunas.slice(0, 20).map((comunaOption) => (
                            <button
                              key={comunaOption}
                              onClick={() => {
                                setComuna(comunaOption)
                                setComunaSearch(comunaOption)
                                setShowComunaDropdown(false)
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                            >
                              {comunaOption}
                            </button>
                          ))}
                          {filteredComunas.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No se encontraron comunas
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje de mínimo de compra */}
              {settings?.minimumPurchase && settings.minimumPurchase > 0 && getTotalPrice() < settings.minimumPurchase && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Mínimo de compra no alcanzado
                      </p>
                      <p className="text-sm text-amber-700">
                        Faltan <span className="font-semibold">{formatPrice(settings.minimumPurchase - getTotalPrice())}</span> para cumplir el mínimo de compra de <span className="font-semibold">{formatPrice(settings.minimumPurchase)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-2xl font-bold mb-6 pb-4 border-b border-gray-200">
                <span>Total:</span>
                <span className="text-primary-600">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>

              {/* Link compartido */}
              {sharedUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4"
                >
                  <p className="text-xs text-green-700 mb-2 font-medium">
                    Carrito compartido:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sharedUrl}
                      readOnly
                      className="flex-1 px-2 py-1 text-xs bg-white border border-green-300 rounded text-green-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopySharedLink}
                      className="p-1 text-green-700 hover:bg-green-100 rounded"
                      title="Copiar link"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShareCart}
                  disabled={sharing}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  {sharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                      Compartiendo...
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      Compartir carrito
                    </>
                  )}
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
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

