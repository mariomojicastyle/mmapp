const https = require('https');
const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const leadsTableId = 994;
const leadId = 273; // ID de Juan Carlos Pérez Londoño en la Tabla 994

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
          reject(new Error(`HTTP ${res.statusCode} en ${path}: ${responseBody}`));
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
    console.log('1. Autenticando en Baserow...');
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    console.log(`2. Actualizando datos de Juan Carlos Pérez (ID: ${leadId})...`);
    
    const updateData = {
      "Email": "juan.perez@rta.com.co",
      "Status": 4018,       // Contactado
      "Estado CRM": 4022,   // Primer Contacto
      "Notas": "Solicitó hoja de vida por correo. Fuera del país por 15 días, agendar charla a su regreso."
    };

    const updatedLead = await request('PATCH', `/api/database/rows/table/${leadsTableId}/${leadId}/?user_field_names=true`, updateData, token);
    
    console.log('\n========================================');
    console.log('🎉 Lead actualizado con éxito en Baserow!');
    console.log(`ID del Lead: ${updatedLead.id}`);
    console.log(`Email Guardado: ${updatedLead.Email}`);
    console.log(`Status del CRM: ${updatedLead.Status?.value || updatedLead.Status} (Contactado)`);
    console.log(`Estado del CRM: ${updatedLead['Estado CRM']?.value || updatedLead['Estado CRM']} (Primer Contacto)`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

run();
