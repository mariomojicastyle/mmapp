const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const databaseId = 144;
const empresasTableId = 991; // ID de la tabla de empresas recreada en el paso anterior

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

const keyContacts = [
  {
    "Nombre": "José Lopes",
    "Apellido": "Aquino",
    "Email": "diretoria@colibrimoveis.com.br",
    "Telefono": "+55 43 3275-8100",
    "Rol": "CEO / Diretor Presidente",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Colibri Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Contacto clave. CEO de Colibri Móveis y líder del Sindicato de Industrias del Mueble de Arapongas (SIMA).",
    "Empresa Vinculada": [1] // Vinculado a Colibri Móveis (ID: 1)
  },
  {
    "Nombre": "Guilherme",
    "Apellido": "Pitta Lopes Aquino",
    "Email": "operacoes@colibrimoveis.com.br",
    "Telefono": "+55 43 3275-8100",
    "Rol": "Diretor de Operações",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Colibri Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director de Operaciones y sucesor clave en Colibri Móveis.",
    "Empresa Vinculada": [1] // Vinculado a Colibri Móveis (ID: 1)
  },
  {
    "Nombre": "Larissa",
    "Apellido": "Schikovski Angonese",
    "Email": "marketing@notavel.ind.br",
    "Telefono": "+55 46 3541-1200",
    "Rol": "Gerente de Marketing e RH",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Móveis Notável",
    "Pais": "Brasil",
    "Descripcion de la idea": "Gerente de Marketing y Recursos Humanos en Móveis Notável. Contacto directo para propuestas de valor visual y digital.",
    "Empresa Vinculada": [2] // Vinculado a Móveis Notável (ID: 2)
  },
  {
    "Nombre": "Volnei",
    "Apellido": "Benini",
    "Email": "volnei.benini@brv.com.br",
    "Telefono": "+55 54 3455-6600",
    "Rol": "CEO / Diretor",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "BRV Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director clave de BRV Móveis. Expresidente y líder de la asociación de Bento Gonçalves (MOVERGS).",
    "Empresa Vinculada": [8] // Vinculado a BRV Móveis (ID: 8)
  },
  {
    "Nombre": "Rogério",
    "Apellido": "Dalla Costa",
    "Email": "rogerio@moveisvideira.com.br",
    "Telefono": "+55 54 3451-2333",
    "Rol": "Diretor-Presidente",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Tecno Mobili",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director-Presidente de Móveis Videira / Tecno Mobili. Contacto estratégico de R&D y Oficina RTA.",
    "Empresa Vinculada": [9] // Vinculado a Tecno Mobili (ID: 9)
  },
  {
    "Nombre": "Noemir",
    "Apellido": "Capoani",
    "Email": "noemir@ditalia.com.br",
    "Telefono": "+55 54 3455-5900",
    "Rol": "Presidente / Diretor",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Ditália Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Presidente de Ditália Móveis (Bento Gonçalves). Contacto para tomas de decisiones estratégicas.",
    "Empresa Vinculada": [6] // Vinculado a Ditália Móveis (ID: 6)
  },
  {
    "Nombre": "Marcelo",
    "Apellido": "Ariotti",
    "Email": "marcelo.ariotti@telasul.com.br",
    "Telefono": "+55 54 3463-9444",
    "Rol": "Diretor-Presidente / CEO",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Telasul",
    "Pais": "Brasil",
    "Descripcion de la idea": "CEO de Telasul. Tomador de decisión estratégico para la línea de cocinas modulares de acero y madera RTA.",
    "Empresa Vinculada": [5] // Telasul (ID: 5)
  },
  {
    "Nombre": "Jorge Nassar",
    "Apellido": "Frange",
    "Email": "jorge.frange@moveisbechara.com.br",
    "Telefono": "+55 17 3272-9900",
    "Rol": "Sócio-Diretor / CEO",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Móveis Bechara",
    "Pais": "Brasil",
    "Descripcion de la idea": "Líder de Móveis Bechara (Jorgito Bechara). Responsable de alianzas e innovación de producto.",
    "Empresa Vinculada": [11] // Móveis Bechara (ID: 11)
  },
  {
    "Nombre": "Humberto",
    "Apellido": "Zanzini",
    "Email": "humberto@zanzini.com.br",
    "Telefono": "+55 14 3652-9900",
    "Rol": "Diretor Executivo",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Zanzini Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director y vocero principal de Zanzini Móveis. Interesado en procesos eficientes y eco-responsabilidad.",
    "Empresa Vinculada": [12] // Zanzini Móveis (ID: 12)
  },
  {
    "Nombre": "Maic",
    "Apellido": "Caneira",
    "Email": "maic@grupocaneira.com.br",
    "Telefono": "+55 54 3454-7132",
    "Rol": "CEO / Diretor Geral",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Imcal Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "CEO del Grupo Caneira (propietario de Imcal). Tomador de decisión clave para modernizar manuales RTA.",
    "Empresa Vinculada": [15] // Imcal Móveis (ID: 15)
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Obteniendo lista de tablas para eliminar las antiguas "Leads" e "Interacciones"...');
    const tables = await request('GET', `/api/database/tables/database/${databaseId}/`, null, token);
    
    const oldLeadsTable = tables.find(t => t.name === 'Leads');
    if (oldLeadsTable) {
      console.log(`Eliminando tabla antigua "Leads" (ID: ${oldLeadsTable.id})...`);
      await request('DELETE', `/api/database/tables/${oldLeadsTable.id}/`, null, token);
    }
    
    const oldInteraccionesTable = tables.find(t => t.name === 'Interacciones');
    if (oldInteraccionesTable) {
      console.log(`Eliminando tabla antigua "Interacciones" (ID: ${oldInteraccionesTable.id})...`);
      await request('DELETE', `/api/database/tables/${oldInteraccionesTable.id}/`, null, token);
    }

    console.log('3. Creando nueva tabla "Leads" (para reiniciar IDs desde 1)...');
    const leadsTableResponse = await request('POST', `/api/database/tables/database/${databaseId}/`, { name: 'Leads' }, token);
    const leadsTableId = leadsTableResponse.id;
    console.log(`Nueva tabla "Leads" creada con ID: ${leadsTableId}`);

    console.log('4. Modificando campo primario por defecto a "Nombre"...');
    const leadsFields = await request('GET', `/api/database/fields/table/${leadsTableId}/`, null, token);
    const leadsPrimaryField = leadsFields.find(f => f.primary === true);
    if (leadsPrimaryField) {
      await request('PATCH', `/api/database/fields/${leadsPrimaryField.id}/`, { name: 'Nombre' }, token);
      console.log('Campo primario "Nombre" renombrado.');
    }

    console.log('5. Creando campos en la tabla Leads...');
    const fieldMap = {};
    fieldMap['Nombre'] = leadsPrimaryField.id;

    const f1 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Apellido', type: 'text' }, token);
    fieldMap['Apellido'] = f1.id;
    const f2 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Email', type: 'email' }, token);
    fieldMap['Email'] = f2.id;
    const f3 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Empresa', type: 'text' }, token);
    fieldMap['Empresa'] = f3.id;
    const f4 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Pais', type: 'text' }, token);
    fieldMap['Pais'] = f4.id;
    const f5 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Telefono', type: 'text' }, token);
    fieldMap['Telefono'] = f5.id;
    const f6 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Rol', type: 'text' }, token);
    fieldMap['Rol'] = f6.id;
    const f7 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Interes', type: 'text' }, token);
    fieldMap['Interes'] = f7.id;

    const f8 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Status',
      type: 'single_select',
      select_options: [
        { value: 'Nuevo', color: 'green' },
        { value: 'Contactado', color: 'blue' },
        { value: 'Agendado', color: 'purple' },
        { value: 'Descartado', color: 'darker-red' }
      ]
    }, token);
    fieldMap['Status'] = f8.id;

    const f9 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Origen',
      type: 'text',
      text_default: 'Portafolio Web'
    }, token);
    fieldMap['Origen'] = f9.id;

    const f10 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, { name: 'Descripcion de la idea', type: 'long_text' }, token);
    fieldMap['Descripcion de la idea'] = f10.id;

    const f11 = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Estado CRM',
      type: 'single_select',
      select_options: [
        { value: 'Prospecto', color: 'light-blue' },
        { value: 'Primer Contacto', color: 'blue' },
        { value: 'Demo Agendada', color: 'orange' },
        { value: 'Negociación', color: 'purple' },
        { value: 'Cerrado Ganado', color: 'green' },
        { value: 'Cerrado Perdido', color: 'red' }
      ]
    }, token);
    fieldMap['Estado CRM'] = f11.id;

    console.log('Campos creados en Leads:', JSON.stringify(fieldMap, null, 2));

    console.log('6. Creando nueva tabla "Interacciones"...');
    const intTableResponse = await request('POST', `/api/database/tables/database/${databaseId}/`, { name: 'Interacciones' }, token);
    const interaccionesTableId = intTableResponse.id;
    console.log(`Nueva tabla "Interacciones" creada con ID: ${interaccionesTableId}`);

    console.log('7. Modificando campo primario de Interacciones a "Asunto"...');
    const intFields = await request('GET', `/api/database/fields/table/${interaccionesTableId}/`, null, token);
    const intPrimaryField = intFields.find(f => f.primary === true);
    if (intPrimaryField) {
      await request('PATCH', `/api/database/fields/${intPrimaryField.id}/`, { name: 'Asunto' }, token);
      console.log('Campo primario "Asunto" renombrado.');
    }

    console.log('8. Creando campos en la tabla Interacciones...');
    await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, { name: 'Cuerpo', type: 'long_text' }, token);
    await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, {
      name: 'Direccion',
      type: 'single_select',
      select_options: [
        { value: 'Entrante', color: 'blue' },
        { value: 'Saliente', color: 'green' }
      ]
    }, token);

    console.log('9. Vinculando la tabla de Interacciones a Leads...');
    const linkIntField = await request('POST', `/api/database/fields/table/${interaccionesTableId}/`, {
      name: 'Lead',
      type: 'link_row',
      link_row_table_id: leadsTableId,
      has_related_field: true
    }, token);
    console.log('Relación Interacciones ➔ Leads establecida.');

    console.log('10. Vinculando la tabla de Leads a Empresas...');
    const linkEmpField = await request('POST', `/api/database/fields/table/${leadsTableId}/`, {
      name: 'Empresa Vinculada',
      type: 'link_row',
      link_row_table_id: empresasTableId,
      has_related_field: true
    }, token);
    console.log(`Relación Leads ➔ Empresas establecida con ID de campo: ${linkEmpField.id}`);
    fieldMap['Empresa Vinculada'] = linkEmpField.id;

    console.log('11. Obteniendo las filas predeterminadas de Leads para actualizarlas (para iniciar en ID 1)...');
    const defaultLeadsResponse = await request('GET', `/api/database/rows/table/${leadsTableId}/`, null, token);
    const defaultLeads = defaultLeadsResponse.results || [];
    console.log(`Se detectaron ${defaultLeads.length} filas predeterminadas en Leads.`);

    console.log('12. Inyectando/Actualizando contactos clave en Leads (con País: Brasil)...');
    for (let i = 0; i < keyContacts.length; i++) {
      const contact = keyContacts[i];
      const payload = {
        "Nombre": contact["Nombre"],
        "Apellido": contact["Apellido"],
        "Email": contact["Email"],
        "Telefono": contact["Telefono"],
        "Rol": contact["Rol"],
        "Status": contact["Status"],
        "Origen": contact["Origen"],
        "Empresa": contact["Empresa"],
        "Pais": contact["Pais"],
        "Descripcion de la idea": contact["Descripcion de la idea"],
        "Empresa Vinculada": contact["Empresa Vinculada"]
      };

      if (i < defaultLeads.length) {
        const rowId = defaultLeads[i].id;
        console.log(`   Actualizando fila predeterminada Leads ID ${rowId} ➔ ${contact["Nombre"]} ${contact["Apellido"]}`);
        await request('PATCH', `/api/database/rows/table/${leadsTableId}/${rowId}/?user_field_names=true`, payload, token);
      } else {
        const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, payload, token);
        console.log(`   Inyectando nueva fila Leads ID ${response.id} ➔ ${contact["Nombre"]} ${contact["Apellido"]}`);
      }
    }

    console.log('\n--- RESUMEN FINAL DE NUEVAS IDENTIFICACIONES ---');
    console.log(`ID Tabla Leads: ${leadsTableId}`);
    console.log(`ID Tabla Interacciones: ${interaccionesTableId}`);
    console.log(`Mapa de Campos de Leads:`, JSON.stringify(fieldMap, null, 2));

  } catch (error) {
    console.error('Error durante la ejecución del script:', error.message);
  }
}

run();
