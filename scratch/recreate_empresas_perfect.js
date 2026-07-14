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

const tier2Companies = [
  {
    "Nombre de la Empresa": "Colibri Móveis",
    "Sitio Web": "https://www.colibrimoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Especialistas en paneles de TV y home theater."
  },
  {
    "Nombre de la Empresa": "Móveis Notável",
    "Sitio Web": "https://www.notavel.ind.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Ampére (PR). Fuerte presencia en retail físico."
  },
  {
    "Nombre de la Empresa": "Móveis Rufato",
    "Sitio Web": "https://www.moveisrufato.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Ubá (MG). Especializados en dormitorios y comedores."
  },
  {
    "Nombre de la Empresa": "Dj Móveis",
    "Sitio Web": "https://www.djmoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Líder en mesas de comedor y salas de entretenimiento."
  },
  {
    "Nombre de la Empresa": "Telasul",
    "Sitio Web": "https://www.telasul.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Cocinas",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 de Garibaldi (RS). Cocinas de acero y modulares de madera."
  },
  {
    "Nombre de la Empresa": "Ditália Móveis",
    "Sitio Web": "https://www.ditalia.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 de Bento Gonçalves (RS). Muebles RTA de gama media-alta y diseño premium."
  },
  {
    "Nombre de la Empresa": "Móveis Albatroz",
    "Sitio Web": "https://www.moveisalbatroz.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Arapongas (PR). Dormitorios y armarios de organización multiuso."
  },
  {
    "Nombre de la Empresa": "BRV Móveis",
    "Sitio Web": "https://www.brvmoveis.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Oficina",
    "Dolor Principal": "Ninguno",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante Tier 2 RTA de Bento Gonçalves (RS). Fuerte orientación a oficinas en casa y exportación."
  },
  {
    "Nombre de la Empresa": "Tecno Mobili",
    "Sitio Web": "https://www.tecnomobili.ind.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Oficina",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Marca de e-commerce de Móveis Videira (RS). Especialistas en home office RTA."
  },
  {
    "Nombre de la Empresa": "Artely",
    "Sitio Web": "https://www.artely.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Ninguno",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Curitiba (PR). Líder nacional en complementos RTA (mesas de centro, consolas)."
  },
  {
    "Nombre de la Empresa": "Móveis Bechara",
    "Sitio Web": "https://www.moveisbechara.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Tanabi (SP). Especialistas en racks de TV y estanterías RTA."
  },
  {
    "Nombre de la Empresa": "Zanzini Móveis",
    "Sitio Web": "https://www.zanzini.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "R&D lento",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Dois Córregos (SP). Muebles funcionales RTA bajo procesos eco-responsables."
  },
  {
    "Nombre de la Empresa": "Permóbili",
    "Sitio Web": "https://www.permobili.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Linhares (ES). Paneles de TV, buffets y cómodas."
  },
  {
    "Nombre de la Empresa": "Poliman Móveis",
    "Sitio Web": "https://www.poliman.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Cocinas",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Arapongas (PR). Cocinas modulares RTA de alta rotación comercial."
  },
  {
    "Nombre de la Empresa": "Imcal Móveis",
    "Sitio Web": "https://www.imcal.com.br",
    "Pais": "Brasil",
    "Nicho / Segmento": "Mobiliario RTA",
    "Dolor Principal": "Falta de WebAR",
    "Estado Comercial": "Prospecto",
    "Notas del Target": "Fabricante de Bento Gonçalves (RS). Racks y salas de estar con patas de madera de estilo retro."
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Obteniendo lista de tablas para encontrar la ID de la tabla "Empresas" actual...');
    const tables = await request('GET', `/api/database/tables/database/${databaseId}/`, null, token);
    const oldTable = tables.find(t => t.name === 'Empresas');
    if (oldTable) {
      console.log(`Eliminando tabla antigua "Empresas" (ID: ${oldTable.id})...`);
      await request('DELETE', `/api/database/tables/${oldTable.id}/`, null, token);
      console.log('Tabla antigua eliminada.');
    }

    console.log('3. Creando nueva tabla "Empresas"...');
    const tableResponse = await request('POST', `/api/database/tables/database/${databaseId}/`, { name: 'Empresas' }, token);
    const empresasTableId = tableResponse.id;
    console.log(`Nueva tabla "Empresas" creada con ID: ${empresasTableId}`);

    console.log('4. Modificando campo primario por defecto a "Nombre de la Empresa"...');
    const fields = await request('GET', `/api/database/fields/table/${empresasTableId}/`, null, token);
    const primaryField = fields.find(f => f.primary === true);
    if (primaryField) {
      await request('PATCH', `/api/database/fields/${primaryField.id}/`, { name: 'Nombre de la Empresa' }, token);
      console.log('Campo primario renombrado.');
    }

    console.log('5. Creando campos en la tabla Empresas...');
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, { name: 'Sitio Web', type: 'url' }, token);
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, { name: 'LinkedIn Corporativo', type: 'url' }, token);
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, { name: 'Pais', type: 'text' }, token);
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
    await request('POST', `/api/database/fields/table/${empresasTableId}/`, { name: 'Notas del Target', type: 'long_text' }, token);

    console.log('6. Vinculando tabla de Leads (Contactos) a la nueva tabla de Empresas...');
    const leadsFields = await request('GET', `/api/database/fields/table/${leadsTableId}/`, null, token);
    const oldLinkField = leadsFields.find(f => f.name === 'Empresa Vinculada');
    if (oldLinkField) {
      console.log(`Eliminando campo antiguo de vinculación en Leads (ID: ${oldLinkField.id})...`);
      await request('DELETE', `/api/database/fields/${oldLinkField.id}/`, null, token);
    }

    const linkField = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Empresa Vinculada',
      type: 'link_row',
      link_row_table_id: empresasTableId,
      has_related_field: true
    }, token);
    console.log(`Nueva relación creada con ID: ${linkField.id}`);

    console.log('7. Obteniendo las filas predeterminadas (semilla) creadas automáticamente por Baserow...');
    const defaultRowsResponse = await request('GET', `/api/database/rows/table/${empresasTableId}/`, null, token);
    const defaultRows = defaultRowsResponse.results || [];
    console.log(`Se detectaron ${defaultRows.length} filas predeterminadas.`);

    console.log('8. Inyectando/Actualizando las empresas para que las IDs comiencen exactamente en 1...');
    for (let i = 0; i < tier2Companies.length; i++) {
      const company = tier2Companies[i];
      const payload = {
        "Nombre de la Empresa": company["Nombre de la Empresa"],
        "Sitio Web": company["Sitio Web"],
        "Pais": company["Pais"],
        "Nicho / Segmento": company["Nicho / Segmento"],
        "Dolor Principal": company["Dolor Principal"],
        "Estado Comercial": company["Estado Comercial"],
        "Notas del Target": company["Notas del Target"]
      };

      // Si hay una fila predeterminada en este índice, la actualizamos (PATCH) para conservar la ID
      if (i < defaultRows.length) {
        const rowId = defaultRows[i].id;
        console.log(`   Actualizando fila predeterminada ID ${rowId} ➔ ${company["Nombre de la Empresa"]}`);
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${rowId}/?user_field_names=true`, payload, token);
      } else {
        // Si ya no quedan filas predeterminadas, insertamos normalmente (POST)
        const response = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, payload, token);
        console.log(`   Inyectando nueva fila ID ${response.id} ➔ ${company["Nombre de la Empresa"]}`);
      }
    }

    console.log(`\n¡Éxito total! Tabla de Empresas creada y ordenada desde la ID 1 hasta la 15.`);
    console.log(`Nueva ID de Tabla: ${empresasTableId}`);
  } catch (error) {
    console.error('Error durante la ejecución del script:', error.message);
  }
}

run();
