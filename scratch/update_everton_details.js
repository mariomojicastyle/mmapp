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
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`Request ${method} ${path} failed (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    console.log('Autenticando...');
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    console.log('Actualizando datos de Everton (Fila 33)...');
    
    // URL codificada para busquedas
    const nameStr = encodeURIComponent("Everton Pereira");
    const companyStr = encodeURIComponent("Möbler Móveis");
    
    const updateData = {
      "Notas": "FI - Envie invitacion a L",
      "Email": "everton.pereira@mobler.ind.br",
      "Telefono": "+55 43 3242-8800",
      "Descripcion de la idea": "Gestor comercial e logística en Möbler Móveis. Contacto estratégico de cara a las ventas y distribución.",
      "Facebook": `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`,
      "Instagram": `https://www.google.com/search?q=site%3Ainstagram.com%20%22Everton%20Pereira%22%20%22M%C3%B6bler%20M%C3%B3veis%22`,
      "WhatsApp": "https://wa.me/5543999346415",
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo por default
    };

    await request('PATCH', '/api/database/rows/table/994/33/?user_field_names=true', updateData, token);
    console.log('Fila 33 actualizada con éxito.');
  } catch (err) {
    console.error(err);
  }
}

run();
