const { execSync } = require("child_process");
const { writeFileSync, readFileSync, unlinkSync, existsSync } = require("fs");

async function runTest() {
  const voice = "es-CO-GonzaloNeural";
  
  console.log("Generating hola.mp3...");
  execSync(
    `edge-tts --text "Hola Mario." --voice "${voice}" --write-media "hola.mp3"`,
    { timeout: 30000 }
  );
  
  console.log("Generating silence.mp3 using volume=-100%...");
  execSync(
    `edge-tts --text "un segundo" --volume=-100% --voice "${voice}" --write-media "silence.mp3"`,
    { timeout: 30000 }
  );
  
  console.log("Generating adios.mp3...");
  execSync(
    `edge-tts --text "Espero que esto funcione." --voice "${voice}" --write-media "adios.mp3"`,
    { timeout: 30000 }
  );

  const holaBuf = readFileSync("hola.mp3");
  const silenceBuf = readFileSync("silence.mp3");
  const adiosBuf = readFileSync("adios.mp3");

  // Concatenate: [hola] + [silence] + [silence] + [adios]
  const finalBuf = Buffer.concat([
    holaBuf,
    silenceBuf,
    silenceBuf,
    adiosBuf
  ]);

  writeFileSync("test_joined_vol.mp3", finalBuf);
  console.log("Created test_joined_vol.mp3 of size:", finalBuf.length);
}

runTest();
