const linkedinUrls = [
  { id: 1, name: "Colibri Móveis", url: "https://www.linkedin.com/company/colibri-moveis/" },
  { id: 2, name: "Móveis Notável", url: "https://www.linkedin.com/company/notavelmoveis/" },
  { id: 3, name: "Móveis Rufato", url: "https://www.linkedin.com/company/moveis-rufato/" },
  { id: 4, name: "Dj Móveis", url: "https://www.linkedin.com/company/djmoveis/" },
  { id: 5, name: "Telasul", url: "https://www.linkedin.com/company/telasul/" },
  { id: 6, name: "Ditália Móveis", url: "https://www.linkedin.com/company/ditalia-moveis/" },
  { id: 7, name: "Móveis Albatroz", url: "https://www.linkedin.com/company/moveis-albatroz/" },
  { id: 8, name: "BRV Móveis", url: "https://www.linkedin.com/company/brv-moveis/" },
  { id: 9, name: "Tecno Mobili", url: "https://www.linkedin.com/company/tecno-mobili/" },
  { id: 10, name: "Artely", url: "https://www.linkedin.com/company/artely/" },
  { id: 11, name: "Móveis Bechara", url: "https://www.linkedin.com/company/moveisbechara/" },
  { id: 12, name: "Zanzini Móveis", url: "https://www.linkedin.com/company/zanzini-moveis/" },
  { id: 13, name: "Permóbili", url: "https://www.linkedin.com/company/permobili-moveis/" },
  { id: 14, name: "Poliman Móveis", url: "https://www.linkedin.com/company/poliman-moveis/" },
  { id: 15, name: "Imcal Móveis", url: "https://www.linkedin.com/company/imcal-moveis/" }
];

async function checkUrl(item) {
  try {
    const res = await fetch(item.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    
    const finalUrl = res.url;
    const isUnavailable = finalUrl.includes('unavailable') || res.status === 404;
    return {
      id: item.id,
      name: item.name,
      originalUrl: item.url,
      finalUrl: finalUrl,
      status: res.status,
      working: !isUnavailable
    };
  } catch (error) {
    return {
      id: item.id,
      name: item.name,
      originalUrl: item.url,
      error: error.message,
      working: false
    };
  }
}

async function run() {
  console.log("Comprobando URLs de LinkedIn en paralelo...");
  const results = await Promise.all(linkedinUrls.map(item => checkUrl(item)));
  console.log("\nResultados de la comprobación:");
  console.log(JSON.stringify(results, null, 2));
}

run();
