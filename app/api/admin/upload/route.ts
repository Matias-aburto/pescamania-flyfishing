import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Verificar si Supabase está configurado
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (incluye favicon)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP, SVG o ICO' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 5MB para imágenes, 500KB para favicon)
    const isFavicon = file.type.includes('icon') || file.type.includes('x-icon')
    const maxSize = isFavicon ? 500 * 1024 : 5 * 1024 * 1024 // 500KB para favicon, 5MB para otras imágenes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Máximo ${isFavicon ? '500KB' : '5MB'}` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Prioridad 1: Supabase Storage (si está configurado)
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin()
        
        // Determinar el bucket según el tipo de archivo
        const bucketName = isFavicon ? 'favicons' : 'images'
        const folder = isFavicon ? 'favicons' : 'products'

        // Generar nombre único
        const timestamp = Date.now()
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}-${originalName}`
        const filePath = `${folder}/${filename}`

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (error) {
          // Si el bucket no existe, intentar crearlo
          if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
            // Crear el bucket si no existe (esto requiere permisos de admin)
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
              public: true,
              fileSizeLimit: maxSize,
              allowedMimeTypes: allowedTypes,
            })

            if (createError) {
              console.error('Error creating bucket:', createError)
              // Intentar subir de nuevo después de crear el bucket
              const { data: retryData, error: retryError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, buffer, {
                  contentType: file.type,
                  upsert: false,
                })

              if (retryError) {
                throw retryError
              }

              // Obtener URL pública
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

              return NextResponse.json({ url: urlData.publicUrl })
            } else {
              // Subir después de crear el bucket
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, buffer, {
                  contentType: file.type,
                  upsert: false,
                })

              if (uploadError) {
                throw uploadError
              }

              // Obtener URL pública
              const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath)

              return NextResponse.json({ url: urlData.publicUrl })
            }
          } else {
            throw error
          }
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        return NextResponse.json({ url: urlData.publicUrl })
      } catch (error) {
        console.error('Error uploading to Supabase Storage:', error)
        // Fallback a sistema de archivos solo en desarrollo
      }
    }

    // Fallback 2: Sistema de archivos (solo en desarrollo local)
    try {
      const uploadDir = join(process.cwd(), 'public', 'images', isFavicon ? 'favicons' : 'products')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generar nombre único
      const timestamp = Date.now()
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${originalName}`
      const filepath = join(uploadDir, filename)

      // Guardar archivo
      await writeFile(filepath, buffer)

      // Retornar URL relativa
      const imageUrl = `/images/${isFavicon ? 'favicons' : 'products'}/${filename}`

      return NextResponse.json({ url: imageUrl })
    } catch (error) {
      console.error('Error writing file:', error)
      throw new Error('No se pudo guardar el archivo. El sistema de archivos es de solo lectura en producción.')
    }
  } catch (error) {
    console.error('Error al subir archivo:', error)
    return NextResponse.json(
      { 
        error: 'Error al subir el archivo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

