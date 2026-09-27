import { PasoManualStudio, ComputoResultado } from "../storeTypes";
import { isHardwareMeshName, coincidenMismoHerraje } from "./cadStateUtils";
import { perteneceAMismaFamiliaPieza, anotarInstanciasFisicas, extraerPiezaMadre } from "../piezaMadreUtils";

export interface PiezaInactivaItem {
  key: string;
  nombre: string;
  tipo: "tablero" | "herraje";
  cantidad: number;
}

export interface HeredadosPasoResultado {
  tableros: PiezaInactivaItem[];
  herrajes: PiezaInactivaItem[];
  totalTableros: number;
  totalHerrajes: number;
  totalGeneral: number;
  pasosOrigen: string[];
  heredadosSet: Set<string>;
}

export interface InactivosPasoResultado {
  tableros: PiezaInactivaItem[];
  herrajes: PiezaInactivaItem[];
  totalTableros: number;
  totalHerrajes: number;
  totalGeneral: number;
}

/**
 * 🧱 Calcula en tiempo real las piezas y herrajes HEREDADOS de pasos anteriores.
 * Recopila todo lo ensamblado en pasos previos cronológicamente (índice < paso actual)
 * o referenciado en bloques heredados declarados.
 */
export function calcularHeredadosPaso(
  paso: PasoManualStudio | null | undefined,
  resultado: ComputoResultado | null | undefined,
  todosLosPasos: PasoManualStudio[] = []
): HeredadosPasoResultado {
  const vacio: HeredadosPasoResultado = {
    tableros: [],
    herrajes: [],
    totalTableros: 0,
    totalHerrajes: 0,
    totalGeneral: 0,
    pasosOrigen: [],
    heredadosSet: new Set<string>(),
  };

  if (!paso || !resultado || !resultado.real_meshes || resultado.real_meshes.length === 0) {
    return vacio;
  }

  // 1. Encontrar pasos previos cronológicamente en la secuencia de armado
  const currentIndex = todosLosPasos.findIndex((p) => p.id === paso.id);
  const pasosPrevios = currentIndex > 0 ? todosLosPasos.slice(0, currentIndex) : [];

  // Incluir también bloques declarados explícitamente en el paso o sus capas
  const bloquesIdsDeclarados = new Set<string>([
    ...(paso.bloquesHeredadosIds || []),
    ...((paso.multiplePlus?.capas || []).flatMap((c) => c.bloquesHeredadosIds || [])),
  ]);

  const pasosAProcesar = new Map<string, PasoManualStudio>();
  pasosPrevios.forEach((p) => pasosAProcesar.set(p.id, p));
  bloquesIdsDeclarados.forEach((id) => {
    const p = todosLosPasos.find((x) => x.id === id);
    if (p) pasosAProcesar.set(p.id, p);
  });

  const heredadosSet = new Set<string>();
  const pasosOrigen: string[] = [];

  pasosAProcesar.forEach((pasoPrevio, pasoPrevioId) => {
    pasosOrigen.push(pasoPrevioId);
    if (pasoPrevio.multiplePlus?.capas && pasoPrevio.multiplePlus.capas.length > 0) {
      pasoPrevio.multiplePlus.capas.forEach((capa) => {
        (capa.tableros || []).forEach((t) => heredadosSet.add(t.id.toLowerCase().trim()));
        (capa.herrajes || []).forEach((h) => heredadosSet.add(h.id.toLowerCase().trim()));
        (capa.congelados || []).forEach((c) => heredadosSet.add(c.id.toLowerCase().trim()));
      });
    } else if (pasoPrevio.tipo === "ensamble") {
      (pasoPrevio.piezasAsignadas || []).forEach((p) => heredadosSet.add(p.toLowerCase().trim()));
      (pasoPrevio.herrajesAsignados || []).forEach((h) => heredadosSet.add(h.toLowerCase().trim()));
    } else if (pasoPrevio.subbloques && pasoPrevio.subbloques.length > 0) {
      pasoPrevio.subbloques.forEach((sub: any) => {
        (sub.piezas || []).forEach((p: string) => heredadosSet.add(p.toLowerCase().trim()));
        (sub.herrajes || []).forEach((h: string) => heredadosSet.add(h.toLowerCase().trim()));
      });
    }
  });

  // 1.1 Recopilar piezas activas en el paso actual para excluirlas de heredados
  const activosSet = new Set<string>();
  if (paso.multiplePlus?.capas) {
    paso.multiplePlus.capas.forEach((capa) => {
      (capa.tableros || []).forEach((t) => activosSet.add(t.id.toLowerCase().trim()));
      (capa.herrajes || []).forEach((h) => activosSet.add(h.id.toLowerCase().trim()));
      (capa.congelados || []).forEach((c) => activosSet.add(c.id.toLowerCase().trim()));
    });
  } else if (paso.tipo === "ensamble") {
    (paso.piezasAsignadas || []).forEach((p) => activosSet.add(p.toLowerCase().trim()));
    (paso.herrajesAsignados || []).forEach((h) => activosSet.add(h.toLowerCase().trim()));
  }

  // 2. Extraer mallas anotadas con instanciaKey física unívoca (ej. "Pes (1)", "Porca (3)")
  const cleanMeshes = resultado.real_meshes.filter((m) => !m.es_duplicado_ghx);
  const meshesAnotadas = anotarInstanciasFisicas(cleanMeshes);

  const tablerosMap = new Map<string, PiezaInactivaItem>();
  const herrajesMap = new Map<string, PiezaInactivaItem>();

  meshesAnotadas.forEach((m) => {
    const rawClean = (m.name || "").replace(/^rh_(?:out|in):\s*/i, "").trim();
    if (!rawClean) return;

    const ik = m.instanciaKey || rawClean;
    const ikLow = ik.toLowerCase().trim();
    const rawLow = rawClean.toLowerCase().trim();
    const baseName = extraerPiezaMadre(rawClean);
    const esHw = isHardwareMeshName(rawClean) || isHardwareMeshName(ik);

    // Comprobar si ya está activa en las capas del paso actual
    const estaActiva = Array.from(activosSet).some((act) => {
      if (esHw) {
        return act === ikLow || act === rawLow || coincidenMismoHerraje(act, ik) || coincidenMismoHerraje(act, rawClean);
      }
      return act === ikLow || act === rawLow || act === baseName.toLowerCase() || perteneceAMismaFamiliaPieza(ikLow, act) || perteneceAMismaFamiliaPieza(rawLow, act);
    });

    if (estaActiva) return;

    // Comprobar si está en heredados
    const estaHeredada = Array.from(heredadosSet).some((her) => {
      if (esHw) {
        return her === ikLow || her === rawLow || coincidenMismoHerraje(her, ik) || coincidenMismoHerraje(her, rawClean);
      }
      return her === ikLow || her === rawLow || her === baseName.toLowerCase() || perteneceAMismaFamiliaPieza(ikLow, her) || perteneceAMismaFamiliaPieza(rawLow, her);
    });

    if (!estaHeredada) return;

    const targetMap = esHw ? herrajesMap : tablerosMap;
    const existing = targetMap.get(baseName);
    if (existing) {
      existing.cantidad += 1;
    } else {
      targetMap.set(baseName, {
        key: baseName,
        nombre: baseName,
        tipo: esHw ? "herraje" : "tablero",
        cantidad: 1,
      });
    }
  });

  const tableros = Array.from(tablerosMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));
  const herrajes = Array.from(herrajesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));

  const totalTableros = tableros.reduce((sum, item) => sum + item.cantidad, 0);
  const totalHerrajes = herrajes.reduce((sum, item) => sum + item.cantidad, 0);

  return {
    tableros,
    herrajes,
    totalTableros,
    totalHerrajes,
    totalGeneral: totalTableros + totalHerrajes,
    pasosOrigen,
    heredadosSet,
  };
}

