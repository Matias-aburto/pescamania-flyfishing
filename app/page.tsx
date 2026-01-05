'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import FilterBar from '@/components/FilterBar'
import Pagination from '@/components/Pagination'
import { Product, FilterOptions } from '@/types/product'
import { Search } from 'lucide-react'

const ITEMS_PER_PAGE = 12

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    search: '',
    tags: [],
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'date-desc'>('date-desc')

  // Cargar filtros desde URL al montar
  useEffect(() => {
    const categoryParam = searchParams.get('categoria')
    const searchParam = searchParams.get('buscar') || ''
    const pageParam = searchParams.get('pagina')

    const categories = categoryParam ? categoryParam.split(',') : []
    
    setFilters({
      category: categories,
      search: searchParam,
      tags: [],
    })

    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1)
    } else {
      setCurrentPage(1)
    }
    
    setIsInitialLoad(false)
  }, []) // Solo ejecutar una vez al montar

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setFilteredProducts(data)
      })
  }, [])

  // Actualizar URL cuando cambian los filtros (solo después de la carga inicial)
  useEffect(() => {
    if (isInitialLoad) return

    const params = new URLSearchParams()
    
    if (filters.category.length > 0) {
      params.set('categoria', filters.category.join(','))
    }
    
    if (filters.search) {
      params.set('buscar', filters.search)
    }
    
    if (currentPage > 1) {
      params.set('pagina', currentPage.toString())
    }

    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    
    router.replace(newUrl, { scroll: false })
  }, [filters, currentPage, router, isInitialLoad])

  useEffect(() => {
    let filtered = [...products]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower)) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filters.category.length > 0) {
      filtered = filtered.filter(p => filters.category.includes(p.category))
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      )
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name-asc':
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
  }, [filters, products, sortBy])

  // Resetear página cuando cambian los filtros o el ordenamiento (pero no cuando solo cambia la página)
  useEffect(() => {
    if (!isInitialLoad) {
      setCurrentPage(1)
    }
  }, [filters.category.join(','), filters.search, sortBy]) // Cuando cambian filtros o ordenamiento

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Catálogo de Moscas
        </h1>
        <p className="text-gray-600">
          Descubre nuestra colección de patrones de moscas para fly fishing
        </p>
      </motion.div>

      {/* Buscador grande arriba */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          <input
            type="text"
            placeholder="Buscar moscas..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de filtros */}
        <aside className="lg:w-64 flex-shrink-0">
          <FilterBar 
            filters={filters} 
            onFiltersChange={setFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </aside>

        {/* Contenido principal */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 text-lg">
                No se encontraron productos con los filtros seleccionados
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-sm text-gray-600"
              >
                Mostrando {paginatedProducts.length} de {filteredProducts.length}{' '}
                productos
              </motion.div>

              <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 mb-8">
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Cargando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

