const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991; // ID correcto de la tabla de empresas en el CRM B2B

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `JWT ${token}`;
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`Request ${method} ${path} failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Mapeos de IDs de opciones para la tabla 991:
// Nicho / Segmento (campo ID 9495): Mobiliario RTA (3990), Oficina (3991), Cocinas (3992), Tapizados (3993), Otro (3994)
// Dolor Principal (campo ID 9496): Devoluciones de herrajes (3995), R&D lento (3996), Falta de WebAR (3997), Ninguno (3998)
// Estado Comercial (campo ID 9497): Prospecto (3999), Contactado (4000), Demo Agendada (4001), Negociación (4002)
// Canal Preferido (campo ID 9549): LinkedIn (4029), Instagram (4030), Facebook (4031), Sitio Web / Formulario (4032), WhatsApp (4036)
// Actividad en Redes (campo ID 9550): Muy Activo (4033), Moderado (4034), Inactivo (4035)

const missingExhibitors = [
  {
    "Nombre de la Empresa": "Kits Paraná",
    "Sitio Web": "https://www.kitsparana.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/kits-paran%C3%A1-m%C3%B3veis-s.a./",
    "Facebook": "https://www.facebook.com/kitsparana/",
    "Instagram": "https://www.instagram.com/kitsparana/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3992, // Cocinas
    "Dolor Principal": 3995, // Devoluciones de herrajes
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante de Arapongas (PR). Especialistas históricos en cocinas compactas y organizadores RTA de gran volumen. Detectado como expositor recurrente en Movel Sul. Faturamento Est. R$ 120M - 150M."
  },
  {
    "Nombre de la Empresa": "Möbler Móveis",
    "Sitio Web": "https://www.mobler.ind.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/mobler-moveis/",
    "Facebook": "https://www.facebook.com/moblermoveis/",
    "Instagram": "https://www.instagram.com/mobler.br/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante RTA de Bela Vista do Paraíso (PR). Especialistas en racks de TV, paneles modulares y buffets de diseño accesible. Detectado como expositor en Movel Sul. Faturamento Est. R$ 70M - R$ 85M."
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Inyectando ${missingExhibitors.length} empresas a la tabla ${empresasTableId}...`);

    for (const company of missingExhibitors) {
      try {
        const payload = {
          "Nombre de la Empresa": company["Nombre de la Empresa"],
          "Sitio Web": company["Sitio Web"],
          "LinkedIn Corporativo": company["LinkedIn Corporativo"],
          "Facebook": company["Facebook"],
          "Instagram": company["Instagram"],
          "Pais": company["Pais"],
          "Nicho / Segmento": company["Nicho / Segmento"],
          "Dolor Principal": company["Dolor Principal"],
          "Estado Comercial": company["Estado Comercial"],
          "Canal Preferido": company["Canal Preferido"],
          "Actividad en Redes": company["Actividad en Redes"],
          "Notas del Target": company["Notas del Target"]
        };
        const response = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, payload, token);
        console.log(`   Inyectada con éxito: ${company["Nombre de la Empresa"]} (Fila ID: ${response.id})`);
      } catch (err) {
        console.error(`   Error al inyectar ${company["Nombre de la Empresa"]}:`, err.message);
      }
    }

    console.log('\n¡Proceso finalizado con éxito! Las empresas faltantes han sido cargadas en el CRM.');
  } catch (error) {
    console.error('Error durante la inyección:', error.message);
  }
}

run();
