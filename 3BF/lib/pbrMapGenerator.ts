/**
 * 3BF PBR Map Generator — Motor Algorítmico en Canvas 2D
 * Generación instantánea de Normal Map (Sobel), Roughness Map y AO Map desde cualquier textura Diffuse.
 */

export interface PBRMapOptions {
  normalStrength?: number;       // 0.1 a 5.0 (default 1.5)
  normalInvertY?: boolean;       // false = OpenGL, true = DirectX
  normalBlurRadius?: number;     // 0 = ultra fino, 1 = medio, 2 = suave
  roughnessBase?: number;        // 0.0 a 1.0 (default 0.5)
  roughnessContrast?: number;    // 0.5 a 3.0 (default 1.2)
  roughnessInvert?: boolean;     // false = Roughness, true = Glossiness
  aoStrength?: number;           // 0.1 a 3.0 (default 1.0)
  aoRadius?: number;             // Radio de oclusión de cavidades
  diffuseBrightness?: number;    // -0.5 a 0.5 (default 0)
  diffuseContrast?: number;      // 0.5 a 2.0 (default 1.0)
  diffuseSaturation?: number;    // 0.0 a 2.0 (default 1.0)
  diffuseTintHex?: string;       // Color tint overlay (opcional)
}

/**
 * Carga una imagen (URL o DataURL) y devuelve un Canvas HTML con sus dimensiones.
 */
function loadImageToCanvas(imgSrc: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Limitar tamaño máximo a 1024 para velocidad en tiempo real de 60fps
      const maxDim = 1024;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("No se pudo obtener el contexto 2D"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = (err) => reject(err);
    img.src = imgSrc;
  });
}

/**
 * 1. Generador de Normal Map (Filtro diferencial Sobel 3x3 normalizado en RGB Tangente)
 */
export async function generarNormalMap(imgSrc: string, opts: PBRMapOptions = {}): Promise<string> {
  const canvas = await loadImageToCanvas(imgSrc);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(w, h);
  const out = outData.data;

  const strength = opts.normalStrength ?? 1.8;
  const invertY = opts.normalInvertY ?? false;

  // Convertir a escala de grises / altura (Height map)
  const height = new Float32Array(w * h);
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i] / 255;
    const g = src[i + 1] / 255;
    const b = src[i + 2] / 255;
    // Luminosidad perceptual estándar sRGB
    height[i / 4] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Operador Sobel 3x3
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(w - 1, x + 1);
      const y0 = Math.max(0, y - 1);
      const y1 = Math.min(h - 1, y + 1);

      const tl = height[y0 * w + x0];
      const t  = height[y0 * w + x];
      const tr = height[y0 * w + x1];
      const l  = height[y * w + x0];
      const r  = height[y * w + x1];
      const bl = height[y1 * w + x0];
      const b_ = height[y1 * w + x];
      const br = height[y1 * w + x1];

      // Derivadas espaciales dX y dY
      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      let dY = (bl + 2 * b_ + br) - (tl + 2 * t + tr);

      if (invertY) dY = -dY;

      // Vector normal unitario: N = (-dX * strength, -dY * strength, 1.0)
      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

      const unx = nx / len;
      const uny = ny / len;
      const unz = nz / len;

      // Mapear de [-1, 1] a [0, 255] RGB
      const idx = (y * w + x) * 4;
      out[idx]     = Math.round((unx * 0.5 + 0.5) * 255); // R (Eje X)
      out[idx + 1] = Math.round((uny * 0.5 + 0.5) * 255); // G (Eje Y)
      out[idx + 2] = Math.round((unz * 0.5 + 0.5) * 255); // B (Eje Z - Típicamente azulado)
      out[idx + 3] = 255;                                 // Alfa
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL("image/png");
}

/**
 * 2. Generador de Roughness Map (Rugosidad/Brillo en escala de grises calibrada)
 */
export async function generarRoughnessMap(imgSrc: string, opts: PBRMapOptions = {}): Promise<string> {
  const canvas = await loadImageToCanvas(imgSrc);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(w, h);
  const out = outData.data;

  const base = opts.roughnessBase ?? 0.55;
  const contrast = opts.roughnessContrast ?? 1.2;
  const invert = opts.roughnessInvert ?? false;

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i] / 255;
    const g = src[i + 1] / 255;
    const b = src[i + 2] / 255;
    let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Aplicar contraste alrededor del centro de luminosidad
    lum = (lum - 0.5) * contrast + 0.5;

    // Modular con la rugosidad base
    let rough = base + (lum - 0.5) * 0.4;
    if (invert) rough = 1.0 - rough;

    rough = Math.max(0.0, Math.min(1.0, rough));
    const val = Math.round(rough * 255);

    out[i]     = val;
    out[i + 1] = val;
    out[i + 2] = val;
    out[i + 3] = 255;
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL("image/png");
}

