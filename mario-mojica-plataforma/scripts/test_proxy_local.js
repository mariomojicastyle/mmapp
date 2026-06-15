async function testLocalUrl(url) {
  try {
    const res = await fetch(url);
    console.log(`LOCAL URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    console.log(`Content-Length: ${res.headers.get('content-length')}`);
    if (!res.ok) {
      console.log(`Body: ${await res.text()}`);
    }
    console.log('---');
  } catch (err) {
    console.error(`Error fetching ${url}:`, err.message);
  }
}

async function main() {
  const baseUrl = 'http://localhost:5173/M00001/sounds';
  await testLocalUrl(`${baseUrl}/00.mp3`);
  await testLocalUrl(`${baseUrl}/01.mp3`);
  await testLocalUrl(`${baseUrl}/01_Ayuda.mp3`);
}

main();
