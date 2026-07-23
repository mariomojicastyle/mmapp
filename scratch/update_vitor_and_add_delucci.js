const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

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
    console.log('1. Autenticando...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;

    // 1. Insert Company Delucci Móveis (Table 991)
    const companyData = {
      "Nombre de la Empresa": "Delucci Móveis",
      "LinkedIn Corporativo": "https://www.linkedin.com/company/delucci/",
      "Pais": "Brasil",
      "Canal Preferido": 4029, // LinkedIn
      "Actividad en Redes": 4033, // Muy Activo
    };
    
    console.log('2. Comprobando Delucci Móveis...');
    const searchCo = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Delucci', null, token);
    let companyId;
    if (searchCo.count > 0) {
      companyId = searchCo.results[0].id;
      console.log('   Delucci Móveis ya existe con ID:', companyId);
    } else {
      const newCo = await request('POST', '/api/database/rows/table/991/?user_field_names=true', companyData, token);
      companyId = newCo.id;
      console.log('   Delucci Móveis creada con ID:', companyId);
    }

    // 2. Update Vitor Machado (ID 39) in table 994
    const vitorUpdate = {
      "Empresa": "Delucci Móveis",
      "Empresa Vinculada": [companyId],
      "Rol": "Projetista e Analista de Engenharia"
    };
    console.log('3. Actualizando a Vitor Machado...');
    await request('PATCH', '/api/database/rows/table/994/39/?user_field_names=true', vitorUpdate, token);
    console.log('   Vitor Machado actualizado.');

    // 3. Insert new leads
    const newLeads = [
      {
        "Nombre": "Vanessa",
        "Apellido": "Guindani",
        "Empresa": "Delucci Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Gerente de Marketing",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/vanessa-guindani-b7386969/",
        "Facebook": "https://www.facebook.com/search/top/?q=Vanessa%20Guindani%20Delucci",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Vanessa%20Guindani%20Delucci",
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045, // Inactivo
        "Origen": "Prospección Activa"
      },
      {
        "Nombre": "Kelwin",
        "Apellido": "Pawlak",
        "Empresa": "Delucci Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Projetista Industrial e de Produto",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/kelwin-pawlak-b1627915b/",
        "Facebook": "https://www.facebook.com/search/top/?q=Kelwin%20Pawlak%20Delucci",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Kelwin%20Pawlak%20Delucci",
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045, // Inactivo
        "Origen": "Prospección Activa"
      },
      {
        "Nombre": "Alon Gabriel",
        "Apellido": "Leal da Silva",
        "Empresa": "Delucci Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Comprador",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/alon-gabriel-leal-da-silva-32b045232/",
        "Facebook": "https://www.facebook.com/search/top/?q=Alon%20Gabriel%20Leal%20da%20Silva%20Delucci",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Alon%20Gabriel%20Leal%20da%20Silva%20Delucci",
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045, // Inactivo
        "Origen": "Prospección Activa"
      }
    ];

    console.log('4. Insertando nuevos colegas de Delucci Móveis...');
    for (const lead of newLeads) {
      // Deducción básica de email corporativo
      lead.Email = `${lead.Nombre.toLowerCase().split(' ')[0]}.${lead.Apellido.toLowerCase().split(' ')[0]}@delucci.com.br`;
      try {
        await request('POST', '/api/database/rows/table/994/?user_field_names=true', lead, token);
        console.log(`   ${lead.Nombre} ${lead.Apellido} insertado con éxito.`);
      } catch (err) {
        console.log(`   Error insertando a ${lead.Nombre}: ${err.message}`);
      }
    }
    
    console.log('¡Proceso completado exitosamente!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