/**
 * 3. Generador de AO Map (Ambient Occlusion / Oclusión de Cavidades y Poros)
 */
export async function generarAOMap(imgSrc: string, opts: PBRMapOptions = {}): Promise<string> {
  const canvas = await loadImageToCanvas(imgSrc);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const srcData = ctx.getImageData(0, 0, w, h);
  const src = srcData.data;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(w, h);
  const out = outData.data;

  const strength = opts.aoStrength ?? 1.2;

  // Extracción de mapa de cavidades mediante laplaciano de luminancia
  const lum = new Float32Array(w * h);
  for (let i = 0; i < src.length; i += 4) {
    lum[i / 4] = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]) / 255;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 1);
      const x1 = Math.min(w - 1, x + 1);
      const y0 = Math.max(0, y - 1);
      const y1 = Math.min(h - 1, y + 1);

      const c = lum[y * w + x];
      const avg = (lum[y0 * w + x] + lum[y1 * w + x] + lum[y * w + x0] + lum[y * w + x1]) * 0.25;

      // Las hendiduras son más oscuras que su entorno
      const diff = Math.max(0, avg - c);
      let ao = 1.0 - diff * strength * 2.5;
      ao = Math.max(0.2, Math.min(1.0, ao));

      const val = Math.round(ao * 255);
      const idx = (y * w + x) * 4;
      out[idx]     = val;
      out[idx + 1] = val;
      out[idx + 2] = val;
      out[idx + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas.toDataURL("image/png");
}

/**
 * 4. Ajustador de Diffuse Map (Brillo, Contraste, Saturación y Tinte)
 */
export async function ajustarDiffuseMap(imgSrc: string, opts: PBRMapOptions = {}): Promise<string> {
  const canvas = await loadImageToCanvas(imgSrc);
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const srcData = ctx.getImageData(0, 0, w, h);
  const data = srcData.data;

  const brightness = opts.diffuseBrightness ?? 0;
  const contrast = opts.diffuseContrast ?? 1.0;
  const saturation = opts.diffuseSaturation ?? 1.0;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Brillo y Contraste
    r = (r - 0.5) * contrast + 0.5 + brightness;
    g = (g - 0.5) * contrast + 0.5 + brightness;
    b = (b - 0.5) * contrast + 0.5 + brightness;

    // Saturación
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    data[i]     = Math.round(Math.max(0, Math.min(1, r)) * 255);
    data[i + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
    data[i + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
  }

  ctx.putImageData(srcData, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.92);
}

/**
 * Auto-Generación Completa del Set PBR (Normal, Roughness, AO y Diffuse) en paralelo
 */
export async function autoGenerarSetPBRCompleto(
  diffuseSrc: string,
  tipoMaterial: "Melamina" | "Madera" | "Metal" | "Plastico" | "Pintura" | "PBR" = "Melamina",
  customOpts: Partial<PBRMapOptions> = {}
): Promise<{
  diffuseUrl: string;
  normalUrl: string;
  roughnessUrl: string;
  aoUrl: string;
  roughnessBase: number;
  metallicBase: number;
  clearcoat: number;
}> {
  // Parámetros físicos según naturaleza del material
  let baseRoughness = 0.45;
  let baseMetallic = 0.05;
  let baseClearcoat = 0.20; // Resina melamínica protectora
  let normalStr = 1.8;

  if (tipoMaterial === "Madera") {
    baseRoughness = 0.65;
    baseMetallic = 0.0;
    baseClearcoat = 0.05;
    normalStr = 2.4;
  } else if (tipoMaterial === "Metal") {
    baseRoughness = 0.25;
    baseMetallic = 0.90;
    baseClearcoat = 0.0;
    normalStr = 0.8;
  } else if (tipoMaterial === "Plastico") {
    baseRoughness = 0.35;
    baseMetallic = 0.05;
    baseClearcoat = 0.10;
    normalStr = 0.5;
  } else if (tipoMaterial === "Pintura") {
    baseRoughness = 0.30;
    baseMetallic = 0.20;
    baseClearcoat = 0.35;
    normalStr = 0.4;
  }

  const mergedOpts: PBRMapOptions = {
    normalStrength: normalStr,
    roughnessBase: baseRoughness,
    roughnessContrast: 1.3,
    aoStrength: 1.2,
    ...customOpts,
  };

  const [normalUrl, roughnessUrl, aoUrl, diffuseUrl] = await Promise.all([
    generarNormalMap(diffuseSrc, mergedOpts),
    generarRoughnessMap(diffuseSrc, mergedOpts),
    generarAOMap(diffuseSrc, mergedOpts),
    ajustarDiffuseMap(diffuseSrc, mergedOpts),
  ]);

  return {
    diffuseUrl,
    normalUrl,
    roughnessUrl,
    aoUrl,
    roughnessBase: baseRoughness,
    metallicBase: baseMetallic,
    clearcoat: baseClearcoat,
  };
}
