/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Habilitar compresión gzip
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Asegurar que las rutas API no se cacheen incorrectamente
  async headers() {
    return [
      {
        source: '/api/admin/settings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Las rutas de productos ahora manejan su propio caché con revalidación
      // No necesitamos headers globales que sobrescriban la configuración de revalidación
    ]
  },
}

module.exports = nextConfig

