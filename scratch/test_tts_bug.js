const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

function escapeXml(unsafe) {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
}

async function test(text, label) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-US-ChristopherNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const safeText = escapeXml(text);
  return new Promise((resolve) => {
    const { audioStream } = tts.toStream(safeText);
    let totalBytes = 0;
    audioStream.on('data', (c) => { totalBytes += c.length; });
    audioStream.on('end', () => {
      console.log(`[${label}] SafeText length: ${safeText.length}, Total bytes: ${totalBytes}`);
      resolve();
    });
    audioStream.on('error', (err) => {
      console.error(`[${label}] Error:`, err);
      resolve();
    });
  });
}

async function run() {
  const originalText = `3DBimFab, acts as an algorithm execution engine that bridges product design departments—which traditionally work in isolation—with manufacturing, quality control, and e-commerce sales.
It allows furniture manufacturers to build dynamic parametric libraries so R&D teams never start from scratch, accelerating design workflows, automated CAD/DXF production file generation, GLB exports, and instant bill-of-materials calculation.`;

  await test(originalText, 'Full User Text with escapeXml');
}

run();
