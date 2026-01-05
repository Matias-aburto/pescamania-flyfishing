'use client'

import { useState, useEffect } from 'react'
import { FilterOptions } from '@/types/product'
import { X } from 'lucide-react'

interface FilterBarProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'date-desc'
  onSortChange: (sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'date-desc') => void
}

export default function FilterBar({ filters, onFiltersChange, sortBy, onSortChange }: FilterBarProps) {
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [])

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category]
    updateFilter('category', newCategories)
  }

  const clearFilters = () => {
    onFiltersChange({
      category: [],
      search: filters.search, // Mantener la búsqueda
      tags: [],
    })
  }

  const hasActiveFilters = filters.category.length > 0

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 text-sm"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-2">
        {categories.map(cat => (
          <label
            key={cat}
            className={`flex items-center gap-3 p-2 rounded-lg border-2 cursor-pointer transition-colors ${
              filters.category.includes(cat)
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={filters.category.includes(cat)}
              onChange={() => toggleCategory(cat)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
            />
            <span className="text-sm text-gray-700">{cat}</span>
          </label>
        ))}
      </div>

      {/* Ordenar por */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordenar por</h3>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as typeof sortBy)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
        >
          <option value="date-desc">Más recientes</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Alfabéticamente (A-Z)</option>
        </select>
      </div>
    </div>
  )
}

