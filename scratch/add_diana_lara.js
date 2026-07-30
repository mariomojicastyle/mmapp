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
    
    // 1. Search for Sodimac in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let sodimacRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('sodimac'));
    
    let sodimacId = sodimacRow ? sodimacRow.id : 18;
    console.log(`Found Sodimac Colombia in table 991 with ID: ${sodimacId}`);

    // 2. Add Lead Diana Marcela Lara Combariza
    const leadPayload = {
      'Nombre': 'Diana Marcela',
      'Apellido': 'Lara Combariza',
      'Empresa': 'Sodimac Colombia / Homecenter',
      'Empresa Vinculada': [sodimacId],
      'Pais': 'Colombia',
      'Rol': 'Gerente de Categoría | Director Comercial Retail',
      'Email': 'diana.lara@homecenter.co',
      'Telefono': '+57 1 3077115',
      'Status': 4018, // En Proceso
      'Estado CRM': 4022, // Contactado
      'LinkedIn': 'https://www.linkedin.com/in/diana-marcela-lara-combariza-71649234/',
      'Facebook': 'https://www.facebook.com/search/top?q=Diana%20Marcela%20Lara%20Homecenter',
      'Instagram': 'https://www.instagram.com/explore/tags/dianamarcelalaracombariza/',
      'WhatsApp': 'https://wa.me/5713077115',
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4044, // Activo
      'Origen': 'Seguimiento Propuesta InMail',
      'Descripcion de la idea': 'Gerente de Categoría en Homecenter. Se le envió propuesta de piloto sin costo para mueble problema RTA en tienda el 18 de Julio.'
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: Diana Marcela Lara Combariza (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
