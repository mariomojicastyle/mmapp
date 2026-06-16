import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, serviceRoleKey)
const herrajesDir = path.join(__dirname, 'public', 'assets', 'herrajes')

async function main() {
  if (!fs.existsSync(herrajesDir)) {
    console.error(`La ruta ${herrajesDir} no existe.`)
    return
  }

  const files = fs.readdirSync(herrajesDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
  console.log(`Subiendo ${files.length} herrajes a _herrajes_compartidos/...`)

  for (const file of files) {
    const filePath = path.join(herrajesDir, file)
    const fileBuffer = fs.readFileSync(filePath)
    const ext = path.extname(file).toLowerCase()
    const contentType = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : 'image/jpeg'

    const { data, error } = await supabase.storage
      .from('insumos_manuales')
      .upload(`_herrajes_compartidos/${file}`, fileBuffer, {
        contentType,
        upsert: true
      })

    if (error) {
      console.error(`  ❌ ${file}:`, error.message)
    } else {
      console.log(`  ✅ ${file}`)
    }
  }

  // Verificar
  const { data: list, error: listError } = await supabase.storage
    .from('insumos_manuales')
    .list('_herrajes_compartidos', { limit: 100 })

  if (listError) {
    console.error('Error listando:', listError.message)
  } else {
    console.log(`\n✅ Archivos en _herrajes_compartidos: ${list.length}`)
    list.forEach(f => console.log(`  📁 ${f.name}`))
  }
}

main().catch(console.error)
