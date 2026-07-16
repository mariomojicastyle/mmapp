const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991;

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

// Mapeo de IDs de opciones:
// Canal Preferido (Campo ID 9549): LinkedIn (4029), Instagram (4030), Facebook (4031), Sitio Web / Formulario (4032)
// Actividad en Redes (Campo ID 9550): Muy Activo (4033), Moderado (4034), Inactivo (4035)

const socialData = [
  {
    id: 1,
    facebook: "https://www.facebook.com/colibrimoveisoficial/",
    instagram: "https://www.instagram.com/colibri.moveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 2,
    facebook: "https://www.facebook.com/notavelmoveis/",
    instagram: "https://www.instagram.com/notavelmoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 3,
    facebook: "https://www.facebook.com/moveisrufato/",
    instagram: "https://www.instagram.com/moveisrufato/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 4,
    facebook: "https://www.facebook.com/djmoveis/",
    instagram: "https://www.instagram.com/djmoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 5,
    facebook: "https://www.facebook.com/telasul/",
    instagram: "https://www.instagram.com/telasulmoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 6,
    facebook: "https://www.facebook.com/ditaliamoveis/",
    instagram: "https://www.instagram.com/ditaliamoveisoficial/",
    canalPreferido: 4032, // Sitio Web / Formulario (Recuperación Judicial)
    actividad: 4035      // Inactivo
  },
  {
    id: 7,
    facebook: "https://www.facebook.com/moveisalbatroz/",
    instagram: "https://www.instagram.com/moveisalbatroz/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 8,
    facebook: "https://www.facebook.com/brvmoveis/",
    instagram: "https://www.instagram.com/brvmoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4034      // Moderado
  },
  {
    id: 9,
    facebook: "https://www.facebook.com/tecnomobili/",
    instagram: "https://www.instagram.com/tecnomobili/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 10,
    facebook: "https://www.facebook.com/artelymoveis/",
    instagram: "https://www.instagram.com/artelymoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 11,
    facebook: "https://www.facebook.com/IndustriaMoveisBechara/",
    instagram: "https://www.instagram.com/moveisbechara/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 12,
    facebook: "https://www.facebook.com/zanzinimoveis/",
    instagram: "https://www.instagram.com/zanzinimoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4034      // Moderado
  },
  {
    id: 13,
    facebook: "https://www.facebook.com/permobili.moveis/",
    instagram: "https://www.instagram.com/permobili.moveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 14,
    facebook: "https://www.facebook.com/polimanmoveis/",
    instagram: "https://www.instagram.com/polimanmoveis/",
    canalPreferido: 4030, // Instagram
    actividad: 4033      // Muy Activo
  },
  {
    id: 15,
    facebook: "https://www.facebook.com/moveisimcal/",
    instagram: "https://www.instagram.com/moveisimcal/",
    canalPreferido: 4030, // Instagram
    actividad: 4034      // Moderado
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Poblando campos de Facebook, Instagram, Canal Preferido y Actividad en la tabla ${empresasTableId}...`);
    for (const data of socialData) {
      try {
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${data.id}/?user_field_names=true`, {
          "Facebook": data.facebook,
          "Instagram": data.instagram,
          "Canal Preferido": data.canalPreferido,
          "Actividad en Redes": data.actividad
        }, token);
        console.log(`   Empresa ID ${data.id} ➔ Datos sociales cargados.`);
      } catch (err) {
        console.error(`   Error al actualizar Empresa ID ${data.id}:`, err.message);
      }
    }
    console.log('\n¡Datos de Facebook, Instagram y actividades poblados con éxito!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();
