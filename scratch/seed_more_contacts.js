const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 600;

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

const moreContacts = [
  {
    "Nombre": "Marcelo",
    "Apellido": "Ariotti",
    "Email": "marcelo.ariotti@telasul.com.br",
    "Telefono": "+55 54 3463-9444",
    "Rol": "Diretor-Presidente / CEO",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Telasul",
    "Descripcion de la idea": "CEO de Telasul. Tomador de decisión estratégico para la línea de cocinas modulares de acero y madera RTA.",
    "Empresa Vinculada": [5] // Telasul (ID: 5)
  },
  {
    "Nombre": "Jorge Nassar",
    "Apellido": "Frange",
    "Email": "jorge.frange@moveisbechara.com.br",
    "Telefono": "+55 17 3272-9900",
    "Rol": "Sócio-Diretor / CEO",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Móveis Bechara",
    "Descripcion de la idea": "Líder de Móveis Bechara (Jorgito Bechara). Responsable de alianzas e innovación de producto.",
    "Empresa Vinculada": [11] // Móveis Bechara (ID: 11)
  },
  {
    "Nombre": "Humberto",
    "Apellido": "Zanzini",
    "Email": "humberto@zanzini.com.br",
    "Telefono": "+55 14 3652-9900",
    "Rol": "Diretor Executivo",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Zanzini Móveis",
    "Descripcion de la idea": "Director y vocero principal de Zanzini Móveis. Interesado en procesos eficientes y eco-responsabilidad.",
    "Empresa Vinculada": [12] // Zanzini Móveis (ID: 12)
  },
  {
    "Nombre": "Maic",
    "Apellido": "Caneira",
    "Email": "maic@grupocaneira.com.br",
    "Telefono": "+55 54 3454-7132",
    "Rol": "CEO / Diretor Geral",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Imcal Móveis",
    "Descripcion de la idea": "CEO del Grupo Caneira (propietario de Imcal). Tomador de decisión clave para modernizar manuales RTA.",
    "Empresa Vinculada": [15] // Imcal Móveis (ID: 15)
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Sembrando ${moreContacts.length} nuevos contactos en Leads (ID: ${leadsTableId})...`);
    for (const contact of moreContacts) {
      try {
        const payload = {
          "Nombre": contact["Nombre"],
          "Apellido": contact["Apellido"],
          "Email": contact["Email"],
          "Telefono": contact["Telefono"],
          "Rol": contact["Rol"],
          "Status": contact["Status"],
          "Origen": contact["Origen"],
          "Empresa": contact["Empresa"],
          "Descripcion de la idea": contact["Descripcion de la idea"],
          "Empresa Vinculada": contact["Empresa Vinculada"]
        };
        const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, payload, token);
        console.log(`   Contacto creado: ${contact["Nombre"]} ${contact["Apellido"]} ➔ Fila ID: ${response.id}`);
      } catch (err) {
        console.error(`   Error al crear contacto ${contact["Nombre"]}:`, err.message);
      }
    }
    console.log('\n¡Nuevos contactos sembrados con éxito!');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();
