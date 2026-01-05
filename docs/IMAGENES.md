# Gestión de Imágenes de Productos

## Opciones Disponibles

### 1. Subir Imágenes Localmente (Recomendado)

Puedes subir imágenes directamente desde el panel de administración:

1. Ve a `/admin`
2. Crea o edita un producto
3. Haz clic en "Subir Imagen"
4. Selecciona una imagen (JPG, PNG o WEBP, máximo 5MB)
5. La imagen se guardará en `public/images/products/`
6. La URL se completará automáticamente

**Ventajas:**
- Control total sobre las imágenes
- No depende de servicios externos
- Funciona offline

**Desventajas:**
- Las imágenes ocupan espacio en el servidor
- Necesitas hacer backup de las imágenes

### 2. Usar URLs Externas

También puedes usar URLs de imágenes externas:

1. En el formulario de producto, ingresa la URL completa
2. Ejemplo: `https://ejemplo.com/imagen.jpg`
3. La imagen se cargará desde ese servidor

**Ventajas:**
- No ocupa espacio en tu servidor
- Puedes usar CDNs para mejor rendimiento

**Desventajas:**
- Dependes de que el servidor externo esté disponible
- Si la URL cambia, la imagen dejará de funcionar

### 3. Usar Servicios en la Nube (Futuro)

Para producción, puedes integrar servicios como:
- **Cloudinary**: Optimización automática de imágenes
- **AWS S3**: Almacenamiento escalable
- **Imgur**: Servicio gratuito de hosting de imágenes

## Estructura de Archivos

```
public/
  images/
    products/          # Imágenes subidas por usuarios
      [timestamp]-[nombre].jpg
    placeholder-fly.svg  # Placeholder por defecto
```

## Formatos Soportados

- JPEG/JPG
- PNG
- WEBP

## Límites

- Tamaño máximo: 5MB por imagen
- Formatos permitidos: JPG, PNG, WEBP

## Notas Importantes

1. **Backup**: Asegúrate de hacer backup de la carpeta `public/images/products/`
2. **Git**: Las imágenes subidas NO se incluyen en el repositorio por defecto
3. **Producción**: En producción, considera usar un servicio de almacenamiento en la nube
4. **Optimización**: Las imágenes grandes pueden afectar el rendimiento. Considera optimizarlas antes de subirlas

## Optimización de Imágenes

Antes de subir imágenes, puedes optimizarlas usando herramientas como:
- [TinyPNG](https://tinypng.com/) - Comprime imágenes sin perder calidad
- [Squoosh](https://squoosh.app/) - Herramienta de Google para optimizar imágenes
- [ImageOptim](https://imageoptim.com/) - Para Mac

## Troubleshooting

### La imagen no se muestra
1. Verifica que la URL sea correcta
2. Asegúrate de que el archivo existe en `public/images/products/`
3. Revisa la consola del navegador para errores

### Error al subir imagen
1. Verifica que el archivo sea menor a 5MB
2. Asegúrate de que el formato sea JPG, PNG o WEBP
3. Verifica los permisos de escritura en `public/images/products/`

