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

// Funciones auxiliares para inyectar CSS autogenerado en tiempo de desarrollo
function injectCSS(filePath, newCSS) {
  const startMarker = '/* CALIBRATOR_GENERATED_START */'
  const endMarker = '/* CALIBRATOR_GENERATED_END */'
  const block = `${startMarker}\n${newCSS}\n${endMarker}`
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, block, 'utf-8')
    return
  }
  
  let content = fs.readFileSync(filePath, 'utf-8')
  const startIndex = content.indexOf(startMarker)
  const endIndex = content.indexOf(endMarker)
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = content.substring(0, startIndex)
    const after = content.substring(endIndex + endMarker.length)
    content = before + block + after
  } else {
    content = content.trimEnd() + '\n\n' + block + '\n'
  }
  
  fs.writeFileSync(filePath, content, 'utf-8')
}

function updateCSSFiles(calibrationData) {
  const camon = calibrationData['mode-camon']
  const small = calibrationData['mode-small']
  const tablet = calibrationData['mode-tablet']
  
  if (!camon || !small || !tablet) return

  // 1. PanelAyudas.css
  const ayudasPath = path.join(__dirname, 'src/features/AssemblyInstructions/components/NavBarInferior/PanelAyudas/PanelAyudas.css')
  const ayudasCSS = `/* --- Móviles (ej: Tecno Camon 40 Pro / Móvil Estándar) --- */
@media (max-width: 787px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { top: ${camon.nubesTop !== undefined ? camon.nubesTop : 56}px !important; left: ${camon.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${camon.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { top: ${camon.nubesTop !== undefined ? camon.nubesTop : 56}px !important; left: ${camon.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${camon.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { top: ${camon.nubesTop !== undefined ? camon.nubesTop : 56}px !important; right: ${camon.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${camon.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { top: ${camon.nubesTop !== undefined ? camon.nubesTop : 56}px !important; right: ${camon.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${camon.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: ${camon.nubesBottom}px !important; left: ${camon.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${camon.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: ${camon.nubesBottom}px !important; left: ${camon.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${camon.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: ${camon.nubesBottom}px !important; right: ${camon.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${camon.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${camon.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${camon.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}

/* --- Móviles Pequeños (320px) --- */
@media (max-width: 320px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { top: ${small.nubesTop !== undefined ? small.nubesTop : 56}px !important; left: ${small.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${small.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { top: ${small.nubesTop !== undefined ? small.nubesTop : 56}px !important; left: ${small.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${small.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { top: ${small.nubesTop !== undefined ? small.nubesTop : 56}px !important; right: ${small.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${small.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { top: ${small.nubesTop !== undefined ? small.nubesTop : 56}px !important; right: ${small.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${small.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: ${small.nubesBottom}px !important; left: ${small.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${small.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: ${small.nubesBottom}px !important; left: ${small.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${small.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: ${small.nubesBottom}px !important; right: ${small.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${small.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${small.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${small.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}

/* --- Tablets (788px a 1024px) --- */
@media (min-width: 788px) and (max-width: 1024px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { top: ${tablet.nubesTop !== undefined ? tablet.nubesTop : 56}px !important; left: ${tablet.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${tablet.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { top: ${tablet.nubesTop !== undefined ? tablet.nubesTop : 56}px !important; left: ${tablet.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${tablet.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { top: ${tablet.nubesTop !== undefined ? tablet.nubesTop : 56}px !important; right: ${tablet.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${tablet.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { top: ${tablet.nubesTop !== undefined ? tablet.nubesTop : 56}px !important; right: ${tablet.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${tablet.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: ${tablet.nubesBottom}px !important; left: ${tablet.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${tablet.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: ${tablet.nubesBottom}px !important; left: ${tablet.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${tablet.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: ${tablet.nubesBottom}px !important; right: ${tablet.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${tablet.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${tablet.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${tablet.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}`
  injectCSS(ayudasPath, ayudasCSS)

  // 2. BotonCerrar.css
  const cerrarPath = path.join(__dirname, 'src/features/AssemblyInstructions/components/BotonCerrar/BotonCerrar.css')
  const cerrarCSS = `@media (max-width: 787px) {
  .cerrar {
    top: ${camon.cerrar.top}px !important;
    right: ${camon.cerrar.right}px !important;
  }
}

@media (max-width: 320px) {
  .cerrar {
    top: ${small.cerrar.top}px !important;
    right: ${small.cerrar.right}px !important;
  }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .cerrar {
    top: ${tablet.cerrar.top}px !important;
    right: ${tablet.cerrar.right}px !important;
  }
}`
  injectCSS(cerrarPath, cerrarCSS)

  // 3. RealidadAumentada.css
  const arPath = path.join(__dirname, 'src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.css')
  const arCSS = `@media (max-width: 787px) {
  .AR {
    bottom: ${camon.ar.bottom}px !important;
    right: ${camon.ar.right}px !important;
  }
}

@media (max-width: 320px) {
  .AR {
    bottom: ${small.ar.bottom}px !important;
    right: ${small.ar.right}px !important;
  }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .AR {
    bottom: ${tablet.ar.bottom}px !important;
    right: ${tablet.ar.right}px !important;
  }
}`
  injectCSS(arPath, arCSS)

  // 4. NavBarSuperior.css
  const superiorPath = path.join(__dirname, 'src/features/AssemblyInstructions/components/NavBarSuperior/NavBarSuperior.css')
  const superiorCSS = `@media (max-width: 787px) {
  .contenedor1 { top: ${camon.margins.top}px !important; }
}

@media (max-width: 320px) {
  .contenedor1 { top: ${small.margins.top}px !important; }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .contenedor1 { top: ${tablet.margins.top}px !important; }
}`
  injectCSS(superiorPath, superiorCSS)

  // 5. NavBarInferior.css
  const inferiorPath = path.join(__dirname, 'src/features/AssemblyInstructions/components/NavBarInferior/NavBarInferior.css')
  const inferiorCSS = `@media (max-width: 787px) {
  .contenedor { bottom: ${camon.margins.bottom}px !important; }
}

@media (max-width: 320px) {
  .contenedor { bottom: ${small.margins.bottom}px !important; }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .contenedor { bottom: ${tablet.margins.bottom}px !important; }
}`
  injectCSS(inferiorPath, inferiorCSS)
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'supabase-assets-proxy',
      configureServer(server) {
        // Diccionario de alias para mapear códigos SKU antiguos a nombres limpios genéricos
        const nameAliases = {
          'caja_0007374': 'Caja_minifix',
          'caja_0002715': 'Caja_minifix',
          'deslizador_007391': 'Deslizador',
          'deslizador_0004696': 'Deslizador',
          'perno_0007374': 'Perno',
          'tarugo_20030001': 'Tarugo',
          'tarugo_20030': 'Tarugo',
          'tornillo_0000152': 'Tornillo_123',
          'tornillo_000152': 'Tornillo_456',
          'tornillo_0004705': 'Tornillo_456',
          'tuerca_0004674': 'Tuerca',
          'corredera_350_20080001': 'Rieles',
          'corredera_350': 'Rieles'
        };

        const resolveAlias = (name) => {
          if (!name) return name;
          const extIndex = name.lastIndexOf('.');
          const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
          const ext = extIndex !== -1 ? name.substring(extIndex) : '';
          const key = baseName.toLowerCase();
          if (nameAliases[key]) {
            return nameAliases[key] + ext;
          }
          return name;
        };

        server.middlewares.use(async (req, res, next) => {
          const url = req.url || ''
          
          if (url === '/api/load-calibration' && req.method === 'GET') {
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
          
          if (url === '/api/save-calibration' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const calibrationData = JSON.parse(body)
                fs.writeFileSync(path.join(__dirname, 'calibration.json'), JSON.stringify(calibrationData, null, 2), 'utf-8')
                updateCSSFiles(calibrationData)
                
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: true, message: 'Calibración guardada y CSS inyectado con éxito' }))
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ success: false, error: e.message }))
              }
            })
            return
          }
          
          // Regla especial para herrajes compartidos en Supabase
          if (url.startsWith('/assets/herrajes_compartidos/')) {
            const rawFileName = url.replace('/assets/herrajes_compartidos/', '')
            const fileName = resolveAlias(rawFileName)
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
            const rawResourceName = matchGlbTexture[3]
            const resourceName = resolveAlias(rawResourceName)
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