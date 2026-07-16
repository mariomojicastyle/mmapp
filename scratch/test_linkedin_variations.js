const targets = [
  {
    id: 2,
    name: "Móveis Notável",
    variations: ["notavel-moveis", "moveisnotavel", "moveis-notavel", "notável-móveis", "notávelmóveis"]
  },
  {
    id: 3,
    name: "Móveis Rufato",
    variations: ["rufato-moveis", "rufatomoveis", "moveis-rufato", "moveisrufato"]
  },
  {
    id: 6,
    name: "Ditália Móveis",
    variations: ["ditaliamoveis", "moveisditalia", "moveis-ditalia", "ditália-móveis", "ditáliamóveis"]
  },
  {
    id: 9,
    name: "Tecno Mobili",
    variations: ["tecnomobili", "moveistecnomobili", "moveis-tecnomobili", "tecnomobili-moveis"]
  },
  {
    id: 11,
    name: "Móveis Bechara",
    variations: ["becharamoveis", "bechara-moveis", "moveis-bechara", "móveisbechara", "móveis-bechara"]
  },
  {
    id: 12,
    name: "Zanzini Móveis",
    variations: ["zanzinimoveis", "moveiszanzini", "moveis-zanzini", "zanzinimóveis", "zanzini-móveis"]
  },
  {
    id: 13,
    name: "Permóbili",
    variations: ["permobilimoveis", "moveispermobili", "moveis-permobili", "permóbilimóveis", "permóbili-móveis"]
  },
  {
    id: 14,
    name: "Poliman Móveis",
    variations: ["polimanmoveis", "moveispoliman", "moveis-poliman", "polimanmóveis", "poliman-móveis"]
  },
  {
    id: 15,
    name: "Imcal Móveis",
    variations: ["imcalmoveis", "moveisimcal", "moveis-imcal", "imcalmóveis", "imcal-móveis"]
  }
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    const finalUrl = res.url;
    const isUnavailable = finalUrl.includes('unavailable') || res.status === 404;
    return {
      url: url,
      finalUrl: finalUrl,
      status: res.status,
      working: !isUnavailable
    };
  } catch (error) {
    return {
      url: url,
      error: error.message,
      working: false
    };
  }
}

async function run() {
  console.log("Iniciando escaneo de variaciones de LinkedIn en paralelo...");
  const results = {};
  
  for (const target of targets) {
    console.log(`Buscando variaciones para: ${target.name}...`);
    const promises = target.variations.map(async (v) => {
      // Codificar componentes URI por si tienen acentos
      const encodedVar = encodeURIComponent(v);
      const url = `https://www.linkedin.com/company/${encodedVar}/`;
      const res = await checkUrl(url);
      return { variation: v, ...res };
    });
    
    const varResults = await Promise.all(promises);
    results[target.name] = varResults.filter(r => r.working);
  }
  
  console.log("\nVariaciones exitosas encontradas:");
  console.log(JSON.stringify(results, null, 2));
}

run();
