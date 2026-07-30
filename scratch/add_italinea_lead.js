const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
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

async function run() {
  try {
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    
    // 1. Search for Italínea in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let italineaRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('italinea'));
    
    let italineaId = italineaRow ? italineaRow.id : 69;
    console.log(`Found Italínea Móveis in table 991 with ID: ${italineaId}`);

    // 2. Add Lead Maria do Carmo
    const leadPayload = {
      'Nombre': 'Maria do Carmo',
      'Apellido': 'Roos Soares',
      'Empresa': 'Italínea Móveis',
      'Empresa Vinculada': [italineaId],
      'Pais': 'Brasil',
      'Rol': 'Marketing & Eventos | Conecta+',
      'Email': 'pedcriareeitalinea@italinea.com.br',
      'Telefono': '+55 54 3455-9000',
      'Status': 4018, // En Proceso
      'Estado CRM': 4022, // Contactado / Interesado
      'LinkedIn': 'https://www.linkedin.com/in/maria-do-carmo-roos-soares-16a75775/',
      'Facebook': 'https://www.facebook.com/search/top?q=Maria%20do%20Carmo%20Roos%20Soares%20Ital%C3%ADnea',
      'Instagram': 'https://www.instagram.com/explore/tags/mariadocarmoroossoares/',
      'WhatsApp': 'https://wa.me/555434559000',
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4044, // Activo
      'Origen': 'Respuesta Directa LinkedIn',
      'Descripcion de la idea': 'Indicó enviar demo del catálogo 3D al equipo de I+D / Creación de Italínea: pedcriareeitalinea@italinea.com.br'
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: Maria do Carmo Roos Soares (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
