const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

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
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = `JWT ${token}`;

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body ? JSON.parse(body) : {}));
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Colibri Móveis
    console.log("Creando empresa 'Colibri Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Colibri Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const colibriId = companyRes1.id;
    console.log("Colibri Móveis creada con ID:", colibriId);

    // Crear Empresa: Unicasa Indústria de Móveis S.A.
    console.log("Creando empresa 'Unicasa Indústria de Móveis S.A.'...");
    const newCompany2 = {
      "Nombre de la Empresa": "Unicasa Indústria de Móveis S.A.",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes2 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany2, token);
    const unicasaId = companyRes2.id;
    console.log("Unicasa creada con ID:", unicasaId);

    // Crear Empresa: Industria De Móveis Bartira Ltda
    console.log("Creando empresa 'Industria De Móveis Bartira Ltda'...");
    const newCompany3 = {
      "Nombre de la Empresa": "Industria De Móveis Bartira Ltda",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes3 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany3, token);
    const bartiraId = companyRes3.id;
    console.log("Bartira creada con ID:", bartiraId);

    // Crear Empresa: GRUPO K1 S.A.
    console.log("Creando empresa 'GRUPO K1 S.A.'...");
    const newCompany4 = {
      "Nombre de la Empresa": "GRUPO K1 S.A.",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes4 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany4, token);
    const k1Id = companyRes4.id;
    console.log("GRUPO K1 S.A. creada con ID:", k1Id);

    const leads = [
      {
        firstName: "Rodrigo Vinícius",
        lastName: "Crotti",
        role: "Analista de suprimentos",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-vinícius-crotti-5193253a9/",
        companyName: "Colibri Móveis",
        companyId: colibriId,
        companyDomain: "colibrimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rodrigo",
        lastName: "Lazzari",
        role: "Projetista | Designer de Produto",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-lazzari-74096a249/",
        companyName: "Unicasa Indústria de Móveis S.A.",
        companyId: unicasaId,
        companyDomain: "unicasamoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Eduardo Alex",
        lastName: "Caparroz",
        role: "Gerente de Produção",
        linkedinUrl: "https://www.linkedin.com/in/eduardo-alex-caparroz/",
        companyName: "Industria De Móveis Bartira Ltda",
        companyId: bartiraId,
        companyDomain: "bartira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Daniel",
        lastName: "Sales",
        role: "Head da divisão de Planejados",
        linkedinUrl: "https://www.linkedin.com/in/daniel-sales-32005669/",
        companyName: "GRUPO K1 S.A.",
        companyId: k1Id,
        companyDomain: "grupok1.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Thomas",
        lastName: "Berardi",
        role: "Head of Sales e Project Manager",
        linkedinUrl: "https://www.linkedin.com/in/thomasberardi/",
        companyName: "GRUPO K1 S.A.",
        companyId: k1Id,
        companyDomain: "grupok1.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Italia"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
