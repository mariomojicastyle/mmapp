const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 994;

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

const leadsToFix = [
  {
    id: 26,
    data: {
      "Empresa": "Kits Paraná",
      "Pais": "Brasil"
    }
  },
  {
    id: 27,
    data: {
      "Empresa": "Kits Paraná",
      "Pais": "Brasil"
    }
  },
  {
    id: 28,
    data: {
      "Empresa": "Möbler Móveis",
      "Pais": "Brasil"
    }
  },
  {
    id: 29,
    data: {
      "Empresa": "Möbler Móveis",
      "Pais": "Brasil"
    }
  }
];

const newLead = {
  "Nombre": "Evaldo Luís",
  "Apellido": "Arruda",
  "Email": "evaldo.arruda@kitsparana.com.br",
  "Rol": "Diretor Presidente",
  "Telefono": "+55 43 3275-0500",
  "Status": 4017, // Nuevo
  "Estado CRM": 4021, // Prospecto
  "Origen": "Prospección Activa",
  "Descripcion de la idea": "Director Presidente de Kits Paraná Móveis S.A. Lidera estratégicamente el grupo familiar en Arapongas.",
  "Empresa Vinculada": [31],
  "Empresa": "Kits Paraná",
  "Pais": "Brasil",
  "Canal Preferido": 4041, // Correo
  "Actividad en Redes": 4044 // Moderado
};

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Corrigiendo los campos Empresa y Pais (tipo texto) para los 4 leads inyectados...');
    for (const fix of leadsToFix) {
      try {
        await request('PATCH', `/api/database/rows/table/${leadsTableId}/${fix.id}/?user_field_names=true`, fix.data, token);
        console.log(`   Lead ID ${fix.id} actualizado con "Empresa" y "Pais" de texto.`);
      } catch (err) {
        console.error(`   Error al corregir Lead ID ${fix.id}:`, err.message);
      }
    }

    console.log('3. Inyectando al nuevo lead de nivel presidencial: Evaldo Luís Arruda...');
    try {
      const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, newLead, token);
      console.log(`   Nuevo Lead inyectado: Evaldo Luís Arruda ➔ Fila ID: ${response.id}`);
    } catch (err) {
      console.error(`   Error al inyectar Evaldo Luís Arruda:`, err.message);
    }

    console.log('\n¡Proceso de corrección y ampliación completado!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();
