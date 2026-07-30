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
    
    // 1. Search for Sodimac / Homecenter in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let sodimacRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && (row['Nombre de la Empresa'].toLowerCase().includes('sodimac') || row['Nombre de la Empresa'].toLowerCase().includes('homecenter')));
    
    let sodimacId;
    if (sodimacRow) {
      sodimacId = sodimacRow.id;
      console.log(`Found Sodimac Colombia in table 991 with ID: ${sodimacId}`);
    } else {
      console.log('Sodimac Colombia not found in table 991, creating it...');
      const newCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
        'Nombre de la Empresa': 'Sodimac Colombia / Homecenter',
        'Sitio Web': 'https://www.homecenter.com.co',
        'LinkedIn Corporativo': 'https://www.linkedin.com/company/sodimac-colombia/',
        'Pais': 'Colombia',
        'Nicho / Segmento': 'Retail / Mobiliario RTA',
        'Canal Preferido': 4029, // LinkedIn
        'Actividad en Redes': 4034, // Alto
        'Estado Comercial': 'En Contacto'
      }, token);
      sodimacId = newCompany.id;
      console.log(`Created Sodimac Colombia with ID: ${sodimacId}`);
    }

    const companyPhone = '+57 1 3077115';

    // 2. Define Jorge Villafañe lead
    const lead = {
      nombre: 'Jorge',
      apellido: 'Villafañe',
      empresa: 'Sodimac Colombia / Homecenter',
      empresaId: sodimacId,
      pais: 'Colombia / México',
      rol: 'Marketing & Communications Manager | Brand Strategy & Retail',
      email: 'jorge.villafane@sodimac.com.co',
      phone: companyPhone,
      linkedin: 'https://www.linkedin.com/in/jorgevillafane/',
      descripcion: 'Marketing & Communications Manager con 11+ años de experiencia en Retail, Brand Strategy y ESG en Sodimac Colombia / Homecenter. Coincidimos en post de sostenibilidad Ecobot.'
    };

    const fbSearchUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(lead.nombre + ' ' + lead.apellido + ' Sodimac')}`;
    const igSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent((lead.nombre + lead.apellido).toLowerCase().replace(/[^a-z0-9]/g, ''))}/`;
    const waUrl = `https://wa.me/573077115`;

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
      'Estado CRM': 4022, // Contactado
      'LinkedIn': lead.linkedin,
      'Facebook': fbSearchUrl,
      'Instagram': igSearchUrl,
      'WhatsApp': waUrl,
      'Canal Preferido': 4037, // LinkedIn
      'Actividad en Redes': 4044, // Activo
      'Origen': 'Comentarios LinkedIn Sostenibilidad',
      'Descripcion de la idea': lead.descripcion
    };

    const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
    console.log(`✅ Injected Lead: ${lead.nombre} ${lead.apellido} (ID: ${createdLead.id}) into Baserow CRM!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
