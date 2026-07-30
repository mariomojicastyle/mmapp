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
    
    // 1. Search for Cozinhas Itatiaia in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let itatiaiaRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('itatiaia'));
    
    let itatiaiaId;
    if (itatiaiaRow) {
      itatiaiaId = itatiaiaRow.id;
      console.log(`Found Cozinhas Itatiaia in table 991 with ID: ${itatiaiaId}`);
    } else {
      console.log('Cozinhas Itatiaia not found in table 991, creating it...');
      const newCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
        'Nombre de la Empresa': 'Cozinhas Itatiaia',
        'Sitio Web': 'https://www.cozinhasitatiaia.com.br',
        'LinkedIn Corporativo': 'https://www.linkedin.com/company/itatiaia-moveis/',
        'Pais': 'Brasil',
        'Nicho / Segmento': 'Mobiliario RTA',
        'Canal Preferido': 4029, // LinkedIn
        'Actividad en Redes': 4034, // Alto
        'Estado Comercial': 'En Contacto'
      }, token);
      itatiaiaId = newCompany.id;
      console.log(`Created Cozinhas Itatiaia with ID: ${itatiaiaId}`);
    }

    const companyPhone = '+55 31 3514-4000';

    // 2. Define Evandro Pinto lead
    const lead = {
      nombre: 'Evandro',
      apellido: 'Pinto',
      empresa: 'Cozinhas Itatiaia',
      empresaId: itatiaiaId,
      pais: 'Brasil',
      rol: 'Diretor Industrial',
      email: 'evandro.pinto@cozinhasitatiaia.com.br',
      phone: companyPhone,
      linkedin: 'https://www.linkedin.com/in/evandro-pinto-cozinhasitatiaia/',
      descripcion: 'Diretor Industrial na Cozinhas Itatiaia (Ubá, Minas Gerais / Brasil). Aceptó conexión en LinkedIn y revisó el perfil 2 veces.'
    };

    const fbSearchUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nombre + ' ' + lead.apellido + ' ' + lead.empresa)}`;
    const igSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent((lead.nombre + lead.apellido).toLowerCase().replace(/[^a-z0-9]/g, ''))}/`;
    const waUrl = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`;

    const leadPayload = {
      'Nombre': lead.nombre,
      'Apellido': lead.apellido,
      'Empresa': lead.empresa,
      'Empresa Vinculada': [lead.empresaId],
      'Pais': lead.pais,
      'Rol': lead.rol,
      'Email': lead.email,
      'Telefono': lead.phone,
      'Status': 4018, // En Proceso
      'Estado CRM': 4022, // Contactado / Interesado
      'LinkedIn': lead.linkedin,
      'Facebook': fbSearchUrl,
      'Instagram': igSearchUrl,
      'WhatsApp': waUrl,
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4044, // Activo
      'Origen': 'Inbound / Aceptó Conexión',
      'Descripcion de la idea': lead.descripcion
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: ${lead.nombre} ${lead.apellido} (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
