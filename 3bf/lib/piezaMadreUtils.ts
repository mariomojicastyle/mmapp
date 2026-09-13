/**
 * 3dBimFab - Utilidades Canónicas para Piezas Madre
 * 
 * En modelos Grasshopper/VisualARQ, un tablero físico está desglosado en sub-mallas:
 * - Cara Tono/Color (ej. "RH_OUT:Peça 6")
 * - Núcleo/Canto MDP (ej. "RH_OUT:MDP Peça 6")
 * - Reverso/Balance (ej. "RH_OUT:Peça 6 B" o "RH_OUT:MDF Peça 6")
 * 
 * Este módulo unifica todas las sub-mallas bajo su entidad física canónica: la "Pieza Madre".
 */

/**
 * Normaliza y extrae el identificador canónico de la Pieza Madre.
 * Ejemplos:
 * - "RH_OUT:Peça 6" -> "Peça 6"
 * - "RH_OUT:MDP Peça 6" -> "Peça 6"
 * - "RH_OUT:Peça 6 B" -> "Peça 6"
 * - "RH_OUT:MDF Peça 15" -> "Peça 15"
 * - "RH_OUT:PK 10" -> "PK 10"
 * - "RH_OUT:MDP Cubierta" -> "Cubierta"
 * - "RH_OUT:Cubierta B" -> "Cubierta"
 * - "RH_OUT:Parafuso A" -> "Parafuso A"
 * - "RH_OUT:Cavilha" -> "Cavilha"
 */
/**
 * Determina si una pieza o malla corresponde a un herraje/accesorio de ensamble.
 */
export function esHerrajeNombre(name?: string | null): boolean {
  if (!name) return false;
  const cleanLower = name.toLowerCase().replace(/^rh_(?:out|in):\s*/i, "").trim();
  return (
    cleanLower.includes("perno") ||
    cleanLower.includes("caja") ||
    cleanLower.includes("tarugo") ||
    cleanLower.includes("cavilha") ||
    cleanLower.includes("clavilha") ||
    cleanLower.includes("tornillo") ||
    cleanLower.includes("parafuso") ||
    cleanLower.includes("soporte") ||
    cleanLower.includes("corredera") ||
    cleanLower.includes("corredi") ||
    cleanLower.includes("cantoneira") ||
    cleanLower.includes("angulo") ||
    cleanLower.includes("esquinero") ||
    cleanLower.includes("bisagra") ||
    cleanLower.includes("dobradi") ||
    cleanLower.includes("puxador") ||
    cleanLower.includes("manija") ||
    cleanLower.includes("tirador") ||
    cleanLower.includes("pes") ||
    cleanLower.includes("pés") ||
    cleanLower.includes("pata") ||
    cleanLower.includes("pie") ||
    cleanLower.includes("porca") ||
    cleanLower.includes("tuerca") ||
    cleanLower.includes("clavo") ||
    cleanLower.includes("grampo") ||
    cleanLower.includes("prego") ||
    cleanLower.includes("tampa")
  ) && !cleanLower.includes("cajon") && !cleanLower.includes("gaveta");
}

export function extraerPiezaMadre(rawName?: string | null): string {
  if (!rawName) return "";

  // 1. Quitar prefijo RH_OUT: o RH_IN:
  let clean = rawName.replace(/^RH_(?:OUT|IN):\s*/i, "").trim();

  // 2. Descartar sufijos de clonación Three.js (.001, .002, etc.) al resolver pieza madre
  clean = clean.replace(/\.\d{3}$/, "").trim();

  // Detectar y preservar sufijo de instancia física si existe (ej. "(1)", "(2)")
  const matchInstancia = clean.match(/\s*\(\d+\)$/);
  const sufijoInstancia = matchInstancia ? matchInstancia[0] : "";
  if (sufijoInstancia) {
    clean = clean.slice(0, clean.length - sufijoInstancia.length).trim();
  }

  const esHerraje = esHerrajeNombre(clean);

  const cleanLower = clean.toLowerCase();
  if (esHerraje && !cleanLower.includes("cajon") && !cleanLower.includes("gaveta")) {
    return clean + sufijoInstancia;
  }

  // 4. Patrón Canónico 1: Piezas numeradas (ej. "Peça 6", "MDP Peça 6", "Peça 6 B", "MDF Peça 15")
  const matchPeca = clean.match(/(?:mdp|mdf|color|balance)?\s*pe[cç]a\s*(\d+)/i);
  if (matchPeca) {
    return `Peça ${matchPeca[1]}${sufijoInstancia}`;
  }

  // 5. Patrón Canónico 2: Piezas tipo PK (ej. "PK 10", "MDP PK10", "PK 10 B")
  const matchPk = clean.match(/(?:mdp|mdf|color|balance)?\s*pk\s*(\d+)/i);
  if (matchPk) {
    return `PK ${matchPk[1]}${sufijoInstancia}`;
  }

  // 6. Patrón Canónico 3: Piezas descriptivas con prefijos MDP/MDF o sufijos B/Balance
  let descriptive = clean;
  descriptive = descriptive.replace(/^(?:mdp|mdf|color)\s+/i, "");
  descriptive = descriptive.replace(/\s+(?:b|balance|reverso)$/i, "");
  descriptive = descriptive.trim();

  return (descriptive || clean) + sufijoInstancia;
}

