const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991;

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

// Map of known companies to Tiers
const tierMapping = {
  // Tier 1 Giants (> R$ 250M)
  'móveis bartira': 'Tier 1',
  'bartira': 'Tier 1',
  'kappesberg (grupo k1)': 'Tier 1',
  'kappesberg': 'Tier 1',
  'cozinhas itatiaia': 'Tier 1',
  'itatiaia': 'Tier 1',
  'henn móveis': 'Tier 1',
  'henn': 'Tier 1',
  'madesa': 'Tier 1',
  'demóbile': 'Tier 1',
  'moval': 'Tier 1',
  'móveis lopas': 'Tier 1',
  'lopas': 'Tier 1',
  'caemmun (grupo munhoz caetano)': 'Tier 1',
  'caemmun': 'Tier 1',
  'santos andirá': 'Tier 1',
  'multimóveis': 'Tier 1',
  'bertolini móveis': 'Tier 1',
  'bertolini': 'Tier 1',
  'arapluta': 'Tier 1',
  'araplac': 'Tier 1',
  'politorno móveis': 'Tier 1',
  'politorno': 'Tier 1',
  'linea brasil': 'Tier 1',

  // Tier 2 Specialists (R$ 100M - R$ 200M)
  'brv móveis': 'Tier 2',
  'brv': 'Tier 2',
  'tecno mobili': 'Tier 2',
  'artely': 'Tier 2',
  'artely móveis ltda': 'Tier 2',
  'móveis bechara': 'Tier 2',
  'bechara': 'Tier 2',
  'zanzini móveis': 'Tier 2',
  'zanzini': 'Tier 2',
  'permóbili': 'Tier 2',
  'poliman móveis': 'Tier 2',
  'poliman': 'Tier 2',
  'imcal móveis': 'Tier 2',
  'imcal': 'Tier 2',
  'kits paraná': 'Tier 2',
  'mobler móveis': 'Tier 2',
  'unicasa indústria de móveis s/a': 'Tier 2',
  'unicasa indústria de móveis': 'Tier 2',
  'unicasa': 'Tier 2',
  'tuboarte indústria e comércio de móveis': 'Tier 2',
  'tuboarte': 'Tier 2',
  'delucci móveis': 'Tier 2',
  'genialflex móveis': 'Tier 2',
  'genialflex': 'Tier 2',
  'italinea móveis': 'Tier 2',
  'italinea': 'Tier 2',
  'oggi móveis': 'Tier 2',
  'barreto designer': 'Tier 2',
  'colibri móveis': 'Tier 2',
  'colibri': 'Tier 2',
  'móveis notável': 'Tier 2',
  'notável': 'Tier 2',
  'móveis rufato': 'Tier 2',
  'rufato': 'Tier 2',
  'dj móveis': 'Tier 2',
  'telasul': 'Tier 2',
  'ditália móveis': 'Tier 2',
  'ditália': 'Tier 2',
  'albatroz móveis': 'Tier 2',
  'albatroz': 'Tier 2'
};

async function run() {
  try {
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    
    // 1. Get existing fields in table 991 to check if Tier field exists
    const fields = await request('GET', `/api/database/fields/table/${empresasTableId}/`, null, token);
    let tierField = fields.find(f => f.name.toLowerCase() === 'tier');
    
    if (!tierField) {
      console.log('Creating "Tier" single_select field in table 991...');
      tierField = await request('POST', `/api/database/fields/table/${empresasTableId}/`, {
        name: 'Tier',
        type: 'single_select',
        select_options: [
          { value: 'Tier 1', color: 'red' },
          { value: 'Tier 2', color: 'orange' },
          { value: 'Tier 3', color: 'yellow' },
          { value: 'Tier 4', color: 'blue' }
        ]
      }, token);
      console.log(`✅ Created "Tier" field (ID: ${tierField.id})`);
    } else {
      console.log(`"Tier" field already exists (ID: ${tierField.id})`);
    }

    // 2. Fetch all rows in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    const rows = empresasRes.results;
    console.log(`Found ${rows.length} companies in table 991. Populating Tiers...`);

    // 3. Update each row with its corresponding Tier
    for (const row of rows) {
      const companyName = (row['Nombre de la Empresa'] || '').toLowerCase().trim();
      let matchedTier = null;

      for (const [key, tier] of Object.entries(tierMapping)) {
        if (companyName.includes(key) || key.includes(companyName)) {
          matchedTier = tier;
          break;
        }
      }

      if (!matchedTier) {
        matchedTier = 'Tier 2'; // Default fallback for mapped registered brands
      }

      // Check if already has correct Tier
      const currentTier = typeof row['Tier'] === 'object' && row['Tier'] !== null ? row['Tier'].value : row['Tier'];
      if (currentTier === matchedTier) {
        console.log(`ℹ️ Row ${row.id} (${row['Nombre de la Empresa']}) already has Tier: ${matchedTier}`);
        continue;
      }

      await request('PATCH', `/api/database/rows/table/${empresasTableId}/${row.id}/?user_field_names=true`, {
        'Tier': matchedTier
      }, token);
      console.log(`✅ Updated Row ${row.id} (${row['Nombre de la Empresa']}) -> ${matchedTier}`);
    }

    console.log('🎉 All companies in table 991 successfully updated with Tier tags!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
