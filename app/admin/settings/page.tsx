'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, X, ArrowLeft, Settings, MessageCircle, Image as ImageIcon, Megaphone, Plus, Trash2, Palette, ShoppingBag, Package, LogOut, Menu, GripVertical, Edit2, Search, Truck } from 'lucide-react'
import Link from 'next/link'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'

interface MenuItem {
  id: string
  label: string
  url: string
}

interface AppSettings {
  whatsappNumber: string
  logo: string
  favicon?: string
  primaryColor: string
  minimumPurchase: number
  pickupAddress?: string
  starkenCiudadOrigen?: number
  starkenDefaultAlto?: number
  starkenDefaultAncho?: number
  starkenDefaultLargo?: number
  starkenDefaultKilos?: number
  starkenPorcentajeAdicional?: number
  menuItems?: MenuItem[]
  announcementBar: {
    enabled: boolean
    messages: string[]
    position: 'top' | 'bottom'
    backgroundColor?: string
    textColor?: string
    rotationInterval?: number
  }
}

import AdminGuard from '@/components/AdminGuard'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { ShippingCity } from '@/types/shipping'

function SettingsPageContent() {
  const router = useRouter()
  
  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const [settings, setSettings] = useState<AppSettings>({
    whatsappNumber: '',
    logo: '',
    favicon: '',
    primaryColor: '#0284c7',
    minimumPurchase: 0,
    pickupAddress: '',
    starkenCiudadOrigen: undefined,
    starkenDefaultAlto: 10,
    starkenDefaultAncho: 10,
    starkenDefaultLargo: 10,
    starkenDefaultKilos: 0.1,
    starkenPorcentajeAdicional: 0,
    menuItems: [],
    announcementBar: {
      enabled: false,
      messages: [],
      position: 'top',
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      rotationInterval: 5,
    },
  })
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [newMenuItem, setNewMenuItem] = useState({ label: '', url: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [faviconPreview, setFaviconPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para el selector de ciudad de origen Starken
  const [ciudadesOrigen, setCiudadesOrigen] = useState<ShippingCity[]>([])
  const [busquedaCiudadOrigen, setBusquedaCiudadOrigen] = useState<string>('')
  const [mostrarDropdownCiudadOrigen, setMostrarDropdownCiudadOrigen] = useState(false)
  const ciudadOrigenDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSettings()
    loadCiudadesOrigen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Sincronizar nombre de ciudad cuando se cargan los settings o las ciudades
  useEffect(() => {
    if (settings.starkenCiudadOrigen && ciudadesOrigen.length > 0) {
      const ciudadSeleccionada = ciudadesOrigen.find(c => c.code === settings.starkenCiudadOrigen)
      if (ciudadSeleccionada && busquedaCiudadOrigen !== ciudadSeleccionada.name) {
        setBusquedaCiudadOrigen(ciudadSeleccionada.name)
      }
    }
  }, [settings.starkenCiudadOrigen, ciudadesOrigen])
  
  // Cargar ciudades de origen de Starken
  const loadCiudadesOrigen = async () => {
    try {
      const res = await fetch('/api/shipping/cities/origin')
      if (res.ok) {
        const ciudades: ShippingCity[] = await res.json()
        setCiudadesOrigen(ciudades)
      }
    } catch (error) {
      console.error('Error al cargar ciudades de origen:', error)
    }
  }
  
  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ciudadOrigenDropdownRef.current && !ciudadOrigenDropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdownCiudadOrigen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data)
      setLogoPreview(data.logo || '')
      setFaviconPreview(data.favicon || '')
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(settings),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Actualizar window.__APP_SETTINGS__ inmediatamente
        ;(window as any).__APP_SETTINGS__ = data
        
        // Disparar evento para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent('settingsUpdated'))
        
        alert('Configuración guardada exitosamente')
        
        // Recargar solo la página de admin, no todas las páginas
        // Esto permite que otras pestañas/páginas se actualicen automáticamente
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        console.error('Error response:', data)
        alert(data.error || 'Error al guardar la configuración')
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      alert('Error al guardar la configuración. Por favor, intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 2MB')
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
        setSettings(prev => ({ ...prev, logo: data.url }))
        setLogoPreview(data.url)
      } else {
        alert(data.error || 'Error al subir el logo')
      }
    } catch (error) {
      alert('Error al subir el logo')
    } finally {
      setUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen')
      return
    }

    // Favicon debe ser pequeño, máximo 500KB
    if (file.size > 500 * 1024) {
      alert('El favicon es demasiado grande. Máximo 500KB. Recomendado: formato ICO o PNG 32x32px')
      return
    }

    setUploadingFavicon(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        setSettings(prev => ({ ...prev, favicon: data.url }))
        setFaviconPreview(data.url)
      } else {
        alert(data.error || 'Error al subir el favicon')
      }
    } catch (error) {
      alert('Error al subir el favicon')
    } finally {
      setUploadingFavicon(false)
    }
  }

  const handleAddMenuItem = () => {
    if (!newMenuItem.label.trim() || !newMenuItem.url.trim()) {
      alert('Por favor completa el nombre y la URL del item')
      return
    }

    const menuItems = settings.menuItems || []
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: newMenuItem.label.trim(),
      url: newMenuItem.url.trim(),
    }

    setSettings(prev => ({
      ...prev,
      menuItems: [...menuItems, newItem],
    }))

    setNewMenuItem({ label: '', url: '' })
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item)
    setNewMenuItem({ label: item.label, url: item.url })
  }

  const handleSaveMenuItem = () => {
    if (!editingMenuItem || !newMenuItem.label.trim() || !newMenuItem.url.trim()) {
      return
    }

    const menuItems = settings.menuItems || []
    setSettings(prev => ({
      ...prev,
      menuItems: menuItems.map(item =>
        item.id === editingMenuItem.id
          ? { ...item, label: newMenuItem.label.trim(), url: newMenuItem.url.trim() }
          : item
      ),
    }))

    setEditingMenuItem(null)
    setNewMenuItem({ label: '', url: '' })
  }

  const handleDeleteMenuItem = (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item del menú?')) {
      return
    }

    const menuItems = settings.menuItems || []
    setSettings(prev => ({
      ...prev,
      menuItems: menuItems.filter(item => item.id !== id),
    }))
  }

  const handleMoveMenuItem = (index: number, direction: 'up' | 'down') => {
    const menuItems = settings.menuItems || []
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === menuItems.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newItems = [...menuItems]
    ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]

    setSettings(prev => ({
      ...prev,
      menuItems: newItems,
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a Administración
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <LogOut size={20} />
          Cerrar sesión
        </motion.button>
      </div>

      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Settings size={32} className="text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración
            </h1>
          </div>
          <p className="text-gray-600">
            Configura los ajustes generales de tu tienda
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configuración de WhatsApp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Número de WhatsApp
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Número que se usará para compartir las cotizaciones del carrito.
              Formato: código país + número sin espacios ni símbolos.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de WhatsApp
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={e =>
                  setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))
                }
                placeholder="Ej: 5491123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ejemplo para Chile: 56912345678
              </p>
            </div>
          </motion.div>

          {/* Configuración de Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Logo de la Tienda
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Logo que se mostrará en el navbar. Recomendado: formato PNG con
              fondo transparente, máximo 2MB.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>

              {/* Vista previa */}
              {logoPreview ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="max-h-32 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(prev => ({ ...prev, logo: '' }))
                        setLogoPreview('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      title="Eliminar logo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    No hay logo seleccionado
                  </p>
                </div>
              )}

              {/* Botón de subir */}
              <div className="flex gap-2">
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
                      {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>

          {/* Configuración de Favicon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Favicon del Sitio
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Icono que se muestra en la pestaña del navegador. Recomendado: formato ICO o PNG 32x32px, máximo 500KB.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favicon
              </label>

              {/* Vista previa */}
              {faviconPreview ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img
                      src={faviconPreview}
                      alt="Favicon"
                      className="w-16 h-16 object-contain border border-gray-200 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSettings(prev => ({ ...prev, favicon: '' }))
                        setFaviconPreview('')
                        if (faviconInputRef.current) {
                          faviconInputRef.current.value = ''
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                      title="Eliminar favicon"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    No hay favicon seleccionado
                  </p>
                </div>
              )}

              {/* Botón de subir */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploadingFavicon}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingFavicon ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {faviconPreview ? 'Cambiar Favicon' : 'Subir Favicon'}
                    </>
                  )}
                </button>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/x-icon,image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleFaviconUpload}
                  className="hidden"
                />
              </div>
            </div>
          </motion.div>

          {/* Configuración del Menú Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Menu size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Menú Principal
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Administra los items del menú principal del sitio. Estos aparecerán en el navbar.
            </p>

            {/* Lista de items del menú */}
            <div className="space-y-2 mb-4">
              {(settings.menuItems || []).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical className="text-gray-400" size={20} />
                    <div className="flex-1">
                      {editingMenuItem?.id === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newMenuItem.label}
                            onChange={e => setNewMenuItem(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="Nombre del item"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            value={newMenuItem.url}
                            onChange={e => setNewMenuItem(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="/ruta"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={handleSaveMenuItem}
                            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMenuItem(null)
                              setNewMenuItem({ label: '', url: '' })
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{item.label}</span>
                          <span className="text-sm text-gray-500">{item.url}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {editingMenuItem?.id !== item.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveMenuItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover arriba"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMenuItem(index, 'down')}
                        disabled={index === (settings.menuItems || []).length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditMenuItem(item)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMenuItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(!settings.menuItems || settings.menuItems.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay items en el menú. Agrega uno usando el formulario de abajo.
                </p>
              )}
            </div>

            {/* Formulario para agregar nuevo item */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {editingMenuItem ? 'Editando item' : 'Agregar nuevo item'}
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMenuItem.label}
                  onChange={e => setNewMenuItem(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Nombre del item (ej: Catálogo)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={newMenuItem.url}
                  onChange={e => setNewMenuItem(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL (ej: / o /productos)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {editingMenuItem ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMenuItem(null)
                      setNewMenuItem({ label: '', url: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddMenuItem}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Configuración de Color Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Palette size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Color Principal
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Color principal que se usará en botones, enlaces y elementos destacados de la tienda.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Principal
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primaryColor || '#0284c7'}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value,
                    }))
                  }
                  className="w-16 h-12 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor || '#0284c7'}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value,
                    }))
                  }
                  placeholder="#0284c7"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Este color se aplicará a botones, enlaces y elementos destacados
              </p>
              {/* Vista previa */}
              <div className="mt-4 p-3 rounded border border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: settings.primaryColor || '#0284c7' }}
                  >
                    Botón de ejemplo
                  </button>
                  <a
                    href="#"
                    className="px-4 py-2 rounded-lg font-semibold"
                    style={{ 
                      color: settings.primaryColor || '#0284c7',
                      border: `2px solid ${settings.primaryColor || '#0284c7'}`,
                    }}
                  >
                    Enlace de ejemplo
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Configuración de Mínimo de Compra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Mínimo de Compra
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Establece un monto mínimo de compra. Los usuarios verán un mensaje si su carrito no alcanza el mínimo. Deja en 0 para no tener mínimo.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mínimo (CLP)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={settings.minimumPurchase || 0}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    minimumPurchase: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                {settings.minimumPurchase > 0 
                  ? `Mínimo de compra: ${formatPrice(settings.minimumPurchase)}`
                  : 'Sin mínimo de compra configurado'}
              </p>
            </div>
          </motion.div>

          {/* Configuración de Dirección de Retiro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Package size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Dirección de Retiro
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configura la dirección donde los clientes pueden retirar sus pedidos. Esta dirección se mostrará en el carrito cuando seleccionen &quot;Retiro&quot;.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Retiro
              </label>
              <input
                type="text"
                value={settings.pickupAddress || ''}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    pickupAddress: e.target.value,
                  }))
                }
                placeholder="Ej: Av. Principal 123, Local 5, Santiago"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                Deja vacío si no quieres mostrar una dirección de retiro.
              </p>
            </div>
          </motion.div>

          {/* Configuración de Ciudad de Origen Starken */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Truck className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">
                Configuración de Envíos Starken
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad de Origen (Starken)
                </label>
                <div className="relative" ref={ciudadOrigenDropdownRef}>
                  <input
                    type="text"
                    value={busquedaCiudadOrigen}
                    onChange={(e) => {
                      setBusquedaCiudadOrigen(e.target.value)
                      setMostrarDropdownCiudadOrigen(true)
                      // Si se borra el texto, limpiar la selección
                      if (!e.target.value) {
                        setSettings(prev => ({
                          ...prev,
                          starkenCiudadOrigen: undefined,
                        }))
                      }
                    }}
                    onFocus={() => setMostrarDropdownCiudadOrigen(true)}
                    placeholder="Buscar ciudad de origen..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search 
                    size={18} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                  />
                  {mostrarDropdownCiudadOrigen && ciudadesOrigen.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {ciudadesOrigen
                        .filter(ciudad => 
                          ciudad.name.toLowerCase().includes(busquedaCiudadOrigen.toLowerCase())
                        )
                        .slice(0, 20)
                        .map((ciudad) => (
                          <button
                            key={ciudad.code}
                            type="button"
                            onClick={() => {
                              setSettings(prev => ({
                                ...prev,
                                starkenCiudadOrigen: ciudad.code,
                              }))
                              setBusquedaCiudadOrigen(ciudad.name)
                              setMostrarDropdownCiudadOrigen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
                              settings.starkenCiudadOrigen === ciudad.code
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-900'
                            }`}
                          >
                            {ciudad.name} <span className="text-gray-500 text-xs">({ciudad.code})</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {mostrarDropdownCiudadOrigen && ciudadesOrigen.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Cargando ciudades...
                      </div>
                    </div>
                  )}
                  {mostrarDropdownCiudadOrigen && 
                   ciudadesOrigen.length > 0 && 
                   busquedaCiudadOrigen && 
                   ciudadesOrigen.filter(ciudad => 
                     ciudad.name.toLowerCase().includes(busquedaCiudadOrigen.toLowerCase())
                   ).length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No se encontraron ciudades
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selecciona la ciudad de origen para calcular tarifas de envío con Starken.
                  {settings.starkenCiudadOrigen && (
                    <span className="block mt-1 text-primary-600 font-medium">
                      Ciudad seleccionada: Código {settings.starkenCiudadOrigen}
                    </span>
                  )}
                </p>
              </div>
              
              {/* Dimensiones por defecto */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Dimensiones por Defecto
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Estos valores se usarán cuando los productos no tengan dimensiones o peso especificados.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Alto (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.starkenDefaultAlto || 10}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          starkenDefaultAlto: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Ancho (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.starkenDefaultAncho || 10}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          starkenDefaultAncho: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Largo (cm)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.starkenDefaultLargo || 10}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          starkenDefaultLargo: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={settings.starkenDefaultKilos || 0.1}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          starkenDefaultKilos: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Valores actuales: {settings.starkenDefaultAlto || 10}cm × {settings.starkenDefaultAncho || 10}cm × {settings.starkenDefaultLargo || 10}cm, {settings.starkenDefaultKilos || 0.1}kg por producto
                </p>
              </div>
              
              {/* Porcentaje adicional */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Ajuste de Costo de Envío
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Aplica un porcentaje adicional (o negativo) al costo de envío estimado. Este ajuste se reflejará directamente en el precio mostrado al usuario.
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Porcentaje Adicional (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.starkenPorcentajeAdicional || 0}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        starkenPorcentajeAdicional: e.target.value ? parseFloat(e.target.value) : 0,
                      }))
                    }
                    placeholder="Ej: 10 para agregar 10%, -5 para reducir 5%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {settings.starkenPorcentajeAdicional && settings.starkenPorcentajeAdicional !== 0 ? (
                      <span>
                        {settings.starkenPorcentajeAdicional > 0 ? 'Se agregará' : 'Se reducirá'} un {Math.abs(settings.starkenPorcentajeAdicional)}% al costo de envío estimado.
                      </span>
                    ) : (
                      <span>Sin ajuste aplicado (0%)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Configuración de Barra de Anuncios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Megaphone size={24} className="text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Barra de Anuncios
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configura una barra de anuncios que aparecerá en la parte superior o inferior de la página.
              Útil para promociones, envíos gratis, etc.
            </p>

            <div className="space-y-4">
              {/* Activar/Desactivar */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="announcementEnabled"
                  checked={settings.announcementBar.enabled}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      announcementBar: {
                        ...prev.announcementBar,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="announcementEnabled" className="text-sm font-medium text-gray-700">
                  Activar barra de anuncios
                </label>
              </div>

              {settings.announcementBar.enabled && (
                <div className="space-y-4 pl-8 border-l-2 border-primary-200">
                  {/* Mensajes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensajes (se rotarán automáticamente)
                    </label>
                    <div className="space-y-2">
                      {settings.announcementBar.messages.map((message, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={message}
                            onChange={e => {
                              const newMessages = [...settings.announcementBar.messages]
                              newMessages[index] = e.target.value
                              setSettings(prev => ({
                                ...prev,
                                announcementBar: {
                                  ...prev.announcementBar,
                                  messages: newMessages,
                                },
                              }))
                            }}
                            placeholder={`Mensaje ${index + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newMessages = settings.announcementBar.messages.filter((_, i) => i !== index)
                              setSettings(prev => ({
                                ...prev,
                                announcementBar: {
                                  ...prev.announcementBar,
                                  messages: newMessages,
                                },
                              }))
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar mensaje"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            announcementBar: {
                              ...prev.announcementBar,
                              messages: [...prev.announcementBar.messages, ''],
                            },
                          }))
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        <Plus size={16} />
                        Agregar mensaje
                      </button>
                    </div>
                    {settings.announcementBar.messages.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Agrega al menos un mensaje para mostrar en la barra
                      </p>
                    )}
                  </div>

                  {/* Intervalo de rotación */}
                  {settings.announcementBar.messages.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo entre mensajes (segundos)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={settings.announcementBar.rotationInterval || 5}
                        onChange={e =>
                          setSettings(prev => ({
                            ...prev,
                            announcementBar: {
                              ...prev.announcementBar,
                              rotationInterval: parseInt(e.target.value) || 5,
                            },
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tiempo que cada mensaje se mostrará antes de cambiar al siguiente
                      </p>
                    </div>
                  )}

                  {/* Posición */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posición
                    </label>
                    <select
                      value={settings.announcementBar.position}
                      onChange={e =>
                        setSettings(prev => ({
                          ...prev,
                          announcementBar: {
                            ...prev.announcementBar,
                            position: e.target.value as 'top' | 'bottom',
                          },
                        }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="top">Arriba (sobre el navbar)</option>
                      <option value="bottom">Abajo (al final de la página)</option>
                    </select>
                  </div>

                  {/* Colores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color de Fondo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.announcementBar.backgroundColor || '#0ea5e9'}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              announcementBar: {
                                ...prev.announcementBar,
                                backgroundColor: e.target.value,
                              },
                            }))
                          }
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.announcementBar.backgroundColor || '#0ea5e9'}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              announcementBar: {
                                ...prev.announcementBar,
                                backgroundColor: e.target.value,
                              },
                            }))
                          }
                          placeholder="#0ea5e9"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color de Texto
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.announcementBar.textColor || '#ffffff'}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              announcementBar: {
                                ...prev.announcementBar,
                                textColor: e.target.value,
                              },
                            }))
                          }
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.announcementBar.textColor || '#ffffff'}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              announcementBar: {
                                ...prev.announcementBar,
                                textColor: e.target.value,
                              },
                            }))
                          }
                          placeholder="#ffffff"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vista previa */}
                  {settings.announcementBar.messages.length > 0 && (
                    <div className="mt-4 p-3 rounded border border-gray-200 bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">
                        Vista previa {settings.announcementBar.messages.length > 1 ? `(${settings.announcementBar.messages.length} mensajes, se rotarán cada ${settings.announcementBar.rotationInterval || 5}s)` : ''}:
                      </p>
                      <div
                        className="px-4 py-2 rounded text-sm font-medium"
                        style={{
                          backgroundColor: settings.announcementBar.backgroundColor || '#0ea5e9',
                          color: settings.announcementBar.textColor || '#ffffff',
                        }}
                      >
                        {settings.announcementBar.messages[0] || 'Mensaje de ejemplo'}
                      </div>
                      {settings.announcementBar.messages.length > 1 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Los mensajes cambiarán automáticamente con animación fade
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              Cancelar
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Configuración
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AdminGuard>
      <SettingsPageContent />
    </AdminGuard>
  )
}

