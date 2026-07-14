const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const databaseId = 144;
const leadsTableId = 600; // La tabla de contactos existente (Leads)

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
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Creando la tabla "Empresas" en la base de datos ' + databaseId + '...');
    const tableResponse = await request('POST', `/api/database/tables/database/${databaseId}/`, { name: 'Empresas' }, token);
    const empresasTableId = tableResponse.id;
    console.log(`Tabla "Empresas" creada con ID: ${empresasTableId}`);

    console.log('3. Modificando campo primario por defecto a "Nombre de la Empresa"...');
    const fields = await request('GET', `/api/database/fields/table/${empresasTableId}/`, null, token);
    const primaryField = fields.find(f => f.primary === true);
    if (primaryField) {
      await request('PATCH', `/api/database/fields/${primaryField.id}/`, { name: 'Nombre de la Empresa' }, token);
      console.log('Campo primario renombrado.');
    }

    console.log('4. Creando campo "Sitio Web" (URL)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Sitio Web',
      type: 'url'
    }, token);

    console.log('5. Creando campo "LinkedIn Corporativo" (URL)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'LinkedIn Corporativo',
      type: 'url'
    }, token);

    console.log('6. Creando campo "Pais" (Text)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Pais',
      type: 'text'
    }, token);

    console.log('7. Creando campo "Nicho / Segmento" (Single Select)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Nicho / Segmento',
      type: 'single_select',
      select_options: [
        { value: 'Mobiliario RTA', color: 'blue' },
        { value: 'Oficina', color: 'green' },
        { value: 'Cocinas', color: 'orange' },
        { value: 'Tapizados', color: 'purple' },
        { value: 'Otro', color: 'light-gray' }
      ]
    }, token);

    console.log('8. Creando campo "Dolor Principal" (Single Select)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Dolor Principal',
      type: 'single_select',
      select_options: [
        { value: 'Devoluciones de herrajes', color: 'red' },
        { value: 'R&D lento', color: 'orange' },
        { value: 'Falta de WebAR', color: 'yellow' },
        { value: 'Ninguno', color: 'green' }
      ]
    }, token);

    console.log('9. Creando campo "Estado Comercial" (Single Select)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Estado Comercial',
      type: 'single_select',
      select_options: [
        { value: 'Prospecto', color: 'light-blue' },
        { value: 'Contactado', color: 'blue' },
        { value: 'Demo Agendada', color: 'orange' },
        { value: 'Negociación', color: 'purple' },
        { value: 'Cerrado Ganado', color: 'green' },
        { value: 'Cerrado Perdido', color: 'red' }
      ]
    }, token);

    console.log('10. Creando campo "Notas del Target" (Long Text)...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
      name: 'Notas del Target',
      type: 'long_text'
    }, token);

    console.log('11. Vinculando la tabla Leads (Contactos) con Empresas...');
    const linkField = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Empresa Vinculada',
      type: 'link_row',
      link_row_table_id: empresasTableId,
      has_related_field: true
    }, token);
    console.log('Campo de vinculación relacional "Empresa Vinculada" creado en Leads:', JSON.stringify(linkField, null, 2));

    console.log('\n¡Estructura de CRM B2B creada con éxito!');
    console.log(`Tabla de Empresas ID: ${empresasTableId}`);
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();
