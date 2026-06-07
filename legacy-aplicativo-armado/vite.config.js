/* eslint-disable */
// vite.config.js (Versión LIMPIA y ESTABLE con Proxy de Supabase)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Leer VITE_SUPABASE_URL desde .env de forma manual y robusta
let supabaseUrl = 'https://ikdorsjntqnnxrpgvwrl.supabase.co'
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8')
  const match = envContent.match(/VITE_SUPABASE_URL=["']?([^"'\s]+)/)
  if (match) {
    supabaseUrl = match[1]
  }
} catch (e) {
  console.warn('No se pudo leer .env para el proxy de Supabase assets.')
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'supabase-assets-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          
          // Capturar peticiones a recursos de manuales
          // Nivel 3: /manualId/category/rest (ej: M00001/models/P00.glb)
          // Nivel 2: /manualId/filename (ej: M00001/garantia.pdf o M00001/herramientas.svg)
          const match = url.match(/^\/([^\/]+)\/(models|sounds|assets|ensambles|herrajes|renders|garantia)\/(.+)$/)
          const matchRootFile = !match ? url.match(/^\/([^\/]+)\/([^\/]+\.(?:pdf|svg|png|jpg|jpeg|webp|glb|mp3|ico))$/) : null
          
          if (match || matchRootFile) {
            const manualId = match ? match[1] : matchRootFile[1]
            const category = match ? match[2] : ''
            const rest = match ? match[3] : matchRootFile[2]
            
            // Si el archivo NO existe localmente en public/
            const localPath = category 
              ? path.join(__dirname, 'public', manualId, category, rest)
              : path.join(__dirname, 'public', manualId, rest)
              
            if (!fs.existsSync(localPath)) {
              // Proxy real del archivo desde Supabase Storage (intento directo con la ruta original)
              const directSupabaseUrl = category 
                ? `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/${category}/${rest}`
                : `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/${rest}`
              
              const fetchFromSupabase = (urlToFetch, isFallbackAttempt = false) => {
                fetch(urlToFetch)
                  .then(async (response) => {
                    // Si falla el primer intento (404) y es un audio de paso/ayuda en la raíz de sounds
                    if (!response.ok) {
                      if (!isFallbackAttempt && category === 'sounds') {
                        let fallbackRest = null
                        if (rest.match(/^\d+\.mp3$/)) {
                          const step = rest.split('.')[0]
                          fallbackRest = `es/${step}_es.mp3`
                        } else if (rest === '01_Ayuda.mp3') {
                          fallbackRest = `es/01_Ayuda_es.mp3`
                        }
                        
                        if (fallbackRest) {
                          const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/sounds/${fallbackRest}`
                          fetchFromSupabase(fallbackUrl, true)
                          return
                        }
                      }
                      res.statusCode = response.status
                      res.end(`Recurso no encontrado en Storage: ${response.statusText}`)
                      return
                    }
                    
                    // Propagar headers correctos
                    const contentType = response.headers.get('content-type')
                    if (contentType) res.setHeader('Content-Type', contentType)
                    
                    const contentLength = response.headers.get('content-length')
                    if (contentLength) res.setHeader('Content-Length', contentLength)
                    
                    // Enviar buffer binario del archivo
                    const arrayBuffer = await response.arrayBuffer()
                    res.end(Buffer.from(arrayBuffer))
                  })
                  .catch((err) => {
                    console.error('Error en proxy de assets:', err)
                    res.statusCode = 500
                    res.end('Error en proxy de assets')
                  })
              }
              
              fetchFromSupabase(directSupabaseUrl)
              return
            }
          }
          next()
        })
      }
    }
  ],
})