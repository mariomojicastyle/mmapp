const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 600; // Tabla de Contactos/Leads

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

const keyContacts = [
  {
    "Nombre": "José Lopes",
    "Apellido": "Aquino",
    "Email": "diretoria@colibrimoveis.com.br",
    "Telefono": "+55 43 3275-8100",
    "Rol": "CEO / Diretor Presidente",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Contacto clave. CEO de Colibri Móveis y líder del Sindicato de Industrias del Mueble de Arapongas (SIMA).",
    "Empresa Vinculada": [1] // Vinculado a Colibri Móveis (ID: 1)
  },
  {
    "Nombre": "Guilherme",
    "Apellido": "Pitta Lopes Aquino",
    "Email": "operacoes@colibrimoveis.com.br",
    "Telefono": "+55 43 3275-8100",
    "Rol": "Diretor de Operações",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Director de Operaciones y sucesor clave en Colibri Móveis.",
    "Empresa Vinculada": [1] // Vinculado a Colibri Móveis (ID: 1)
  },
  {
    "Nombre": "Larissa",
    "Apellido": "Schikovski Angonese",
    "Email": "marketing@notavel.ind.br",
    "Telefono": "+55 46 3541-1200",
    "Rol": "Gerente de Marketing e RH",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Gerente de Marketing y Recursos Humanos en Móveis Notável. Contacto directo para propuestas de valor visual y digital.",
    "Empresa Vinculada": [2] // Vinculado a Móveis Notável (ID: 2)
  },
  {
    "Nombre": "Volnei",
    "Apellido": "Benini",
    "Email": "volnei.benini@brv.com.br",
    "Telefono": "+55 54 3455-6600",
    "Rol": "CEO / Diretor",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Director clave de BRV Móveis. Expresidente y líder de la asociación de Bento Gonçalves (MOVERGS).",
    "Empresa Vinculada": [8] // Vinculado a BRV Móveis (ID: 8)
  },
  {
    "Nombre": "Rogério",
    "Apellido": "Dalla Costa",
    "Email": "rogerio@moveisvideira.com.br",
    "Telefono": "+55 54 3451-2333",
    "Rol": "Diretor-Presidente",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Director-Presidente de Móveis Videira / Tecno Mobili. Contacto estratégico de R&D y Oficina RTA.",
    "Empresa Vinculada": [9] // Vinculado a Tecno Mobili (ID: 9)
  },
  {
    "Nombre": "Noemir",
    "Apellido": "Capoani",
    "Email": "noemir@ditalia.com.br",
    "Telefono": "+55 54 3455-5900",
    "Rol": "Presidente / Diretor",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Descripcion de la idea": "Presidente de Ditália Móveis (Bento Gonçalves). Contacto para tomas de decisiones estratégicas.",
    "Empresa Vinculada": [6] // Vinculado a Ditália Móveis (ID: 6)
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Sembrando ${keyContacts.length} contactos clave en la tabla Leads (ID: ${leadsTableId})...`);

    for (const contact of keyContacts) {
      try {
        const payload = {
          "Nombre": contact["Nombre"],
          "Apellido": contact["Apellido"],
          "Email": contact["Email"],
          "Telefono": contact["Telefono"],
          "Rol": contact["Rol"],
          "Status": contact["Status"],
          "Origen": contact["Origen"],
          "Descripcion de la idea": contact["Descripcion de la idea"],
          "Empresa Vinculada": contact["Empresa Vinculada"]
        };
        const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, payload, token);
        console.log(`   Contacto creado con éxito: ${contact["Nombre"]} ${contact["Apellido"]} ➔ Fila ID: ${response.id}`);
      } catch (err) {
        console.error(`   Error al crear contacto ${contact["Nombre"]}:`, err.message);
      }
    }

    console.log('\n¡Semilla de contactos completada con éxito!');
  } catch (error) {
    console.error('Error durante la ejecución del script:', error.message);
  }
}

run();
