const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.match(/GEMINI_API_KEY=([^\r\n]+)/)?.[1];

async function main() {
  const start = Date.now();
  const dummyBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  const res = await fetch('http://localhost:3003/api/ventas-ram/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imagenes_base64: [dummyBase64, dummyBase64, dummyBase64, dummyBase64],
      prospecto_nombre: 'Luiz Atilio Barse',
      empresa: 'Mobille Exportação e Importação Ltda'
    })
  });

  const data = await res.json();
  console.log('Status:', res.status, 'Time:', (Date.now() - start) + 'ms');
  console.log('Result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
