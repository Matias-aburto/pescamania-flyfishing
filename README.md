# Pescamania Fly - Catálogo de Moscas

Catálogo web moderno para exhibir patrones de moscas de fly fishing con funcionalidad de cotización vía WhatsApp.

## Características

- 🎣 Catálogo de moscas con diseño moderno
- 🔍 Sistema de filtros avanzado (categoría, dificultad, etiquetas, búsqueda)
- 📄 Paginación (12 productos por página)
- 🛒 Carrito de cotización
- 📱 Compartir carrito a WhatsApp
- 👨‍💼 Panel de administración para gestionar productos
- ✨ Animaciones suaves con Framer Motion
- 📱 Diseño responsive

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (gestión de estado)
- Lucide React (iconos)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Estructura del Proyecto

```
├── app/
│   ├── admin/          # Panel de administración
│   ├── api/            # API routes
│   ├── product/        # Página de detalle
│   └── page.tsx        # Página principal
├── components/         # Componentes reutilizables
├── lib/               # Utilidades
├── store/             # Estado global (Zustand)
├── types/             # Tipos TypeScript
└── data/              # Datos de productos (JSON)
```

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto (o configura las variables en Vercel para producción):

### Variables Requeridas

#### Supabase (Requerido para producción)
Configuración de Supabase para la base de datos. Obtén estas credenciales desde tu proyecto en [Supabase](https://supabase.com).

**Nuevas claves API (recomendado):**
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

**Claves legacy (también soportadas):**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (legacy)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (legacy)
```

**Dónde encontrar estas credenciales:**
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (nueva) o **anon/public key** (legacy) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** (nueva) o **service_role key** (legacy) → `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Mantén esta clave secreta)

**Nota:** Las nuevas claves API (`sb_publishable_...` y `sb_secret_...`) reemplazan a las claves legacy (`anon key` y `service_role key`). El código soporta ambas para compatibilidad, pero se recomienda usar las nuevas claves.

#### `NEXT_PUBLIC_FRONTEND_URL` (Requerido para producción)
URL del frontend para compartir carritos. **Es importante configurarlo en producción (Vercel)**.

**Ejemplo para Vercel:**
```
NEXT_PUBLIC_FRONTEND_URL=https://pescamania-flyfishing-a41ovijct-matias-projects-224d9654.vercel.app
```

**Si tienes dominio personalizado:**
```
NEXT_PUBLIC_FRONTEND_URL=https://tudominio.com
```

**En desarrollo local:** No es necesario, se usará automáticamente `http://localhost:3000`

### Variables Opcionales

#### `NEXT_PUBLIC_WHATSAPP_NUMBER`
Número de WhatsApp para compartir carritos. También se puede configurar desde el panel de administración.

```
NEXT_PUBLIC_WHATSAPP_NUMBER=5491123456789
```

Formato: código país + número sin espacios ni símbolos (ejemplo: 5491123456789 para Argentina)

### Configuración de Supabase

#### 1. Crear la tabla en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Crear tabla para carritos compartidos
CREATE TABLE IF NOT EXISTS shared_carts (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  delivery_type TEXT,
  comuna TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_shared_carts_created_at ON shared_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_carts_expires_at ON shared_carts(expires_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE shared_carts ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura pública (cualquiera puede ver los carritos compartidos)
CREATE POLICY "Allow public read access" ON shared_carts
  FOR SELECT
  USING (true);

-- Política: Solo el servicio puede insertar/actualizar/eliminar (usando service_role key)
-- Esta política se aplica automáticamente cuando usas service_role key
```

#### 2. Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY` si usas claves legacy)
   - `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY` si usas claves legacy) (⚠️ Marca como "Sensitive")
   - `NEXT_PUBLIC_FRONTEND_URL`
4. Haz un nuevo deploy para que los cambios surtan efecto

### Fallback sin Supabase

Si no configuras Supabase, el sistema usará:
1. Sistema de archivos (solo en desarrollo local)
2. Almacenamiento en memoria (temporal, se pierde al reiniciar)

**⚠️ Nota:** En producción (Vercel), el sistema de archivos es de solo lectura, por lo que **es necesario configurar Supabase** para que los carritos compartidos funcionen correctamente.

## Panel de Administración

Accede a `/admin` para gestionar productos:
- Crear nuevos productos
- Editar productos existentes
- Eliminar productos

## Producción

```bash
npm run build
npm start
```