/**
 * 🧮 Calcula en tiempo real las piezas y herrajes INACTIVOS de un paso
 * aplicando la diferencia canónica de la Trinidad del Ensamble:
 * Inactivos = Mueble Total - (Objetos Heredados ∪ Capas Activas de este paso)
 */
export function calcularInactivosPaso(
  paso: PasoManualStudio | null | undefined,
  resultado: ComputoResultado | null | undefined,
  todosLosPasos: PasoManualStudio[] = []
): InactivosPasoResultado {
  const vacio: InactivosPasoResultado = {
    tableros: [],
    herrajes: [],
    totalTableros: 0,
    totalHerrajes: 0,
    totalGeneral: 0,
  };

  if (!paso || !resultado || !resultado.real_meshes || resultado.real_meshes.length === 0) {
    return vacio;
  }

  // 1. Recopilar nombres de piezas en Bloques Heredados automáticamente
  const heredadosRes = calcularHeredadosPaso(paso, resultado, todosLosPasos);
  const heredadosSet = heredadosRes.heredadosSet;

  // 2. Recopilar nombres de piezas en Capas Activas del paso actual
  const activosSet = new Set<string>();
  if (paso.multiplePlus?.capas) {
    paso.multiplePlus.capas.forEach((capa) => {
      (capa.tableros || []).forEach((t) => activosSet.add(t.id.toLowerCase().trim()));
      (capa.herrajes || []).forEach((h) => activosSet.add(h.id.toLowerCase().trim()));
      (capa.congelados || []).forEach((c) => activosSet.add(c.id.toLowerCase().trim()));
    });
  } else if (paso.tipo === "ensamble") {
    (paso.piezasAsignadas || []).forEach((p) => activosSet.add(p.toLowerCase().trim()));
    (paso.herrajesAsignados || []).forEach((h) => activosSet.add(h.toLowerCase().trim()));
  }

  // 2.1 Recopilar piezas y herrajes asignados a Bloques Funcionales (ej. Cajones, Puertas)
  // 🛡️ REGLA CANÓNICA: Si hacen parte de bloques funcionales, NO pertenecen a la capa virtual de inactivos
  const bloquesFuncionalesSet = new Set<string>();
  const todosLosGrupos = [
    ...(paso?.showcase?.gruposCinematicos || []),
    ...todosLosPasos.flatMap((p) => p.showcase?.gruposCinematicos || []),
  ];
  todosLosGrupos.forEach((g) => {
    (g.piezas || []).forEach((piez) => {
      const cleanPiez = piez.toLowerCase().trim();
      if (cleanPiez) bloquesFuncionalesSet.add(cleanPiez);
    });
  });

  // 3. Evaluar cada malla física anotada con instanciaKey física unívoca
  const cleanMeshes = resultado.real_meshes.filter((m) => !m.es_duplicado_ghx);
  const meshesAnotadas = anotarInstanciasFisicas(cleanMeshes);

  const tablerosMap = new Map<string, PiezaInactivaItem>();
  const herrajesMap = new Map<string, PiezaInactivaItem>();

  meshesAnotadas.forEach((m) => {
    const rawClean = (m.name || "").replace(/^rh_(?:out|in):\s*/i, "").trim();
    if (!rawClean) return;

    const ik = m.instanciaKey || rawClean;
    const ikLow = ik.toLowerCase().trim();
    const rawLow = rawClean.toLowerCase().trim();
    const baseName = extraerPiezaMadre(rawClean);
    const esHw = isHardwareMeshName(rawClean) || isHardwareMeshName(ik);

    // Comprobar si ya está activa o heredada
    const estaActiva = Array.from(activosSet).some((act) => {
      if (esHw) {
        return act === ikLow || act === rawLow || coincidenMismoHerraje(act, ik) || coincidenMismoHerraje(act, rawClean);
      }
      return act === ikLow || act === rawLow || act === baseName.toLowerCase() || perteneceAMismaFamiliaPieza(ikLow, act) || perteneceAMismaFamiliaPieza(rawLow, act);
    });

    const estaHeredada = Array.from(heredadosSet).some((her) => {
      if (esHw) {
        return her === ikLow || her === rawLow || coincidenMismoHerraje(her, ik) || coincidenMismoHerraje(her, rawClean);
      }
      return her === ikLow || her === rawLow || her === baseName.toLowerCase() || perteneceAMismaFamiliaPieza(ikLow, her) || perteneceAMismaFamiliaPieza(rawLow, her);
    });

    // Comprobar si pertenece a algún Bloque Funcional (ej. Cajón, Puerta)
    const estaEnBloqueFuncional = Array.from(bloquesFuncionalesSet).some((bf) => {
      if (esHw) {
        return bf === ikLow || bf === rawLow || coincidenMismoHerraje(bf, ik) || coincidenMismoHerraje(bf, rawClean);
      }
      return bf === ikLow || bf === rawLow || bf === baseName.toLowerCase() || perteneceAMismaFamiliaPieza(ikLow, bf) || perteneceAMismaFamiliaPieza(rawLow, bf);
    });

    if (estaActiva || estaHeredada || estaEnBloqueFuncional) {
      return; // No es inactiva
    }

    // Es Inactiva -> agregar al mapa correspondiente
    const targetMap = esHw ? herrajesMap : tablerosMap;
    const existing = targetMap.get(baseName);
    if (existing) {
      existing.cantidad += 1;
    } else {
      targetMap.set(baseName, {
        key: baseName,
        nombre: baseName,
        tipo: esHw ? "herraje" : "tablero",
        cantidad: 1,
      });
    }
  });

  const tableros = Array.from(tablerosMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));
  const herrajes = Array.from(herrajesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));

  const totalTableros = tableros.reduce((sum, item) => sum + item.cantidad, 0);
  const totalHerrajes = herrajes.reduce((sum, item) => sum + item.cantidad, 0);

  return {
    tableros,
    herrajes,
    totalTableros,
    totalHerrajes,
    totalGeneral: totalTableros + totalHerrajes,
  };
}
