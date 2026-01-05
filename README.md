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

### Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `NEXT_PUBLIC_FRONTEND_URL` con tu URL de producción
4. Haz un nuevo deploy para que los cambios surtan efecto

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

