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

async function main() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const updatePayload = {
      "Email": "marcelopiriz2507@gmail.com",
      "Status": 4019,     // Agendado
      "Estado CRM": 4023, // Demo Agendada
      "Notas": "Demo 3D agendada para el Martes 11 de Agosto, 2026 a las 10:30 BRT (8:30 COT). Referido por Sr. Pedro de AKEO a través de Atilio."
    };

    console.log("Actualizando Marcelo Piriz (ID 260) en Baserow...");
    const response = await request('PATCH', '/api/database/rows/table/994/260/?user_field_names=true', updatePayload, token);
    console.log("✅ Registro actualizado en Baserow CRM! Status: Agendado / Demo Agendada");
  } catch (err) {
    console.error("❌ Error al actualizar lead:", err);
  }
}

main();
