const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const databaseId = 144;
const leadsTableId = 600;

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
          resolve(JSON.parse(responseBody));
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

    console.log('2. Creando la tabla "Interacciones" en la base de datos ' + databaseId + '...');
    const tableResponse = await request('POST', `/api/database/tables/database/${databaseId}/`, { name: 'Interacciones' }, token);
    const interaccionesTableId = tableResponse.id;
    console.log(`Tabla "Interacciones" creada con ID: ${interaccionesTableId}`);

    console.log('3. Consultando campos creados por defecto...');
    const fields = await request('GET', `/api/database/fields/table/${interaccionesTableId}/`, null, token);
    console.log('Campos iniciales:', JSON.stringify(fields, null, 2));

    // El primer campo por defecto suele ser 'Name' (primary). Lo renombraremos a 'Asunto'.
    const primaryField = fields.find(f => f.primary === true);
    if (primaryField) {
      console.log(`Renombrando el campo primario "${primaryField.name}" (ID: ${primaryField.id}) a "Asunto"...`);
      await request('PATCH', `/api/database/fields/${primaryField.id}/`, { name: 'Asunto' }, token);
      console.log('Campo primario renombrado.');
    } else {
      // Si no hay primario, creamos Asunto
      console.log('Creando campo "Asunto"...');
      await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, { name: 'Asunto', type: 'text' }, token);
    }

    console.log('4. Creando campo "Lead" (Link a la tabla Leads)...');
    const leadField = await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, {
      name: 'Lead',
      type: 'link_row',
      link_row_table_id: leadsTableId,
      has_related_field: true
    }, token);
    console.log('Campo "Lead" creado:', JSON.stringify(leadField, null, 2));

    console.log('5. Creando campo "Cuerpo" (Long Text)...');
    const cuerpoField = await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, {
      name: 'Cuerpo',
      type: 'long_text'
    }, token);
    console.log('Campo "Cuerpo" creado:', JSON.stringify(cuerpoField, null, 2));

    console.log('6. Creando campo "Direccion" (Single Select)...');
    const direccionField = await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, {
      name: 'Direccion',
      type: 'single_select',
      select_options: [
        { value: 'Entrante', color: 'blue' },
        { value: 'Saliente', color: 'green' }
      ]
    }, token);
    console.log('Campo "Direccion" creado:', JSON.stringify(direccionField, null, 2));

    console.log('\n¡Proceso finalizado con éxito!');
    console.log(`Tabla de Interacciones ID: ${interaccionesTableId}`);
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();
