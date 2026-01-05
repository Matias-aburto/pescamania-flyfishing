'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, X, ArrowLeft, Settings, MessageCircle, Image as ImageIcon, Megaphone, Plus, Trash2, Palette, ShoppingBag, Package, LogOut } from 'lucide-react'
import Link from 'next/link'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { formatPrice } from '@/lib/formatPrice'

interface AppSettings {
  whatsappNumber: string
  logo: string
  primaryColor: string
  minimumPurchase: number
  pickupAddress?: string
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
    primaryColor: '#0284c7',
    minimumPurchase: 0,
    pickupAddress: '',
    announcementBar: {
      enabled: false,
      messages: [],
      position: 'top',
      backgroundColor: '#0ea5e9',
      textColor: '#ffffff',
      rotationInterval: 5,
    },
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data)
      setLogoPreview(data.logo || '')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        alert('Configuración guardada exitosamente')
        // Recargar la página para aplicar cambios
        window.location.reload()
      } else {
        alert('Error al guardar la configuración')
      }
    } catch (error) {
      alert('Error al guardar la configuración')
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

