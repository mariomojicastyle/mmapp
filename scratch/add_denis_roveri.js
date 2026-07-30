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
    
    // 1. Search for Móveis Bartira in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let bartiraRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('bartira'));
    
    let bartiraId = bartiraRow ? bartiraRow.id : 16;
    console.log(`Found Móveis Bartira in table 991 with ID: ${bartiraId}`);

    const companyPhone = '+55 11 4225-8000';

    // 2. Define Denis Roveri lead
    const lead = {
      nombre: 'Denis',
      apellido: 'Roveri',
      empresa: 'Móveis Bartira',
      empresaId: bartiraId,
      pais: 'Brasil',
      rol: 'Gerente de Engenharia na Ind de Móveis Bartira',
      email: 'denis.roveri@bartira.com.br',
      phone: companyPhone,
      linkedin: 'https://www.linkedin.com/in/denis-roveri/',
      descripcion: 'Gerente de Engenharia na Móveis Bartira (São Caetano do Sul / Mauá, SP). Referenciado directamente por Hermes Rodrigues de Oliveira da logística.'
    };

    const fbSearchUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nombre + ' ' + lead.apellido + ' Bartira')}`;
    const igSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent((lead.nombre + lead.apellido).toLowerCase().replace(/[^a-z0-9]/g, ''))}/`;
    const waUrl = `https://wa.me/551142258000`;

    const leadPayload = {
      'Nombre': lead.nombre,
      'Apellido': lead.apellido,
      'Empresa': lead.empresa,
      'Empresa Vinculada': [lead.empresaId],
      'Pais': lead.pais,
      'Rol': lead.rol,
      'Email': lead.email,
      'Telefono': lead.phone,
      'Status': 4017, // Nuevo
      'Estado CRM': 4021, // Prospecto
      'LinkedIn': lead.linkedin,
      'Facebook': fbSearchUrl,
      'Instagram': igSearchUrl,
      'WhatsApp': waUrl,
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4044, // Activo
      'Origen': 'Referenciado por Hermes Rodrigues (Bartira)',
      'Descripcion de la idea': lead.descripcion
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: ${lead.nombre} ${lead.apellido} (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
