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
let supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co'
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
  base: '/',
  plugins: [
    react(),
    {
      name: 'supabase-assets-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          
          // Endpoint para guardar calibración en local
          if (req.method === 'POST' && url === '/api/save-calibration') {
            let body = ''
            req.on('data', chunk => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                fs.writeFileSync(path.join(__dirname, 'calibration.json'), JSON.stringify(data, null, 2), 'utf-8')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'Calibración guardada en local' }))
              } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, error: e.message }))
              }
            })
            return
          }

          // Endpoint para cargar calibración en local
          if (req.method === 'GET' && url === '/api/load-calibration') {
            try {
              const filePath = path.join(__dirname, 'calibration.json')
              if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(data)
              } else {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, message: 'No calibration file found' }))
              }
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: false, error: e.message }))
            }
            return
          }
          
          // Regla especial para herrajes compartidos en Supabase
          if (url.startsWith('/assets/herrajes_compartidos/')) {
            const fileName = url.replace('/assets/herrajes_compartidos/', '')
            const sharedUrl = `${supabaseUrl}/storage/v1/object/public/insumos_manuales/_herrajes_compartidos/${fileName}`
            
            const fetchShared = async () => {
              try {
                const response = await fetch(sharedUrl)
                if (response.ok) {
                  const contentType = response.headers.get('content-type')
                  const buffer = Buffer.from(await response.arrayBuffer())
                  res.setHeader('Content-Type', contentType || 'image/jpeg')
                  res.setHeader('Content-Length', buffer.length)
                  return res.end(buffer)
                }
              } catch (e) {}
              res.statusCode = 204
              return res.end()
            }
            fetchShared()
            return
          }
          
          // ═══════════════════════════════════════════════════════════════
          // EXCLUSIÓN: Las rutas /assets/ son archivos locales estáticos.
          // NO deben pasar por el proxy de Supabase.
          // ═══════════════════════════════════════════════════════════════
          if (url.startsWith('/assets/') || url.startsWith('/Matcaps/') || url.startsWith('/textures/') || url.startsWith('/hdri')) {
            return next()
          }

          // ═══════════════════════════════════════════════════════════════
          // Regex 1 (Nivel 3): /manualId/category/rest
          // Ejemplo: /M00001/models/P00.glb, /M00001/sounds/01.mp3
          // ═══════════════════════════════════════════════════════════════
          const match = url.match(/^\/([^\/]+)\/(models|sounds|ensambles|herrajes|renders|garantia)\/(.+)$/)
          const matchRootFile = !match ? url.match(/^\/([^\/]+)\/([^\/]+\.(?:pdf|svg|png|jpg|jpeg|webp|glb|mp3|ico))$/) : null
          
          // ═══════════════════════════════════════════════════════════════
          // Regex 2 (textures internas GLB): /ManualId/models/NombreSinExtension
          // Three.js genera estas peticiones para texturas no embebidas.
          // IMPORTANTE: Solo matchear IDs de manual (M00001, M00002, etc.)
          // para no interceptar rutas internas de Vite (@vite, src, node_modules)
          // ═══════════════════════════════════════════════════════════════
          const matchGlbTexture = !match && !matchRootFile
            ? url.match(/^\/(M\d{3,})\/(models\/)?([^.\/]+)$/)
            : null

          // ─── Manejar texturas internas del GLB ───
          if (matchGlbTexture) {
            const manualId = matchGlbTexture[1]
            const resourceName = matchGlbTexture[3]
            const extensions = ['webp', 'jpg', 'jpeg', 'png']
            
            const tryResolveTexture = async () => {
              // 1. Buscar en herrajes del manual
              for (const ext of extensions) {
                try {
                  const resp = await fetch(`${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/herrajes/${resourceName}.${ext}`, { method: 'HEAD' })
                  if (resp.ok) {
                    const full = await fetch(`${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/herrajes/${resourceName}.${ext}`)
                    const buf = Buffer.from(await full.arrayBuffer())
                    res.setHeader('Content-Type', full.headers.get('content-type') || `image/${ext}`)
                    res.setHeader('Content-Length', buf.length)
                    return res.end(buf)
                  }
                } catch {}
              }
              // 2. Buscar en herrajes compartidos
              for (const ext of extensions) {
                try {
                  const resp = await fetch(`${supabaseUrl}/storage/v1/object/public/insumos_manuales/_herrajes_compartidos/${resourceName}.${ext}`, { method: 'HEAD' })
                  if (resp.ok) {
                    const full = await fetch(`${supabaseUrl}/storage/v1/object/public/insumos_manuales/_herrajes_compartidos/${resourceName}.${ext}`)
                    const buf = Buffer.from(await full.arrayBuffer())
                    res.setHeader('Content-Type', full.headers.get('content-type') || `image/${ext}`)
                    res.setHeader('Content-Length', buf.length)
                    return res.end(buf)
                  }
                } catch {}
              }

              // 4. No encontrado — responder vacío sin error para no contaminar consola
              res.statusCode = 204
              res.end()
            }
            
            tryResolveTexture()
            return
          }

          // ─── Manejar recursos de manuales (Nivel 3 y Nivel 2) ───
          if (match || matchRootFile) {
            const manualId = match ? match[1] : matchRootFile[1]
            const category = match ? match[2] : ''
            const rest = match ? match[3] : matchRootFile[2]
            
            const localPath = category 
              ? path.join(__dirname, 'public', manualId, category, rest)
              : path.join(__dirname, 'public', manualId, rest)

            const directSupabaseUrl = category 
              ? `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/${category}/${rest}`
              : `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/${rest}`
            
            const isSoundsCategory = category === 'sounds'
            const isHerrajesCategory = category === 'herrajes'

            const serveLocalFile = () => {
              if (!isSoundsCategory && fs.existsSync(localPath)) {
                next()
                return true
              }
              return false
            }

            // Cache para audios en memoria
            if (!global.audioCache) global.audioCache = new Map()

            const fetchFromSupabase = async (urlToFetch, isFallbackAttempt = false) => {
              try {
                let buffer
                let contentType

                if (global.audioCache.has(urlToFetch)) {
                  const cached = global.audioCache.get(urlToFetch)
                  buffer = cached.buffer
                  contentType = cached.contentType
                } else {
                  const response = await fetch(urlToFetch)
                  if (!response.ok) {
                    // Fallback de audios legados
                    if (!isFallbackAttempt && isSoundsCategory) {
                      let fallbackRest = null
                      if (rest.match(/^\d+\.mp3$/)) {
                        const step = rest.split('.')[0]
                        fallbackRest = `es/${step}_es.mp3`
                      } else if (rest === '01_Ayuda.mp3') {
                        fallbackRest = `es/01_Ayuda_es.mp3`
                      }
                      if (fallbackRest) {
                        const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/insumos_manuales/${manualId}/sounds/${fallbackRest}`
                        return fetchFromSupabase(fallbackUrl, true)
                      }
                    }
                    
                    // Fallback de herrajes: buscar en carpeta compartida
                    if (!isFallbackAttempt && isHerrajesCategory) {
                      const sharedUrl = `${supabaseUrl}/storage/v1/object/public/insumos_manuales/_herrajes_compartidos/${rest}`
                      return fetchFromSupabase(sharedUrl, true)
                    }
                    
                    if (serveLocalFile()) return
                    // Para herrajes no encontrados: responder 204 silencioso
                    // (el panel muestra el nombre sin imagen, sin contaminar consola)
                    if (isHerrajesCategory) {
                      res.statusCode = 204
                      return res.end()
                    }
                    res.statusCode = response.status
                    return res.end()
                  }
                  contentType = response.headers.get('content-type')
                  const arrayBuffer = await response.arrayBuffer()
                  buffer = Buffer.from(arrayBuffer)
                  
                  if (isSoundsCategory) {
                    global.audioCache.set(urlToFetch, { buffer, contentType })
                  }
                }

                // Manejar peticiones Range (vital para Chrome <audio>)
                if (req.headers.range) {
                  const parts = req.headers.range.replace(/bytes=/, "").split("-")
                  const start = parseInt(parts[0], 10)
                  const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1
                  const chunksize = (end - start) + 1
                  
                  res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': contentType || 'audio/mpeg',
                  })
                  res.end(buffer.slice(start, end + 1))
                } else {
                  if (contentType) res.setHeader('Content-Type', contentType)
                  res.setHeader('Content-Length', buffer.length)
                  res.end(buffer)
                }
              } catch (err) {
                console.error('Error en proxy de assets:', err)
                if (serveLocalFile()) return
                res.statusCode = 500
                res.end('Error en proxy de assets')
              }
            }
            
            fetchFromSupabase(directSupabaseUrl)
            return
          }
          next()
        })
      }
    }
  ],
})