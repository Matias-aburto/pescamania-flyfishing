import { listarCiudadesOrigen } from '../lib/starken'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function findCity(cityName: string) {
  try {
    console.log('Buscando ciudad:', cityName)
    console.log('Obteniendo ciudades de origen de Starken...\n')
    
    const ciudades = await listarCiudadesOrigen()
    
    if (ciudades.length === 0) {
      console.log('No se encontraron ciudades. Verifica las credenciales de Starken.')
      return
    }
    
    // Buscar ciudad por nombre (case insensitive, sin acentos)
    const normalizedSearch = cityName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    
    const matches = ciudades.filter(ciudad => {
      const normalizedName = ciudad.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)
    })
    
    if (matches.length === 0) {
      console.log(`No se encontró "${cityName}" en la lista de ciudades.\n`)
      console.log('Ciudades disponibles (primeras 20):')
      ciudades.slice(0, 20).forEach(ciudad => {
        console.log(`  - ${ciudad.name} (Código: ${ciudad.code})`)
      })
      return
    }
    
    console.log(`\n✅ Encontradas ${matches.length} coincidencia(s) para "${cityName}":\n`)
    matches.forEach(ciudad => {
      console.log(`  Ciudad: ${ciudad.name}`)
      console.log(`  Código: ${ciudad.code}`)
      console.log(`  Región: ${ciudad.regionCode}`)
      console.log('')
    })
    
    if (matches.length === 1) {
      console.log(`\n💡 Usa este código en los settings: ${matches[0].code}`)
    }
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.message.includes('autenticación')) {
      console.log('\n💡 Asegúrate de tener configuradas las variables de entorno:')
      console.log('   STARKEN_RUT=76211240')
      console.log('   STARKEN_KEY=key')
      console.log('\n   Los headers son:')
      console.log('   Rut: 76211240')
      console.log('   clave: key')
    }
  }
}

// Ejecutar
const cityName = process.argv[2] || 'Loncoche'
findCity(cityName)

