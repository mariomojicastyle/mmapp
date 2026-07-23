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

    // Crear Empresa 1: Zanzini Móveis
    console.log("Creando empresa 'Zanzini Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Zanzini Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const zanziniId = companyRes1.id;
    console.log("Zanzini Móveis creada con ID:", zanziniId);

    // Crear Empresa 2: Permóbili Móveis
    console.log("Creando empresa 'Permóbili Móveis'...");
    const newCompany2 = {
      "Nombre de la Empresa": "Permóbili Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes2 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany2, token);
    const permobiliId = companyRes2.id;
    console.log("Permóbili Móveis creada con ID:", permobiliId);

    // Crear Empresa 3: Poliman Móveis
    console.log("Creando empresa 'Poliman Móveis'...");
    const newCompany3 = {
      "Nombre de la Empresa": "Poliman Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes3 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany3, token);
    const polimanId = companyRes3.id;
    console.log("Poliman Móveis creada con ID:", polimanId);

    const leads = [
      {
        firstName: "Victor",
        lastName: "Bucci",
        role: "Diretor industrial",
        linkedinUrl: "https://www.linkedin.com/in/victor-bucci-425032140/",
        companyName: "Zanzini Móveis",
        companyId: zanziniId,
        companyDomain: "zanzini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Leandro",
        lastName: "Gomes Da Silva",
        role: "Representante Comercial",
        linkedinUrl: "https://www.linkedin.com/in/leandro-gomes-da-silva-3a04a5a6/",
        companyName: "Zanzini Móveis",
        companyId: zanziniId,
        companyDomain: "zanzini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Lourenço",
        lastName: "Favalessa",
        role: "Supervisor de planejamento",
        linkedinUrl: "https://www.linkedin.com/in/lourenço-modenesi-favalessa-2b51273b8/",
        companyName: "Permóbili Móveis",
        companyId: permobiliId,
        companyDomain: "permobili.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Carmen",
        lastName: "Suarez",
        role: "Gerente de Exportação",
        linkedinUrl: "https://www.linkedin.com/in/carmen-suarez-83599122/",
        companyName: "Poliman Móveis",
        companyId: polimanId,
        companyDomain: "poliman.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Samuel",
        lastName: "Santos",
        role: "Designer de interiores",
        linkedinUrl: "https://www.linkedin.com/in/samuel-santos-4b3417148/",
        companyName: "Poliman Móveis",
        companyId: polimanId,
        companyDomain: "poliman.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
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
