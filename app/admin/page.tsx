'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product, ProductVariant } from '@/types/product'
import { Plus, Edit, Trash2, X, Save, Upload, Image as ImageIcon, Settings } from 'lucide-react'
import { PLACEHOLDER_IMAGE, PRODUCT_CATEGORIES } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'
import Link from 'next/link'

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    tags: [],
    variants: [],
  })
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [variantImageUploading, setVariantImageUploading] = useState<string | null>(null)
  const variantFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...formData }),
        })
      } else {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      loadProducts()
      resetForm()
    } catch (error) {
      alert('Error al guardar producto')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      tags: product.tags,
      variants: product.variants || [],
    })
    setImagePreview(product.image || '')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    try {
      await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      loadProducts()
    } catch (error) {
      alert('Error al eliminar producto')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: '',
      category: '',
      tags: [],
      variants: [],
    })
    setImagePreview('')
    setEditingProduct(null)
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    variantFileInputRefs.current = {}
  }

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field: 'tags', value: string) => {
    if (!value.trim()) return
    const current = formData[field] || []
    if (!current.includes(value)) {
      updateFormField(field, [...current, value])
    }
  }

  const removeArrayItem = (field: 'tags', item: string) => {
    const current = formData[field] || []
    updateFormField(field, current.filter(i => i !== item))
  }

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      color: '#000000',
      image: '',
    }
    const currentVariants = formData.variants || []
    updateFormField('variants', [...currentVariants, newVariant])
  }

  const removeVariant = (variantId: string) => {
    const currentVariants = formData.variants || []
    updateFormField('variants', currentVariants.filter(v => v.id !== variantId))
  }

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    const currentVariants = formData.variants || []
    updateFormField('variants', currentVariants.map(v =>
      v.id === variantId ? { ...v, ...updates } : v
    ))
  }

  const handleVariantImageUpload = async (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB')
      return
    }

    setVariantImageUploading(variantId)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        updateVariant(variantId, { image: data.url })
      } else {
        alert(data.error || 'Error al subir la imagen')
      }
    } catch (error) {
      alert('Error al subir la imagen')
    } finally {
      setVariantImageUploading(null)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB')
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        updateFormField('image', data.url)
        setImagePreview(data.url)
      } else {
        alert(data.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error al subir imagen:', error)
      alert('Error al subir la imagen. Por favor intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    if (formData.image) {
      setImagePreview(formData.image)
    } else {
      setImagePreview('')
    }
  }, [formData.image])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Administración de Productos
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings size={20} />
            Configuración
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={20} />
            Nuevo Producto
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? 'Editar' : 'Nuevo'} Producto
                </h2>
                <button onClick={resetForm}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => updateFormField('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descripción <span className="text-gray-400 text-xs">(opcional)</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => updateFormField('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Descripción del producto..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={e => updateFormField('price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Categoría
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={e => updateFormField('category', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Selecciona una categoría</option>
                      {PRODUCT_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Imagen del Producto
                  </label>
                  
                  {/* Vista previa */}
                  {imagePreview ? (
                    <div className="mb-3 relative">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateFormField('image', '')
                          setImagePreview('')
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                        title="Eliminar imagen"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        No hay imagen seleccionada
                      </p>
                      <p className="text-xs text-gray-400">
                        Haz clic en &quot;Subir Imagen&quot; para seleccionar un archivo
                      </p>
                    </div>
                  )}

                  {/* Botón de subir */}
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                        </>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {imagePreview && (
                      <span className="text-xs text-gray-500 flex items-center">
                        Formatos: JPG, PNG, WEBP (máx. 5MB)
                      </span>
                    )}
                  </div>

                  {/* Campo de URL (alternativa) */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-xs text-gray-500 mb-1">
                      O ingresa una URL de imagen externa:
                    </label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={e => {
                        updateFormField('image', e.target.value)
                        setImagePreview(e.target.value)
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Variantes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Variantes <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      <Plus size={14} />
                      Añadir Variante
                    </button>
                  </div>
                  {formData.variants && formData.variants.length > 0 && (
                    <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                      {formData.variants.map((variant) => (
                        <div key={variant.id} className="bg-white p-3 rounded border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={e => updateVariant(variant.id, { name: e.target.value })}
                                placeholder="Ej: Rojo, Azul, etc."
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Color</label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={variant.color}
                                  onChange={e => updateVariant(variant.id, { color: e.target.value })}
                                  className="w-12 h-8 border rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={variant.color}
                                  onChange={e => updateVariant(variant.id, { color: e.target.value })}
                                  placeholder="#000000"
                                  className="flex-1 px-2 py-1 text-sm border rounded"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Precio (opcional)</label>
                              <input
                                type="number"
                                min="0"
                                value={variant.price || ''}
                                onChange={e => updateVariant(variant.id, { 
                                  price: e.target.value ? parseFloat(e.target.value) : undefined 
                                })}
                                placeholder="Dejar vacío para usar precio base"
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Imagen</label>
                              <div className="flex gap-2">
                                {variant.image && (
                                  <img
                                    src={variant.image}
                                    alt={variant.name}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => variantFileInputRefs.current[variant.id]?.click()}
                                  disabled={variantImageUploading === variant.id}
                                  className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                >
                                  {variantImageUploading === variant.id ? 'Subiendo...' : 'Subir'}
                                </button>
                                <input
                                  ref={el => { variantFileInputRefs.current[variant.id] = el; }}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  onChange={e => handleVariantImageUpload(variant.id, e)}
                                  className="hidden"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(variant.id)}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Eliminar variante
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Etiquetas
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          updateArrayField('tags', e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg"
                      placeholder="Presiona Enter para añadir"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeArrayItem('tags', tag)}
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="relative h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
              <img
                src={product.image || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                }}
              />
            </div>
            <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
            {product.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
            )}
            <p className="text-primary-600 font-bold mb-4">
              {formatPrice(product.price)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

