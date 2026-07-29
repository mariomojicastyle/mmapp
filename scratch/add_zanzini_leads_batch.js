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
    
    // 1. Search for Zanzini Móveis in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let zanziniRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('zanzini'));
    
    let zanziniId;
    if (zanziniRow) {
      zanziniId = zanziniRow.id;
      console.log(`Found Zanzini Móveis in table 991 with ID: ${zanziniId}`);
    } else {
      console.log('Zanzini Móveis not found in table 991, creating it...');
      const newCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
        'Nombre de la Empresa': 'Zanzini Móveis',
        'Sitio Web': 'https://www.zanzini.com.br',
        'LinkedIn Corporativo': 'https://www.linkedin.com/company/zanzini-moveis/',
        'Pais': 'Brasil',
        'Nicho / Segmento': 'Mobiliario RTA',
        'Canal Preferido': 4029, // LinkedIn
        'Actividad en Redes': 4034, // Moderado
        'Estado Comercial': 'Prospecto'
      }, token);
      zanziniId = newCompany.id;
      console.log(`Created Zanzini Móveis with ID: ${zanziniId}`);
    }

    const companyPhone = zanziniRow && zanziniRow['WhatsApp'] ? zanziniRow['WhatsApp'] : '+55 14 3652-9900';

    // 2. Define the 3 leads from the screenshots
    const leadsToInsert = [
      {
        nombre: 'Murillo',
        apellido: 'Roma',
        empresa: 'Zanzini Móveis',
        empresaId: zanziniId,
        pais: 'Brasil',
        rol: 'Compras | Supply Chain | Strategic Sourcing | Gestão de Fornecedores',
        email: 'murilloromadci@hotmail.com',
        phone: companyPhone,
        linkedin: 'https://www.linkedin.com/in/murillo-roma-73a8819b/',
        descripcion: 'Engenheiro de Produção e comprador / especialista em Supply Chain & Gestão de Fornecedores na Zanzini Móveis.'
      },
      {
        nombre: 'Vitória',
        apellido: 'Masiero Faxina',
        empresa: 'Zanzini Móveis',
        empresaId: zanziniId,
        pais: 'Brasil',
        rol: 'Inspetora de qualidade',
        email: 'vitoria.faxina@zanzini.com.br',
        phone: companyPhone,
        linkedin: 'https://www.linkedin.com/in/vit%C3%B3ria-masiero-faxina-0774243a5/',
        descripcion: 'Inspetora de Qualidade na Zanzini Móveis (Dois Córregos, San Pablo).'
      },
      {
        nombre: 'Marcos Roberto',
        apellido: 'Correa da Rocha',
        empresa: 'Zanzini Móveis',
        empresaId: zanziniId,
        pais: 'Brasil',
        rol: 'Supervisor de Produção Corte',
        email: 'marcos.rocha@zanzini.com.br',
        phone: companyPhone,
        linkedin: 'https://www.linkedin.com/in/marcos-roberto-correa-da-rocha-30b288218/',
        descripcion: 'Supervisor de Produção e Corte na Zanzini Móveis (Dois Córregos, San Pablo).'
      }
    ];

    // 3. Insert each lead into table 994
    for (const lead of leadsToInsert) {
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
        'Actividad en Redes': 4045, // Inactivo
        'Origen': 'Prospección Activa',
        'Descripcion de la idea': lead.descripcion
      };

      const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, leadPayload, token);
      console.log(`✅ Injected Lead: ${lead.nombre} ${lead.apellido} (ID: ${createdLead.id})`);
    }

    console.log('🎉 All 3 leads successfully inserted into Baserow CRM!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
