import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dezaisaunoumhqpssols.supabase.co'
const serviceRoleKey = 'sb_secret_t2GY5165gsl0IAureM6-eQ_eXQxHibt'

const supabase = createClient(supabaseUrl, serviceRoleKey)
const bucketName = 'insumos_manuales'

const copies = [
  // Herrajes compartidos
  { from: '_herrajes_compartidos/Caja_0007374.jpg', to: '_herrajes_compartidos/Caja_minifix.jpg' },
  { from: '_herrajes_compartidos/Deslizador_007391.jpg', to: '_herrajes_compartidos/Deslizador.jpg' },
  { from: '_herrajes_compartidos/Perno_0007374.jpg', to: '_herrajes_compartidos/Perno.jpg' },
  { from: '_herrajes_compartidos/Tarugo_20030001.jpg', to: '_herrajes_compartidos/Tarugo.jpg' },
  { from: '_herrajes_compartidos/Tornillo_0000152.jpg', to: '_herrajes_compartidos/Tornillo_123.jpg' },
  { from: '_herrajes_compartidos/Tornillo_000152.jpg', to: '_herrajes_compartidos/Tornillo_456.jpg' },
  { from: '_herrajes_compartidos/Tuerca_0004674.jpg', to: '_herrajes_compartidos/Tuerca.jpg' },
  { from: '_herrajes_compartidos/Corredera_350_20080001.jpg', to: '_herrajes_compartidos/Rieles.jpg' },

  // Herrajes específicos de M00001 (formato .webp)
  { from: 'M00001/herrajes/Caja_0002715.webp', to: 'M00001/herrajes/Caja_minifix.webp' },
  { from: 'M00001/herrajes/Deslizador_0004696.webp', to: 'M00001/herrajes/Deslizador.webp' },
  { from: 'M00001/herrajes/Perno_0007374.webp', to: 'M00001/herrajes/Perno.webp' },
  { from: 'M00001/herrajes/Tarugo_20030.webp', to: 'M00001/herrajes/Tarugo.webp' },
  { from: 'M00001/herrajes/Tornillo_0000152.webp', to: 'M00001/herrajes/Tornillo_123.webp' },
  { from: 'M00001/herrajes/Tornillo_0004705.webp', to: 'M00001/herrajes/Tornillo_456.webp' },
  { from: 'M00001/herrajes/Corredera_350.webp', to: 'M00001/herrajes/Rieles.webp' }
]

async function run() {
  console.log('🏁 Iniciando duplicación de archivos en Supabase Storage...')
  
  for (const item of copies) {
    console.log(`Copiando: ${item.from} ➔ ${item.to}...`)
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .copy(item.from, item.to)
      
    if (error) {
      console.error(`  ❌ Error al copiar ${item.from}:`, error.message)
    } else {
      console.log(`  ✅ Copiado exitoso: ${item.to}`)
    }
  }
  
  console.log('🎉 Duplicación completada.')
}

run().catch(console.error)