/**
 * Comprueba si una malla o sub-capa pertenece exactamente a la misma Pieza Madre.
 */
export function perteneceAPiezaMadre(nombreMalla: string, piezaMadreBuscada: string): boolean {
  if (!nombreMalla || !piezaMadreBuscada) return false;
  const pmMalla = extraerPiezaMadre(nombreMalla).toLowerCase();
  const pmBuscada = extraerPiezaMadre(piezaMadreBuscada).toLowerCase();
  return pmMalla === pmBuscada;
}

/**
 * Agrupa una lista de nombres de mallas en un conjunto de Piezas Madre únicas y ordenadas.
 */
export function agruparMallasEnPiezasMadre(nombresMallas: string[]): string[] {
  const piezasMadreSet = new Set<string>();

  nombresMallas.forEach((n) => {
    const pm = extraerPiezaMadre(n);
    if (pm) piezasMadreSet.add(pm);
  });

  // Ordenar inteligentemente (numérico si es Peça X o PK X, alfabético si es texto)
  return Array.from(piezasMadreSet).sort((a, b) => {
    const numA = a.match(/\d+/);
    const numB = b.match(/\d+/);
    if (numA && numB) {
      return parseInt(numA[0], 10) - parseInt(numB[0], 10);
    }
    return a.localeCompare(b);
  });
}

/**
 * Calcula el centro geométrico 3D de una malla (usando sus vértices reales o su posición).
 */
export function calcularCentroMalla(m: { position?: [number, number, number]; vertices?: number[] }): [number, number, number] {
  const pos = m.position || [0, 0, 0];
  const verts = m.vertices;
  if (verts && verts.length >= 3) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i];
      const y = verts[i + 1];
      const z = verts[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return [
      (minX + maxX) / 2 + pos[0],
      (minY + maxY) / 2 + pos[1],
      (minZ + maxZ) / 2 + pos[2],
    ];
  }
  return [pos[0], pos[1], pos[2]];
}

/**
 * Obtiene la altura física en Y de una malla para diferenciar perfiles de corredera.
 */
export function obtenerSizeYMalla(m: { size?: [number, number, number]; vertices?: number[] }): number {
  if (m.size && typeof m.size[1] === "number") return m.size[1];
  if (m.vertices && m.vertices.length >= 3) {
    let minY = Infinity, maxY = -Infinity;
    for (let i = 1; i < m.vertices.length; i += 3) {
      const y = m.vertices[i];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return maxY - minY;
  }
  return 0;
}

/**
 * Calcula la caja delimitadora 3D (AABB) de una malla.
 */
export function calcularBBoxMalla(m: { position?: [number, number, number]; vertices?: number[]; size?: [number, number, number] }): [number, number, number, number, number, number] {
  const pos = m.position || [0, 0, 0];
  const verts = m.vertices;
  if (verts && verts.length >= 3) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i];
      const y = verts[i + 1];
      const z = verts[i + 2];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return [
      minX + pos[0], maxX + pos[0],
      minY + pos[1], maxY + pos[1],
      minZ + pos[2], maxZ + pos[2],
    ];
  }
  const sz = m.size || [0, 0, 0];
  return [
    pos[0] - sz[0] / 2, pos[0] + sz[0] / 2,
    pos[1] - sz[1] / 2, pos[1] + sz[1] / 2,
    pos[2] - sz[2] / 2, pos[2] + sz[2] / 2,
  ];
}

/**
 * Determina si dos cajas delimitadoras se tocan o solapan dentro de una tolerancia.
 */
export function bboxesSeTocan(
  b1: [number, number, number, number, number, number],
  b2: [number, number, number, number, number, number],
  tol: number = 0.002
): boolean {
  const overlapX = !(b1[1] < b2[0] - tol || b1[0] > b2[1] + tol);
  const overlapY = !(b1[3] < b2[2] - tol || b1[2] > b2[3] + tol);
  const overlapZ = !(b1[5] < b2[4] - tol || b1[4] > b2[5] + tol);
  return overlapX && overlapY && overlapZ;
}

