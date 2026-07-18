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

    // 1. Eliminar filas 28 y 29
    console.log('Eliminando filas 28 y 29...');
    try {
      await request('POST', '/api/database/rows/table/994/batch-delete/', { items: [28, 29] }, token);
      console.log('Filas 28 y 29 eliminadas.');
    } catch(e) {
      console.log('Error al eliminar filas (posiblemente ya no existan): ' + e.message);
    }

    // 2. Agregar a Everton Pereira
    console.log('Agregando a Everton Pereira...');
    const newLead = {
      "Nombre": "Everton",
      "Apellido": "Pereira",
      "Empresa": "Möbler Móveis",
      "Empresa Vinculada": [32],
      "Pais": "Brasil",
      "Rol": "Gestor comercial e logistica",
      "Status": 4017,
      "Estado CRM": 4021,
      "LinkedIn": "https://www.linkedin.com/in/everton-pereira-9503039a/",
      "Origen": "Prospección Activa"
    };
    await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLead, token);
    console.log('Lead agregado con éxito.');

    // 3. Reordenar campos en vista 4355 (Empresa después de Apellido)
    console.log('Reordenando campos en vista...');
    const optsRes = await request('GET', '/api/database/views/4355/field-options/', null, token);
    const options = optsRes.field_options;
    
    // Sort fields by their current order
    let arr = Object.keys(options).map(id => ({ id, order: options[id].order }));
    arr.sort((a, b) => a.order - b.order);
    
    // Move 9529 (Empresa) after 9527 (Apellido)
    const empresaIndex = arr.findIndex(f => f.id == 9529);
    if(empresaIndex > -1) {
      const empresaItem = arr.splice(empresaIndex, 1)[0];
      const apellidoIndex = arr.findIndex(f => f.id == 9527);
      if(apellidoIndex > -1) {
        arr.splice(apellidoIndex + 1, 0, empresaItem);
      }
    }
    
    // Assign new orders
    const newFieldOptions = {};
    arr.forEach((item, index) => {
      newFieldOptions[item.id] = { order: index };
    });
    
    await request('PATCH', '/api/database/views/4355/field-options/', { field_options: newFieldOptions }, token);
    console.log('Vista actualizada.');

  } catch (err) {
    console.error(err);
  }
}

run();
