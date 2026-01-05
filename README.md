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

## Configuración de WhatsApp

Para configurar el número de WhatsApp en el carrito, tienes dos opciones:

### Opción 1: Variable de entorno (recomendado)
Crea un archivo `.env.local` en la raíz del proyecto:
```
NEXT_PUBLIC_WHATSAPP_NUMBER=5491123456789
```
Formato: código país + número sin espacios ni símbolos (ejemplo: 5491123456789 para Argentina)

### Opción 2: Editar directamente
Edita el archivo `config/constants.ts` y cambia el valor por defecto:
```typescript
export const WHATSAPP_NUMBER = '5491123456789' // Tu número de WhatsApp
```

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

