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

    // Crear Empresa: Santos Andirá
    console.log("Creando empresa 'Santos Andirá Industria de Moveis Ltda'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Santos Andirá Industria de Moveis Ltda",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const andiraId = companyRes1.id;
    console.log("Santos Andirá creada con ID:", andiraId);

    const leads = [
      {
        firstName: "Cassia Paiva",
        lastName: "Vieira Andrade",
        role: "Diretora Industrial | Supply Chain | Manufatura",
        linkedinUrl: "https://www.linkedin.com/in/cassia-paiva-vieira-andrade-90967b125/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Dhiego",
        lastName: "Marques",
        role: "Coordenador de Produção",
        linkedinUrl: "https://www.linkedin.com/in/dhiego-marques-8802b3364/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Laís Fernanda",
        lastName: "Avanci",
        role: "Gerente de Recursos Humanos",
        linkedinUrl: "https://www.linkedin.com/in/lais-fernanda-avanci-b02bab27/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rafael",
        lastName: "Viola",
        role: "Vendedor - Representante",
        linkedinUrl: "https://www.linkedin.com/in/rafael-viola-b0906b291/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Antonio Carlos",
        lastName: "Oliveira - Verdao",
        role: "Consultor de vendas",
        linkedinUrl: "https://www.linkedin.com/in/antonio-carlos-oliveira-verdao-3b008279/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
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
