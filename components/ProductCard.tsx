'use client'

import { Product } from '@/types/product'
import { useCartStore } from '@/store/cartStore'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
// import Image from 'next/image'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
  }

  // Obtener imagen principal (primera variante si existe, sino la imagen del producto)
  const mainImage = product.variants && product.variants.length > 0
    ? product.variants[0].image
    : product.image

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col"
    >
          <Link href={`/product/${product.slug}`}>
        <div className="relative h-48 bg-gray-200 flex-shrink-0">
          <img
            src={mainImage || PLACEHOLDER_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
            }}
          />
          <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-semibold">
            {product.category}
          </div>
          {/* Swatches de colores si hay variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {product.variants.slice(0, 5).map((variant) => (
                <div
                  key={variant.id}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: variant.color }}
                  title={variant.name}
                />
              ))}
              {product.variants.length > 5 && (
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-md bg-gray-400 flex items-center justify-center text-xs text-white font-semibold">
                  +{product.variants.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-grow">
          <Link href={`/product/${product.slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mb-3 flex-grow">
          {product.description ? (
            <p className="text-gray-600 text-sm line-clamp-2 min-h-[2.5rem]">
              {product.description}
            </p>
          ) : (
            <div className="min-h-[2.5rem]"></div>
          )}
        </div>

        <div className="mb-3 flex-shrink-0">
          <span className="text-2xl font-bold text-primary-600">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            <Eye size={16} />
            Ver Detalle
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            <ShoppingCart size={16} />
            Añadir
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

