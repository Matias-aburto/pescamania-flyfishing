'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Product, ProductVariant } from '@/types/product'
import { useCartStore } from '@/store/cartStore'
import { ShoppingCart, ArrowLeft, Tag } from 'lucide-react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { getImageUrl } from '@/lib/imageCache'
import { formatPrice } from '@/lib/formatPrice'
// import Image from 'next/image'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined)
  const addItem = useCartStore(state => state.addItem)
  const openCart = useCartStore(state => state.openCart)

  useEffect(() => {
    if (params.slug) {
      fetch(`/api/products/slug/${params.slug}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data)
          // Seleccionar primera variante por defecto si existe
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0])
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [params.slug])

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity, selectedVariant)
      openCart()
    }
  }

  // Obtener imagen actual (variante seleccionada, primera variante, o imagen del producto)
  const baseImage = selectedVariant?.image || 
    (product?.variants && product.variants.length > 0 ? product.variants[0].image : null) ||
    product?.image
  
  // Agregar versión para evitar caché
  const currentImage = getImageUrl(baseImage, product?.updatedAt) || PLACEHOLDER_IMAGE

  // Obtener precio actual (variante seleccionada o producto)
  const currentPrice = selectedVariant?.price ?? product?.price ?? 0

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando producto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Producto no encontrado
          </h2>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ArrowLeft size={16} />
            Volver al catálogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={20} />
        Volver
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden"
        >
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
            }}
          />
        </motion.div>

        {/* Información */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                {product.category}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-gray-600 text-lg mb-4">
                {product.description}
              </p>
            )}
            <div className="text-4xl font-bold text-primary-600 mb-6">
              {formatPrice(currentPrice)}
            </div>
          </div>

          {/* Selector de variantes */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Variantes
              </h2>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <motion.button
                    key={variant.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedVariant(variant)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: variant.color }}
                        title={variant.name}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {variant.name}
                      </span>
                      {variant.price && variant.price !== product.price && (
                        <span className="text-xs text-primary-600 font-semibold">
                          {formatPrice(variant.price)}
                        </span>
                      )}
                    </div>
                    {selectedVariant?.id === variant.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad y botón */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-semibold text-lg"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-12 text-center text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-semibold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <ShoppingCart size={24} />
              Añadir a Cotización
            </motion.button>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(product.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

