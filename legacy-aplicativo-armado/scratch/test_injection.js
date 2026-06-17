const fs = require('fs');
const path = require('path');

function injectCSS(filePath, newCSS) {
  const startMarker = '/* CALIBRATOR_GENERATED_START */';
  const endMarker = '/* CALIBRATOR_GENERATED_END */';
  const block = `${startMarker}\n${newCSS}\n${endMarker}`;
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, block, 'utf-8');
    console.log(`Creado archivo: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex + endMarker.length);
    content = before + block + after;
    console.log(`Reemplazado bloque en: ${filePath}`);
  } else {
    content = content.trimEnd() + '\n\n' + block + '\n';
    console.log(`Añadido bloque al final en: ${filePath}`);
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function updateCSSFiles(calibrationData) {
  const camon = calibrationData['mode-camon'];
  const small = calibrationData['mode-small'];
  const tablet = calibrationData['mode-tablet'];
  
  if (!camon || !small || !tablet) {
    console.error('Faltan perfiles de calibración en los datos.');
    return;
  }

  // Rutas correctas
  const baseDir = path.resolve(__dirname, '..');

  // 1. PanelAyudas.css
  const ayudasPath = path.join(baseDir, 'src/features/AssemblyInstructions/components/NavBarInferior/PanelAyudas/PanelAyudas.css');
  const ayudasCSS = `/* --- Móviles (ej: Tecno Camon 40 Pro / Móvil Estándar) --- */
@media (max-width: 787px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { left: ${camon.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${camon.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { left: ${camon.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${camon.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { right: ${camon.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${camon.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { right: ${camon.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${camon.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: 80px !important; left: ${camon.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${camon.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: 80px !important; left: ${camon.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${camon.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: 80px !important; right: ${camon.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${camon.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${camon.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${camon.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}

/* --- Móviles Pequeños (320px) --- */
@media (max-width: 320px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { left: ${small.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${small.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { left: ${small.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${small.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { right: ${small.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${small.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { right: ${small.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${small.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: 80px !important; left: ${small.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${small.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: 80px !important; left: ${small.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${small.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: 80px !important; right: ${small.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${small.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${small.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${small.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}

/* --- Tablets (788px a 1024px) --- */
@media (min-width: 788px) and (max-width: 1024px) {
  /* Burbujas Superiores */
  .ayuda-bubble.ayuda1 { left: ${tablet.bubbles.ayuda1.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda1 .ayuda-bubble-arrow.arrow-up { left: ${tablet.bubbles.ayuda1.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayudaLuz { left: ${tablet.bubbles.ayudaLuz.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayudaLuz .ayuda-bubble-arrow.arrow-up { left: ${tablet.bubbles.ayudaLuz.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(45deg) !important; }

  .ayuda-bubble.ayudaVelocidad { right: ${tablet.bubbles.ayudaVelocidad.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaVelocidad .ayuda-bubble-arrow.arrow-up { right: ${tablet.bubbles.ayudaVelocidad.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayudaIdioma { right: ${tablet.bubbles.ayudaIdioma.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayudaIdioma .ayuda-bubble-arrow.arrow-up { right: ${tablet.bubbles.ayudaIdioma.arrowVal}px !important; left: auto !important; }

  /* Burbujas Inferiores */
  .ayuda-bubble.ayuda3 { bottom: 80px !important; left: ${tablet.bubbles.ayuda3.bubbleVal}% !important; right: auto !important; transform: translateX(-50%) scale(1) !important; }
  .ayuda-bubble.ayuda3 .ayuda3-arrow.arrow-center { left: ${tablet.bubbles.ayuda3.arrowVal}% !important; right: auto !important; transform: translateX(-50%) rotate(225deg) !important; }

  .ayuda-bubble.ayuda4 { bottom: 80px !important; left: ${tablet.bubbles.ayuda4.bubbleVal}px !important; right: auto !important; }
  .ayuda-bubble.ayuda4 .ayuda-bubble-arrow.arrow-down { left: ${tablet.bubbles.ayuda4.arrowVal}px !important; right: auto !important; }

  .ayuda-bubble.ayuda5 { bottom: 80px !important; right: ${tablet.bubbles.ayuda5.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda5 .ayuda-bubble-arrow.arrow-down { right: ${tablet.bubbles.ayuda5.arrowVal}px !important; left: auto !important; }

  .ayuda-bubble.ayuda6 { right: ${tablet.bubbles.ayuda6.bubbleVal}px !important; left: auto !important; }
  .ayuda-bubble.ayuda6 .ayuda-bubble-arrow.arrow-right { right: ${tablet.bubbles.ayuda6.arrowVal}px !important; left: auto !important; }
}`;
  injectCSS(ayudasPath, ayudasCSS);

  // 2. BotonCerrar.css
  const cerrarPath = path.join(baseDir, 'src/features/AssemblyInstructions/components/BotonCerrar/BotonCerrar.css');
  const cerrarCSS = `@media (max-width: 787px) {
  .cerrar {
    top: ${camon.cerrar.top}px !important;
    right: ${camon.cerrar.right}px !important;
  }
}

@media (max-width: 320px) {
  .cerrar {
    top: ${small.cerrar.top}px !important;
    right: ${small.cerrar.right}px !important;
  }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .cerrar {
    top: ${tablet.cerrar.top}px !important;
    right: ${tablet.cerrar.right}px !important;
  }
}`;
  injectCSS(cerrarPath, cerrarCSS);

  // 3. RealidadAumentada.css
  const arPath = path.join(baseDir, 'src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.css');
  const arCSS = `@media (max-width: 787px) {
  .AR {
    bottom: ${camon.ar.bottom}px !important;
    right: ${camon.ar.right}px !important;
  }
}

@media (max-width: 320px) {
  .AR {
    bottom: ${small.ar.bottom}px !important;
    right: ${small.ar.right}px !important;
  }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .AR {
    bottom: ${tablet.ar.bottom}px !important;
    right: ${tablet.ar.right}px !important;
  }
}`;
  injectCSS(arPath, arCSS);

  // 4. NavBarSuperior.css
  const superiorPath = path.join(baseDir, 'src/features/AssemblyInstructions/components/NavBarSuperior/NavBarSuperior.css');
  const superiorCSS = `@media (max-width: 787px) {
  .contenedor1 { top: ${camon.margins.top}px !important; }
}

@media (max-width: 320px) {
  .contenedor1 { top: ${small.margins.top}px !important; }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .contenedor1 { top: ${tablet.margins.top}px !important; }
}`;
  injectCSS(superiorPath, superiorCSS);

  // 5. NavBarInferior.css
  const inferiorPath = path.join(baseDir, 'src/features/AssemblyInstructions/components/NavBarInferior/NavBarInferior.css');
  const inferiorCSS = `@media (max-width: 787px) {
  .contenedor { bottom: ${camon.margins.bottom}px !important; }
}

@media (max-width: 320px) {
  .contenedor { bottom: ${small.margins.bottom}px !important; }
}

@media (min-width: 788px) and (max-width: 1024px) {
  .contenedor { bottom: ${tablet.margins.bottom}px !important; }
}`;
  injectCSS(inferiorPath, inferiorCSS);
}

// Ejecutar con el JSON actual de calibration.json
try {
  const jsonPath = path.join(__dirname, '../calibration.json');
  if (fs.existsSync(jsonPath)) {
    const calibrationData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    updateCSSFiles(calibrationData);
    console.log('Inyección de prueba completada exitosamente.');
  } else {
    console.error('No se encontró calibration.json');
  }
} catch (e) {
  console.error('Error durante la inyección de prueba:', e);
}
