const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
const contactosTableId = 994;

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
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    // 2. Buscar si la empresa "Mobler Moveis" existe
    console.log('2. Buscando si la empresa "Mobler Moveis" ya existe en el CRM...');
    const searchUrl = `/api/database/rows/table/${empresasTableId}/?user_field_names=true&search=Mobler`;
    const searchResponse = await request('GET', searchUrl, null, token);
    
    let companyRowId;
    const existingCompany = searchResponse.results.find(row => 
      row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('mobler')
    );

    if (existingCompany) {
      companyRowId = existingCompany.id;
      console.log(`Empresa encontrada: "${existingCompany['Nombre de la Empresa']}" (Fila ID: ${companyRowId})`);
    } else {
      console.log('La empresa no existe. Creando "Mobler Moveis"...');
      const companyPayload = {
        "Nombre de la Empresa": "Mobler Moveis",
        "Sitio Web": "https://moblermoveis.com.br", // URL tentativa o dejar vacío.
        "Pais": "Brasil",
        "Nicho / Segmento": "Oficina",
        "Estado Comercial": "Prospecto",
        "Notas del Target": "Fabricante de mobiliario ergonómico y corporativo en Brasil (Arapongas, PR). Identificados por prospección en LinkedIn."
      };
      const newCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, companyPayload, token);
      companyRowId = newCompany.id;
      console.log(`Empresa creada: "Mobler Moveis" (Fila ID: ${companyRowId})`);
    }

    // 3. Crear los contactos
    console.log('3. Creando contactos vinculados...');
    const contacts = [
      {
        "Nombre": "Cesar",
        "Apellido": "Moresca",
        "Rol": "Gerente Geral",
        "LinkedIn": "https://www.linkedin.com/in/cesar-moresca-b9874671/",
        "Estado CRM": "Prospecto",
        "Empresa Vinculada": [companyRowId]
      },
      {
        "Nombre": "Ana Cláudia",
        "Apellido": "Rocha",
        "Rol": "Consultora comercial",
        "LinkedIn": "https://www.linkedin.com/in/ana-claudia-rocha-271066123/",
        "Estado CRM": "Prospecto",
        "Empresa Vinculada": [companyRowId]
      }
    ];

    for (const contact of contacts) {
      try {
        const checkUrl = `/api/database/rows/table/${contactosTableId}/?user_field_names=true&search=${contact.Apellido}`;
        const checkRes = await request('GET', checkUrl, null, token);
        const exists = checkRes.results.some(row => row['Nombre'] === contact.Nombre && row['Apellido'] === contact.Apellido);
        
        if (exists) {
          console.log(`   El contacto ${contact.Nombre} ${contact.Apellido} ya existe. Saltando.`);
        } else {
          const res = await request('POST', `/api/database/rows/table/${contactosTableId}/?user_field_names=true`, contact, token);
          console.log(`   Contacto creado: ${contact.Nombre} ${contact.Apellido} (Fila ID: ${res.id})`);
        }
      } catch (err) {
        console.error(`   Error al procesar contacto ${contact.Nombre} ${contact.Apellido}:`, err.message);
      }
    }

    console.log('\n¡Proceso de inserción finalizado!');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();
