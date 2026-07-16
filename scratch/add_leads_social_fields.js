const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 994; // Tabla Leads
const viewId = 4355; // ID de la vista de cuadrícula de Leads

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

    console.log('2. Creando columna "LinkedIn" (tipo URL)...');
    const linkedInField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'LinkedIn',
      type: 'url'
    }, token);
    console.log(`Columna "LinkedIn" creada con ID: ${linkedInField.id}`);

    console.log('3. Creando columna "Facebook" (tipo URL)...');
    const facebookField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Facebook',
      type: 'url'
    }, token);
    console.log(`Columna "Facebook" creada con ID: ${facebookField.id}`);

    console.log('4. Creando columna "Instagram" (tipo URL)...');
    const instagramField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Instagram',
      type: 'url'
    }, token);
    console.log(`Columna "Instagram" creada con ID: ${instagramField.id}`);

    console.log('5. Creando columna "WhatsApp" (tipo URL)...');
    const whatsappField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'WhatsApp',
      type: 'url'
    }, token);
    console.log(`Columna "WhatsApp" creada con ID: ${whatsappField.id}`);

    console.log('6. Creando columna "Canal Preferido" (tipo Selección Única)...');
    const canalField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Canal Preferido',
      type: 'single_select',
      select_options: [
        { value: 'LinkedIn', color: 'blue' },
        { value: 'Instagram', color: 'pink' },
        { value: 'Facebook', color: 'light-blue' },
        { value: 'WhatsApp', color: 'green' },
        { value: 'Correo', color: 'light-gray' },
        { value: 'Teléfono', color: 'dark-gray' }
      ]
    }, token);
    console.log(`Columna "Canal Preferido" creada con ID: ${canalField.id}`);

    console.log('7. Creando columna "Actividad en Redes" (tipo Selección Única)...');
    const actividadField = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Actividad en Redes',
      type: 'single_select',
      select_options: [
        { value: 'Muy Activo', color: 'green' },
        { value: 'Moderado', color: 'orange' },
        { value: 'Inactivo', color: 'red' }
      ]
    }, token);
    console.log(`Columna "Actividad en Redes" creada con ID: ${actividadField.id}`);

    console.log('8. Consultando todos los campos para estructurar el ordenamiento...');
    const fields = await request('GET', `/api/database/fields/table/${tableId}/`, null, token);
    
    // Mapear los campos actuales a sus respectivos IDs
    const fieldMap = {};
    fields.forEach(f => {
      fieldMap[f.name] = f.id;
    });

    console.log('9. Reordenando las columnas en la vista...');
    
    // Estructura de ordenamiento lógico de las columnas
    const orderSequence = [
      "Nombre",
      "Apellido",
      "Notas",
      "Activo",
      "Email",
      "Telefono",
      "LinkedIn",
      "Facebook",
      "Instagram",
      "WhatsApp",
      "Canal Preferido",
      "Actividad en Redes",
      "Empresa",
      "Pais",
      "Rol",
      "Interes",
      "Status",
      "Origen",
      "Descripcion de la idea",
      "Estado CRM",
      "Interacciones",
      "Empresa Vinculada"
    ];

    const fieldOptionsPayload = {
      field_options: {}
    };

    orderSequence.forEach((name, index) => {
      const id = fieldMap[name];
      if (id) {
        fieldOptionsPayload.field_options[id.toString()] = { "order": index };
      }
    });

    await request('PATCH', `/api/database/views/${viewId}/field-options/`, fieldOptionsPayload, token);
    console.log('¡Columnas reordenadas con éxito en la vista de cuadrícula de Leads!');

  } catch (error) {
    console.error('Error durante la ejecución del script:', error.message);
  }
}

run();
