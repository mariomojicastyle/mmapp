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

    console.log("Creando empresa 'Casa Aberta Brasil'...");
    const newCompany = {
      "Nombre de la Empresa": "Casa Aberta Brasil",
      "Pais": "Brasil",
      "Notas del Target": "Ecommerce de móveis fundado por Larissa Angonese (ex Notável).",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
    const companyId = companyRes.id;
    console.log("Empresa creada con ID:", companyId);

    console.log("Actualizando a Larissa (ID: 3)...");
    
    const nameStr = encodeURIComponent("Larissa Angonese");
    const companyStr = encodeURIComponent("Casa Aberta Brasil");

    const updateData = {
      "Empresa": "Casa Aberta Brasil",
      "Empresa Vinculada": [companyId],
      "Rol": "Diretora Executiva",
      "LinkedIn": "https://www.linkedin.com/in/larissa-s-angonese-53b54a25/",
      "Descripcion de la idea": "Fundadora y Diretora Executiva na Casa Aberta Brasil (Ecommerce de móveis). Ex-Gerente de Notável Móveis.",
      "Email": "larissa@casaabertabrasil.com.br", // Inferido
      "Facebook": `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`,
      "Instagram": `https://www.google.com/search?q=site%3Ainstagram.com%20%22Larissa%20Angonese%22%20%22Casa%20Aberta%20Brasil%22`,
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4043 // Muy Activo (como estaba antes)
    };

    await request('PATCH', '/api/database/rows/table/994/3/?user_field_names=true', updateData, token);
    console.log("Perfil de Larissa actualizado exitosamente.");

  } catch (e) {
    console.error("Error:", e);
  }
}

run();