/**
 * Agrupa espacialmente las mallas que comparten la misma Pieza Madre pero son instancias
 * físicas distintas separadas en el espacio (ej. 12 laterales llamados "Peça 17").
 * Asigna a cada una su identificador unívoco (ej. "Peça 17 (1)", "Peça 17 (2)", etc.)
 * Para herrajes articulados o telescópicos como las correderas, desagrega cada componente funcional
 * (Fija, Intermedia, Móvil, Seguro) de forma independiente para permitir su selección y animación por separado.
 */
export function anotarInstanciasFisicas<T extends { name: string; position?: [number, number, number]; vertices?: number[] }>(
  meshes: T[]
): (T & { instanciaKey: string })[] {
  if (!meshes || meshes.length === 0) return [];

  // 1. Agrupar por Pieza Madre base
  const porBase = new Map<string, Array<{ mesh: T; center: [number, number, number] }>>();

  for (const m of meshes) {
    const base = extraerPiezaMadre(m.name);
    if (!porBase.has(base)) {
      porBase.set(base, []);
    }
    porBase.get(base)!.push({
      mesh: m,
      center: calcularCentroMalla(m),
    });
  }

  const resultado: (T & { instanciaKey: string })[] = [];

  // 2. Para cada Pieza Madre base, procesar adecuadamente según tipología
  porBase.forEach((items, baseName) => {
    const isCorredera = baseName.toLowerCase().includes("corredi") || baseName.toLowerCase().includes("corredera");

    // ── HERRAJES TELESCÓPICOS / CORREDERAS: Desagregación canónica por rol ──
    if (isCorredera) {
      interface SlidePart {
        mesh: T;
        center: [number, number, number];
        sizeY: number;
      }
      const fijas: SlidePart[] = [];
      const intermedias: SlidePart[] = [];
      const moviles: SlidePart[] = [];
      const seguros: SlidePart[] = [];

      items.forEach((it) => {
        const szY = obtenerSizeYMalla(it.mesh as any);
        const part: SlidePart = { ...it, sizeY: szY };
        if (szY >= 0.035) {
          fijas.push(part);
        } else if (szY > 0.024) {
          intermedias.push(part);
        } else if (szY > 0.013) {
          moviles.push(part);
        } else {
          seguros.push(part);
        }
      });

      // Si no encajan en el desglose telescópico estándar, asignar identificador individual a cada malla sin agrupar
      if (fijas.length === 0 && moviles.length === 0) {
        items.forEach((it, idx) => {
          resultado.push({
            ...it.mesh,
            instanciaKey: items.length > 1 ? `${baseName} (${idx + 1})` : baseName,
          });
        });
        return;
      }

      // Ordenar ensambles de corredera por cota Y descendente (de arriba a abajo) y luego X (de izquierda a derecha)
      fijas.sort((a, b) => {
        if (Math.abs(b.center[1] - a.center[1]) > 0.02) return b.center[1] - a.center[1];
        return a.center[0] - b.center[0];
      });

      const poolInter = [...intermedias];
      const poolMovil = [...moviles];
      const poolSeguro = [...seguros];

      fijas.forEach((fija, idx) => {
        const slideIdx = idx + 1;
        const fc = fija.center;

        resultado.push({
          ...fija.mesh,
          instanciaKey: `Corrediça - Fija (${slideIdx})`,
        });

        // Emparejar perfil intermedio más cercano (< 10mm de distancia en X/Y)
        if (poolInter.length > 0) {
          let bestIdx = 0;
          let bestDist = Infinity;
          poolInter.forEach((it, i) => {
            const d = Math.hypot(it.center[0] - fc[0], it.center[1] - fc[1], it.center[2] - fc[2]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          });
          const [matchedInter] = poolInter.splice(bestIdx, 1);
          resultado.push({
            ...matchedInter.mesh,
            instanciaKey: `Corrediça - Intermedia (${slideIdx})`,
          });
        }

        // Emparejar perfil móvil interior más cercano
        if (poolMovil.length > 0) {
          let bestIdx = 0;
          let bestDist = Infinity;
          poolMovil.forEach((it, i) => {
            const d = Math.hypot(it.center[0] - fc[0], it.center[1] - fc[1], it.center[2] - fc[2]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          });
          const [matchedMovil] = poolMovil.splice(bestIdx, 1);
          resultado.push({
            ...matchedMovil.mesh,
            instanciaKey: `Corrediça - Móvil (${slideIdx})`,
          });
        }

        // Emparejar gatillo / seguro plástico frontal
        if (poolSeguro.length > 0) {
          let bestIdx = 0;
          let bestDist = Infinity;
          poolSeguro.forEach((it, i) => {
            const d = Math.hypot((it.center[0] - fc[0]) * 4, (it.center[1] - fc[1]) * 4, it.center[2] - fc[2]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
            }
          });
          const [matchedSeguro] = poolSeguro.splice(bestIdx, 1);
          resultado.push({
            ...matchedSeguro.mesh,
            instanciaKey: `Corrediça - Seguro (${slideIdx})`,
          });
        }
      });

      // Piezas adicionales restantes si las hubiera
      poolInter.forEach((it, i) => {
        resultado.push({
          ...it.mesh,
          instanciaKey: `Corrediça - Intermedia (${fijas.length + i + 1})`,
        });
      });
      poolMovil.forEach((it, i) => {
        resultado.push({
          ...it.mesh,
          instanciaKey: `Corrediça - Móvil (${fijas.length + i + 1})`,
        });
      });
      poolSeguro.forEach((it, i) => {
        resultado.push({
          ...it.mesh,
          instanciaKey: `Corrediça - Seguro (${fijas.length + i + 1})`,
        });
      });

      return;
    }

    // ── PIEZAS MADERA Y OTROS HERRAJES (Clusterizado por solapamiento geométrico de cajas AABB) ──
    interface MeshCluster {
      bbox: [number, number, number, number, number, number];
      members: T[];
    }
    const clusters: MeshCluster[] = [];

    for (const { mesh } of items) {
      const mBBox = calcularBBoxMalla(mesh as any);
      const matchedIndices: number[] = [];

      clusters.forEach((cl, idx) => {
        if (bboxesSeTocan(mBBox, cl.bbox, 0.002)) {
          matchedIndices.push(idx);
        }
      });

      if (matchedIndices.length === 0) {
        clusters.push({
          bbox: [...mBBox],
          members: [mesh],
        });
      } else if (matchedIndices.length === 1) {
        const targetCl = clusters[matchedIndices[0]];
        targetCl.members.push(mesh);
        targetCl.bbox = [
          Math.min(targetCl.bbox[0], mBBox[0]),
          Math.max(targetCl.bbox[1], mBBox[1]),
          Math.min(targetCl.bbox[2], mBBox[2]),
          Math.max(targetCl.bbox[3], mBBox[3]),
          Math.min(targetCl.bbox[4], mBBox[4]),
          Math.max(targetCl.bbox[5], mBBox[5]),
        ];
      } else {
        // Fusionar múltiples clusters que contactan esta misma pieza
        const mergedMembers: T[] = [mesh];
        let mergedBBox: [number, number, number, number, number, number] = [...mBBox];

        // Ordenar índices de mayor a menor para splice seguro
        matchedIndices.sort((a, b) => b - a).forEach((idx) => {
          const [removed] = clusters.splice(idx, 1);
          mergedMembers.push(...removed.members);
          mergedBBox = [
            Math.min(mergedBBox[0], removed.bbox[0]),
            Math.max(mergedBBox[1], removed.bbox[1]),
            Math.min(mergedBBox[2], removed.bbox[2]),
            Math.max(mergedBBox[3], removed.bbox[3]),
            Math.min(mergedBBox[4], removed.bbox[4]),
            Math.max(mergedBBox[5], removed.bbox[5]),
          ];
        });

        clusters.push({
          bbox: mergedBBox,
          members: mergedMembers,
        });
      }
    }

    // Ordenar clusters espacialmente (Z descendente, luego Y descendente, luego X ascendente)
    clusters.sort((a, b) => {
      const cZa = (a.bbox[4] + a.bbox[5]) / 2;
      const cZb = (b.bbox[4] + b.bbox[5]) / 2;
      if (Math.abs(cZb - cZa) > 0.02) return cZb - cZa;

      const cYa = (a.bbox[2] + a.bbox[3]) / 2;
      const cYb = (b.bbox[2] + b.bbox[3]) / 2;
      if (Math.abs(cYb - cYa) > 0.02) return cYb - cYa;

      const cXa = (a.bbox[0] + a.bbox[1]) / 2;
      const cXb = (b.bbox[0] + b.bbox[1]) / 2;
      return cXa - cXb;
    });

    // 3. Asignar nombres unívocos
    const tieneMultiples = clusters.length > 1;

    clusters.forEach((cl, clIdx) => {
      const instanciaKey = tieneMultiples ? `${baseName} (${clIdx + 1})` : baseName;
      cl.members.forEach((m) => {
        resultado.push({
          ...m,
          instanciaKey,
        });
      });
    });
  });

  return resultado;
}
