const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 994; // Tabla Leads activa

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

const remainingContacts = [
  {
    "Nombre": "Frederico",
    "Apellido": "Rufato",
    "Email": "frederico.rufato@moveisrufato.com.br",
    "Telefono": "+55 32 3577-3800",
    "Rol": "Diretor Executivo",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Móveis Rufato",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director del Grupo Rufato en Rodeiro/Ubá (MG). Tomador de decisión estratégico para dormitorios y comedores RTA.",
    "Empresa Vinculada": [3]
  },
  {
    "Nombre": "Thiago",
    "Apellido": "Marostica",
    "Email": "thiago.marostica@djmoveis.com.br",
    "Telefono": "+55 43 3172-7777",
    "Rol": "CEO",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Dj Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "CEO de DJ Móveis en Arapongas. Tomador de decisión clave para comedores y salas RTA.",
    "Empresa Vinculada": [4]
  },
  {
    "Nombre": "Alexandre",
    "Apellido": "Teixeira",
    "Email": "alexandre.teixeira@djmoveis.com.br",
    "Telefono": "+55 43 3172-7777",
    "Rol": "Gerente de P&D (R&D Manager)",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Dj Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Gerente de Investigación y Desarrollo (P&D) en DJ Móveis. Perfil técnico ideal para presentar el manual interactivo 3D.",
    "Empresa Vinculada": [4]
  },
  {
    "Nombre": "Eduardo",
    "Apellido": "Paludetto",
    "Email": "eduardo.paludetto@moveisalbatroz.com.br",
    "Telefono": "+55 43 3273-0900",
    "Rol": "CEO / Diretor Administrativo",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Móveis Albatroz",
    "Pais": "Brasil",
    "Descripcion de la idea": "CEO de Móveis Albatroz en Arapongas (PR). Tomador de decisión estratégico para la línea de organización y dormitorios.",
    "Empresa Vinculada": [7]
  },
  {
    "Nombre": "Elaine",
    "Apellido": "Durante",
    "Email": "elaine.durante@artely.com.br",
    "Telefono": "+55 41 3381-5000",
    "Rol": "Diretora Comercial",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Artely",
    "Pais": "Brasil",
    "Descripcion de la idea": "Miembro de la familia fundadora y Directora Comercial de Artely en Curitiba. Clave para complementos y mesas de centro RTA.",
    "Empresa Vinculada": [10]
  },
  {
    "Nombre": "Kerliton",
    "Apellido": "Modenese",
    "Email": "kerliton.modenese@permobili.com.br",
    "Telefono": "+55 27 3372-6200",
    "Rol": "Diretor Geral",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Permóbili",
    "Pais": "Brasil",
    "Descripcion de la idea": "Director General y vocero de Permóbili en Linhares (ES). Contacto clave para salas y dormitorios de bebé.",
    "Empresa Vinculada": [13]
  },
  {
    "Nombre": "Ana Paula",
    "Apellido": "Manfrin",
    "Email": "anapaula.manfrin@poliman.com.br",
    "Telefono": "+55 43 3276-8600",
    "Rol": "Diretora Industrial e Comercial",
    "Status": "Nuevo",
    "Origen": "Investigación GTM",
    "Empresa": "Poliman Móveis",
    "Pais": "Brasil",
    "Descripcion de la idea": "Directora Industrial y Comercial de Poliman Móveis en Arapongas. Clave para cocinas modulares económicas.",
    "Empresa Vinculada": [14]
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Inyectando ${remainingContacts.length} contactos restantes del Tier 2 en Leads (ID: ${leadsTableId})...`);
    for (const contact of remainingContacts) {
      try {
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
        const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, payload, token);
        console.log(`   Contacto creado: ${contact["Nombre"]} ${contact["Apellido"]} ➔ Fila ID: ${response.id}`);
      } catch (err) {
        console.error(`   Error al crear contacto ${contact["Nombre"]}:`, err.message);
      }
    }
    console.log('\n¡Inyección de contactos restantes completada con éxito!');
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

run();
