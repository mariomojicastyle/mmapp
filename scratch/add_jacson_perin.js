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
    
    // 1. Search for Móveis Henn in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let hennRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('henn'));
    
    let hennId;
    if (hennRow) {
      hennId = hennRow.id;
      console.log(`Found Móveis Henn in table 991 with ID: ${hennId}`);
    } else {
      console.log('Móveis Henn not found in table 991, creating it...');
      const newCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
        'Nombre de la Empresa': 'Móveis Henn',
        'Sitio Web': 'https://www.henn.com.br',
        'LinkedIn Corporativo': 'https://www.linkedin.com/company/moveis-henn/',
        'Pais': 'Brasil',
        'Nicho / Segmento': 'Mobiliario RTA',
        'Canal Preferido': 4029, // LinkedIn
        'Actividad en Redes': 4034, // Alto
        'Estado Comercial': 'Prospecto'
      }, token);
      hennId = newCompany.id;
      console.log(`Created Móveis Henn with ID: ${hennId}`);
    }

    const companyPhone = hennRow && hennRow['WhatsApp'] ? hennRow['WhatsApp'] : '+55 49 3674-3100';

    // 2. Define Jacson Felipe Perin lead
    const lead = {
      nombre: 'Jacson Felipe',
      apellido: 'Perin',
      empresa: 'Móveis Henn',
      empresaId: hennId,
      pais: 'Brasil',
      rol: 'Analista de Marketing na Indústria de Móveis Henn',
      email: 'jacson.perin@henn.com.br',
      phone: companyPhone,
      linkedin: 'https://www.linkedin.com/in/jacson-felipe-perin/',
      descripcion: 'Analista de Marketing na Indústria de Móveis Henn (Mondaí, Santa Catarina) com mais de 13 anos de experiência na empresa. Formado na Universidade do Oeste de Santa Catarina.'
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
      'Status': 4017, // Nuevo
      'Estado CRM': 4021, // Prospecto
      'LinkedIn': lead.linkedin,
      'Facebook': fbSearchUrl,
      'Instagram': igSearchUrl,
      'WhatsApp': waUrl,
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4045, // Inactivo / Moderado
      'Origen': 'Prospección Activa',
      'Descripcion de la idea': lead.descripcion
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: ${lead.nombre} ${lead.apellido} (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
