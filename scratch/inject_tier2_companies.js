const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 989; // ID de la tabla de Empresas

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

const tier2Companies = [
  {
    "Nombre de la Empresa": "Colibri Móveis",
    "Sitio Web": "https://www.colibrimoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Especialistas en paneles de TV y home theater."
  },
  {
    "Nombre de la Empresa": "Móveis Notável",
    "Sitio Web": "https://www.notavel.ind.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Ampére (PR). Fuerte presencia en retail físico."
  },
  {
    "Nombre de la Empresa": "Móveis Rufato",
    "Sitio Web": "https://www.moveisrufato.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Ubá (MG). Especializados en dormitorios y comedores."
  },
  {
    "Nombre de la Empresa": "Dj Móveis",
    "Sitio Web": "https://www.djmoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Líder en mesas de comedor y salas de entretenimiento."
  },
  {
    "Nombre de la Empresa": "Telasul",
    "Sitio Web": "https://www.telasul.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Cocinas",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 de Garibaldi (RS). Cocinas de acero y modulares de madera."
  },
  {
    "Nombre de la Empresa": "Ditália Móveis",
    "Sitio Web": "https://www.ditalia.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 de Bento Gonçalves (RS). Muebles RTA de gama media-alta y diseño premium."
  },
  {
    "Nombre de la Empresa": "Móveis Albatroz",
    "Sitio Web": "https://www.moveisalbatroz.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Dormitorios y armarios de organización multiuso."
  },
  {
    "Nombre de la Empresa": "BRV Móveis",
    "Sitio Web": "https://www.brvmoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Oficina",
    "Dolor Principal": "Ninguno",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Bento Gonçalves (RS). Fuerte orientación a oficinas en casa y exportación."
  },
  {
    "Nombre de la Empresa": "Tecno Mobili",
    "Sitio Web": "https://www.tecnomobili.ind.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Oficina",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Marca de e-commerce de Móveis Videira (RS). Especialistas en home office RTA."
  },
  {
    "Nombre de la Empresa": "Artely",
    "Sitio Web": "https://www.artely.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Ninguno",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Curitiba (PR). Líder nacional en complementos RTA (mesas de centro, consolas)."
  },
  {
    "Nombre de la Empresa": "Móveis Bechara",
    "Sitio Web": "https://www.moveisbechara.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Tanabi (SP). Especialistas en racks de TV y estanterías RTA."
  },
  {
    "Nombre de la Empresa": "Zanzini Móveis",
    "Sitio Web": "https://www.zanzini.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Dois Córregos (SP). Muebles funcionales RTA bajo procesos eco-responsables."
  },
  {
    "Nombre de la Empresa": "Permóbili",
    "Sitio Web": "https://www.permobili.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Linhares (ES). Paneles de TV, buffets y cómodas."
  },
  {
    "Nombre de la Empresa": "Poliman Móveis",
    "Sitio Web": "https://www.poliman.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Cocinas",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Arapongas (PR). Cocinas modulares RTA de alta rotación comercial."
  },
  {
    "Nombre de la Empresa": "Imcal Móveis",
    "Sitio Web": "https://www.imcal.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Bento Gonçalves (RS). Racks y salas de estar con patas de madera de estilo retro."
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Inyectando ${tier2Companies.length} empresas del Tier 2 a la tabla ${empresasTableId}...`);

    for (const company of tier2Companies) {
      try {
        const payload = {
          "Nombre de la Empresa": company["Nombre de la Empresa"],
          "Sitio Web": company["Sitio Web"],
          "Pais": company["Pais"],
          "Nicho / Segmento": company["Nicho / Segmento"],
          "Dolor Principal": company["Dolor Principal"],
          "Estado Comercial": company["Estado Comercial"],
          "Notas del Target": company["Notas del Target"]
        };
        const response = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, payload, token);
        console.log(`   Inyectada con éxito: ${company["Nombre de la Empresa"]} (Fila ID: ${response.id})`);
      } catch (err) {
        console.error(`   Error al inyectar ${company["Nombre de la Empresa"]}:`, err.message);
      }
    }

    console.log('\n¡Proceso finalizado con éxito! El Tier 2 ha sido cargado en el CRM.');
  } catch (error) {
    console.error('Error durante la inyección:', error.message);
  }
}

run();
