const { execSync } = require("child_process");
const { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const { tmpdir } = require("os");
const { randomUUID } = require("crypto");

const SILENT_MP3_BASE64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV";
const silentBuffer = Buffer.from(SILENT_MP3_BASE64, "base64");

async function runTest() {
  const text = "Hola Mario. [pausa: 2] Este es un audio de prueba. [pausa: 1] Con dos pausas.";
  const voice = "es-CO-GonzaloNeural";
  
  const pauseRegex = /\[pausa:\s*(\d+)\]/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  
  while ((match = pauseRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index).trim();
    if (textBefore) {
      segments.push({ type: "text", value: textBefore });
    }
    const duration = parseInt(match[1], 10);
    if (duration > 0) {
      segments.push({ type: "pause", value: duration });
    }
    lastIndex = pauseRegex.lastIndex;
  }
  const textAfter = text.substring(lastIndex).trim();
  if (textAfter) {
    segments.push({ type: "text", value: textAfter });
  }

  console.log("Parsed segments:", segments);

  const tempDir = join(tmpdir(), "tts-test-pauses");
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const buffers = [];
  const tempFiles = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.type === "text") {
        const segId = randomUUID();
        const textFile = join(tempDir, `${segId}.txt`);
        const audioFile = join(tempDir, `${segId}.mp3`);
        tempFiles.push(textFile, audioFile);

        writeFileSync(textFile, segment.value, "utf-8");
        console.log(`Generating text segment ${i}: "${segment.value}"`);
        
        execSync(
          `edge-tts --file "${textFile}" --voice "${voice}" --write-media "${audioFile}"`,
          { timeout: 30000 }
        );

        const segBuffer = readFileSync(audioFile);
        buffers.push(segBuffer);
      } else if (segment.type === "pause") {
        console.log(`Adding silence segment ${i}: ${segment.value}s`);
        const pauseBuf = Buffer.concat(Array(segment.value).fill(silentBuffer));
        buffers.push(pauseBuf);
      }
    }

    const finalBuffer = Buffer.concat(buffers);
    writeFileSync("test_final_pauses.mp3", finalBuffer);
    console.log("Success! Created test_final_pauses.mp3 of size:", finalBuffer.length);
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    // Cleanup temp files
    for (const file of tempFiles) {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

runTest();
