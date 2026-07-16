const targets = [
  {
    id: 16,
    name: "Móveis Bartira",
    variations: ["moveis-bartira", "moveisbartira", "móveis-bartira", "bartira"]
  },
  {
    id: 17,
    name: "Kappesberg (Grupo K1)",
    variations: ["grupok1", "grupo-k1", "kappesberg", "kappesbergmoveis", "kappesberg-oficial"]
  },
  {
    id: 18,
    name: "Cozinhas Itatiaia",
    variations: ["cozinhas-itatiaia", "cozinhasitatiaia", "itatiaia"]
  },
  {
    id: 19,
    name: "Henn Móveis",
    variations: ["moveishenn", "moveis-henn", "hennmoveis", "henn-móveis", "henn", "hennmoveis"]
  },
  {
    id: 20,
    name: "Madesa",
    variations: ["madesa-moveis", "madesamoveis", "madesa", "moveismadesa"]
  },
  {
    id: 21,
    name: "Demóbile",
    variations: ["demobile", "demobilemoveis", "demobile-moveis", "demóbile"]
  },
  {
    id: 22,
    name: "Moval",
    variations: ["moval", "movalmoveis", "moval-moveis", "moval-móveis"]
  },
  {
    id: 23,
    name: "Móveis Lopas",
    variations: ["moveislopas", "lopas", "lopasmoveis", "moveis-lopas", "móveis-lopas"]
  },
  {
    id: 24,
    name: "Caemmun (Grupo Munhoz Caetano)",
    variations: ["caemmun", "caemmunmoveis", "caemmun-moveis", "caemmunmovelaria", "caemmun-movelaria"]
  },
  {
    id: 25,
    name: "Santos Andirá",
    variations: ["santosandira", "santos-andira", "santos-andirá", "santosandiramoveis", "santos-andir%C3%A1"]
  },
  {
    id: 26,
    name: "Multimóveis",
    variations: ["multimoveis", "multimóveis", "multimoveis-moveis", "multimóveis-decor"]
  },
  {
    id: 27,
    name: "Bertolini Móveis",
    variations: ["moveis-bertolini", "moveisbertolini", "bertolini", "bertolinimoveis", "móveis-bertolini"]
  },
  {
    id: 28,
    name: "Araplac",
    variations: ["araplac", "araplacmoveis", "araplac-moveis", "araplac-móveis"]
  },
  {
    id: 29,
    name: "Politorno Móveis",
    variations: ["politorno", "politorno-moveis", "politorno-móveis", "politorno-sa"]
  },
  {
    id: 30,
    name: "Linea Brasil",
    variations: ["lineabrasil", "lineabrasilmoveis", "linea-brasil", "linea-brasil-móveis"]
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
  console.log("Iniciando escaneo de variaciones de LinkedIn del Tier 1 en paralelo...");
  const results = {};
  
  for (const target of targets) {
    console.log(`Buscando variaciones para: ${target.name}...`);
    const promises = target.variations.map(async (v) => {
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
