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
      headers: { 'Content-Type': 'application/json' }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = `JWT ${token}`;

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;
    
    const companyId = 67; // Delucci Móveis

    const newLeads = [
      {
        "Nombre": "Cíntia",
        "Apellido": "Weirich",
        "Empresa": "Delucci Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Diretora",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/cintia-weirich-636671101/",
        "Facebook": "https://www.facebook.com/search/top/?q=Cíntia%20Weirich%20Delucci",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Cíntia%20Weirich%20Delucci",
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045, // Inactivo
        "Origen": "Prospección Activa",
        "Email": "cintia.weirich@delucci.com.br"
      },
      {
        "Nombre": "Delucci Móveis",
        "Apellido": "LTDA",
        "Empresa": "Delucci Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Fornecedor Mobiliário Corporativo",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/delucci-móveis-ltda-2aa3643a9/",
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045, // Inactivo
        "Origen": "Prospección Activa",
        "Email": "contato@delucci.com.br"
      }
    ];

    for (const lead of newLeads) {
      console.log(`Insertando a ${lead.Nombre} ${lead.Apellido}...`);
      await request('POST', '/api/database/rows/table/994/?user_field_names=true', lead, token);
      console.log(`${lead.Nombre} insertado exitosamente.`);
    }

  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();
