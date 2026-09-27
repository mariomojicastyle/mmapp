import { PasoManualStudio, ModoPickingManualState } from '@/lib/store';
import { extraerPiezaMadre, perteneceAMismaFamiliaPieza, esHerrajeNombre } from '@/lib/piezaMadreUtils';
import { coincidenMismoHerraje, isHardwareMeshName } from '@/lib/engine/cadStateUtils';

export interface BoardVisibilityInput {
  name: string;
  cleanName: string;
  instanciaKey?: string;
  piezaMadre: string;
  pestanaActiva: string;
  pasoActivoManual: PasoManualStudio | null;
  pasosManual: PasoManualStudio[];
  modoPickingManual: ModoPickingManualState;
  asignacionVisible?: boolean;
  capaVisible?: boolean;
}

export function evaluarPertenenciaPaso(
  asignadas: string[],
  name: string,
  cleanName: string,
  instanciaKey?: string,
  piezaMadre?: string
): boolean {
  if (!asignadas || asignadas.length === 0) return false;
  const rawClean = name ? name.replace(/^RH_(?:OUT|IN):\s*/i, '').trim() : '';

  // 🛡️ 1. EVALUACIÓN EXCLUSIVA PARA HERRAJES DE ENSAMBLE:
  const esHardware =
    isHardwareMeshName(name) ||
    isHardwareMeshName(cleanName) ||
    (instanciaKey ? isHardwareMeshName(instanciaKey) : false) ||
    esHerrajeNombre(name) ||
    esHerrajeNombre(cleanName) ||
    (instanciaKey ? esHerrajeNombre(instanciaKey) : false);

  if (esHardware) {
    // La identidad física unívoca del herraje es su instancia numerada (ej. "Cavilha (2)")
    const idHerrajeMesh = instanciaKey || rawClean || cleanName;
    const idLow = idHerrajeMesh.toLowerCase().trim();

    return asignadas.some((pz) => {
      if (!pz) return false;
      const pzLow = pz.toLowerCase().trim();
      // Coincidencia exacta directa (ej. "Cavilha (2)" === "Cavilha (2)")
      if (pzLow === idLow) return true;
      // Coincidencia canónica universal (mismo número de instancia física y misma familia)
      return coincidenMismoHerraje(pz, idHerrajeMesh);
    });
  }

  // 🪵 2. EVALUACIÓN PARA TABLEROS DE MADERA Y PIEZAS ESTRUCTURALES:
  return asignadas.some((pz) => {
    if (!pz) return false;

    // Coincidencia directa exacta de string
    if (instanciaKey && (pz === instanciaKey || pz.toLowerCase() === instanciaKey.toLowerCase())) return true;
    if (piezaMadre && (pz === piezaMadre || pz.toLowerCase() === piezaMadre.toLowerCase())) return true;
    if (cleanName && (pz === cleanName || pz.toLowerCase() === cleanName.toLowerCase())) return true;
    if (rawClean && (pz === rawClean || pz.toLowerCase() === rawClean.toLowerCase())) return true;

    // Coincidencia de familia de tablero (ej. Peça 8 (1) pertenece a Peça 8)
    if (
      perteneceAMismaFamiliaPieza(pz, piezaMadre) ||
      perteneceAMismaFamiliaPieza(pz, instanciaKey) ||
      perteneceAMismaFamiliaPieza(pz, cleanName) ||
      perteneceAMismaFamiliaPieza(pz, rawClean)
    ) {
      // Si ambos especifican número de sub-instancia de pieza (ej. Peça 8 (1) vs Peça 8 (2))
      const numPz = pz.match(/\((\d+)\)/)?.[1];
      const numMesh = (instanciaKey || cleanName || rawClean || '').match(/\((\d+)\)/)?.[1];
      if (numPz && numMesh) return numPz === numMesh;
      return true;
    }

    return false;
  });
}

export function resolverVisibilidadBoard(input: BoardVisibilityInput): {
  isMeshVisible: boolean;
  estaOcultaPorReglasPaso: boolean;
  estaOcultaPorGrupoCinematico: boolean;
  perteneceAlPasoActivo: boolean;
  esInactivoCristal?: boolean;
  esInactivoGlobal?: boolean;
} {
  const {
    name,
    cleanName,
    instanciaKey,
    piezaMadre,
    pestanaActiva,
    pasoActivoManual,
    pasosManual,
    modoPickingManual,
    asignacionVisible = true,
    capaVisible = true,
  } = input;

  // 1. Ocultamiento por Capa o Asignación específica de parte
  if (!asignacionVisible || !capaVisible) {
    return {
      isMeshVisible: false,
      estaOcultaPorReglasPaso: false,
      estaOcultaPorGrupoCinematico: false,
      perteneceAlPasoActivo: false,
    };
  }

  // 2. Solo aplicar reglas de Manual en pestana === 'manual'
  if (pestanaActiva !== 'manual' || !pasoActivoManual) {
    return {
      isMeshVisible: true,
      estaOcultaPorReglasPaso: false,
      estaOcultaPorGrupoCinematico: false,
      perteneceAlPasoActivo: false,
    };
  }

  // 3. Bloques Funcionales / Grupos Cinemáticos (Soberanía e Independencia Absoluta)
  let estaOcultaPorGrupoCinematico = false;
  let esPiezaDeBloqueFuncional = false;
  const pasoConGrupos = (pasoActivoManual.showcase?.gruposCinematicos && pasoActivoManual.showcase.gruposCinematicos.length > 0)
    ? pasoActivoManual
    : pasosManual.find((p) => p.id === 'P00' || p.tipo === 'showcase');

  if (pasoConGrupos?.showcase?.gruposCinematicos) {
    const grupoEncontrado = pasoConGrupos.showcase.gruposCinematicos.find((g) =>
      g.piezas.some(
        (pz) =>
          pz === piezaMadre ||
          pz === cleanName ||
          (instanciaKey && pz === instanciaKey) ||
          extraerPiezaMadre(pz) === piezaMadre ||
          (instanciaKey && extraerPiezaMadre(pz) === instanciaKey)
      )
    );
    if (grupoEncontrado) {
      esPiezaDeBloqueFuncional = true;
      estaOcultaPorGrupoCinematico = Boolean(grupoEncontrado.oculto);
    }
  }

  if (estaOcultaPorGrupoCinematico) {
    return {
      isMeshVisible: false,
      estaOcultaPorReglasPaso: false,
      estaOcultaPorGrupoCinematico: true,
      perteneceAlPasoActivo: false,
    };
  }

  if (pasoActivoManual.tipo === 'showcase') {
    return {
      isMeshVisible: true,
      estaOcultaPorReglasPaso: false,
      estaOcultaPorGrupoCinematico: false,
      perteneceAlPasoActivo: false,
    };
  }

  // 4. En Pasos de Ensamble (P01+): Pertenencia canónica al paso
  // 🛡️ REGLA SUPREMA DE AISLAMIENTO Y BLINDAJE:
  const subbloquesPaso = pasoActivoManual.subbloques || [];
  const esPickingSubbloque = modoPickingManual.activo && Boolean(modoPickingManual.grupoId) && subbloquesPaso.some((s) => s.id === modoPickingManual.grupoId);
  const capasEsperaPaso = pasoActivoManual.configuracionCinematica?.piezasEspera || [];
  const capasPlus = pasoActivoManual.multiplePlus?.capas || [];
  const esPickingCapa = modoPickingManual.activo && Boolean(modoPickingManual.grupoId) && (
    capasEsperaPaso.some((c) => c.nombrePieza === modoPickingManual.grupoId) ||
    capasPlus.some((c) => c.id === modoPickingManual.grupoId)
  );

  // 🧩 Recopilación de piezas y herrajes de Bloques Heredados (Pasos anteriores cronológicamente y bloques declarados)
  const piezasHeredadas: string[] = [];
  const herrajesHeredados: string[] = [];
  const bloquesHeredadosIds = pasoActivoManual.bloquesHeredadosIds || [];
  const bloquesVisibles = pasoActivoManual.bloquesHeredadosVisibles || {};

  // 1. Heredar automáticamente todo lo ensamblado en pasos previos cronológicamente
  const currentIndex = pasosManual.findIndex((p) => p.id === pasoActivoManual.id);
  const pasosPrevios = currentIndex > 0 ? pasosManual.slice(0, currentIndex) : [];

  for (const pasoPrevio of pasosPrevios) {
    if (pasoPrevio.multiplePlus?.capas && pasoPrevio.multiplePlus.capas.length > 0) {
      for (const cp of pasoPrevio.multiplePlus.capas) {
        if (cp.tableros) piezasHeredadas.push(...cp.tableros.map((t) => t.id));
        if (cp.herrajes) herrajesHeredados.push(...cp.herrajes.map((h) => h.id));
        if (cp.congelados) herrajesHeredados.push(...cp.congelados.map((h) => h.id));
      }
    } else if (pasoPrevio.tipo === "ensamble") {
      if (pasoPrevio.piezasAsignadas) piezasHeredadas.push(...pasoPrevio.piezasAsignadas);
      if (pasoPrevio.herrajesAsignados) {
        for (const h of pasoPrevio.herrajesAsignados) {
          herrajesHeredados.push(typeof h === "string" ? h : (h as any).id);
        }
      }
    }
  }

  // 2. Heredar bloques declarados explícitamente
  for (const bId of bloquesHeredadosIds) {
    if (bloquesVisibles[bId] !== false) {
      const pasoHeredado = pasosManual.find((p) => p.id === bId);
      if (pasoHeredado) {
        if (pasoHeredado.multiplePlus?.capas && pasoHeredado.multiplePlus.capas.length > 0) {
          for (const cp of pasoHeredado.multiplePlus.capas) {
            if (cp.tableros) piezasHeredadas.push(...cp.tableros.map((t) => t.id));
            if (cp.herrajes) herrajesHeredados.push(...cp.herrajes.map((h) => h.id));
            if (cp.congelados) herrajesHeredados.push(...cp.congelados.map((h) => h.id));
          }
        } else if (pasoHeredado.tipo === "ensamble") {
          if (pasoHeredado.piezasAsignadas) piezasHeredadas.push(...pasoHeredado.piezasAsignadas);
          if (pasoHeredado.herrajesAsignados) {
            for (const h of pasoHeredado.herrajesAsignados) {
              herrajesHeredados.push(typeof h === "string" ? h : (h as any).id);
            }
          }
        }
      }
    }
  }

  // 🎬 Extraer todas las piezas y herrajes configurados en Capas de Animación (piezasEspera) y Múltiple Plus (Activas)
  const piezasCapasCinematica: string[] = [];
  const herrajesCapasCinematica: string[] = [];

  for (const c of capasEsperaPaso) {
    if (c.nombrePieza) piezasCapasCinematica.push(c.nombrePieza);
    if (c.tablerosAsignados) piezasCapasCinematica.push(...c.tablerosAsignados);
    if (c.herrajesCohesionados) herrajesCapasCinematica.push(...c.herrajesCohesionados);
    if (c.herrajesCongelados) herrajesCapasCinematica.push(...c.herrajesCongelados);
  }

  for (const cp of capasPlus) {
    if (cp.tableros) piezasCapasCinematica.push(...cp.tableros.map((t) => t.id));
    if (cp.herrajes) herrajesCapasCinematica.push(...cp.herrajes.map((h) => h.id));
    if (cp.congelados) herrajesCapasCinematica.push(...cp.congelados.map((h) => h.id));
  }

  const esMultiplePlus = pasoActivoManual.tipo === "multiple_plus" || Boolean(pasoActivoManual.multiplePlus?.capas && pasoActivoManual.multiplePlus.capas.length > 0);
  const modoHeredados = pasoActivoManual.multiplePlus?.modoVisualizacionHeredados || "solido";
  const modoInactivos = pasoActivoManual.multiplePlus?.modoVisualizacionInactivos || "oculto";

  const pickingTemporal = (modoPickingManual.activo && !modoPickingManual.grupoId && modoPickingManual.pasoId === pasoActivoManual.id)
    ? modoPickingManual.piezasTemporalmenteSeleccionadas
    : [];

  const activasPaso = [
    ...piezasCapasCinematica,
    ...herrajesCapasCinematica,
    ...pickingTemporal,
  ];

  const heredadasPaso = [
    ...piezasHeredadas,
    ...herrajesHeredados,
  ];

  const asignadasPaso = esMultiplePlus
    ? [...activasPaso, ...heredadasPaso]
    : [
        ...(pasoActivoManual.piezasAsignadas || []),
        ...(pasoActivoManual.herrajesAsignados || []),
        ...activasPaso,
        ...heredadasPaso,
      ];

  const perteneceAlPasoActivo = evaluarPertenenciaPaso(asignadasPaso, name, cleanName, instanciaKey, piezaMadre);
  const esPiezaActiva = evaluarPertenenciaPaso(activasPaso, name, cleanName, instanciaKey, piezaMadre);
  const esPiezaHeredada = !esPiezaActiva && evaluarPertenenciaPaso(heredadasPaso, name, cleanName, instanciaKey, piezaMadre);

  // 5. Reglas de Aislamiento
  let estaOcultaPorReglasPaso = false;

  // 5.0 Bloque estándar: aislar completamente
  if (pasoActivoManual.tipo === 'bloque_estandar') {
    estaOcultaPorReglasPaso = true;
  }

  // 5.1 Picking de Subbloque: si no pertenece al paso P02, se oculta estrictamente
  if (esPickingSubbloque && !perteneceAlPasoActivo) {
    estaOcultaPorReglasPaso = true;
  }

  // 5.2 Control de la Trinidad del Ensamble en Múltiple Plus (Activos, Heredados, Inactivos):
  let esInactivoCristal = false;
  let esInactivoGlobal = false;

  if (esMultiplePlus) {
    if (esPiezaActiva) {
      // Activa en el paso actual: siempre sólida, visible
      esInactivoCristal = false;
      esInactivoGlobal = false;
    } else if (esPiezaHeredada) {
      // Heredada de pasos anteriores: controlada por modoHeredados (por defecto "solido")
      if (modoHeredados === "oculto") {
        estaOcultaPorReglasPaso = true;
      } else if (modoHeredados === "cristal") {
        esInactivoCristal = true;
      }
      // Si modoHeredados === "solido", permanece visible y sólida PBR (esInactivoCristal = false)
    } else if (!esPickingCapa) {
      if (esPiezaDeBloqueFuncional) {
        // 🛡️ Las piezas de Bloques Funcionales NO pertenecen a la capa virtual de inactivos
        // Permanecen ocultas durante el ensamble del casco si su bloque no está activo
        estaOcultaPorReglasPaso = true;
      } else {
        // Inactiva (futura no ensamblada): controlada por modoInactivos (por defecto "oculto")
        if (modoInactivos === "oculto") {
          estaOcultaPorReglasPaso = true;
        } else if (modoInactivos === "cristal") {
          esInactivoCristal = true;
        } else if (modoInactivos === "global") {
          esInactivoGlobal = true;
        }
      }
    }
  } else if (!esPickingCapa && pasoActivoManual.ocultarNoAsignadas && !perteneceAlPasoActivo) {
    estaOcultaPorReglasPaso = true;
  }

  // 5.3 Bloques Heredados Apagados: si el usuario apagó el ojito de un bloque heredado específico
  if (!estaOcultaPorReglasPaso) {
    for (const bId of bloquesHeredadosIds) {
      if (bloquesVisibles[bId] === false) {
        const pasoHeredado = pasosManual.find((p) => p.id === bId);
        if (pasoHeredado) {
          const elementosBloqueApagado = [
            ...(pasoHeredado.piezasAsignadas || []),
            ...(pasoHeredado.herrajesAsignados || [])
          ];
          if (evaluarPertenenciaPaso(elementosBloqueApagado, name, cleanName, instanciaKey, piezaMadre)) {
            estaOcultaPorReglasPaso = true;
            break;
          }
        }
      }
    }
  }

  // 5.4 Control de Visibilidad Individual por Capa (Bombillito visible === false o capasOcultas)
  // Optimizado a O(1) sin bucles de expresiones regulares para garantizar 60 FPS
  if (!estaOcultaPorReglasPaso) {
    const capasOcultasLista = pasoActivoManual.capasOcultas;
    if (capasOcultasLista && capasOcultasLista.length > 0) {
      const idKey = (instanciaKey || cleanName || name).toLowerCase().trim();
      const cnKey = cleanName.toLowerCase().trim();
      const pmKey = (piezaMadre || "").toLowerCase().trim();

      const esHw =
        isHardwareMeshName(name) ||
        isHardwareMeshName(cleanName) ||
        (instanciaKey ? isHardwareMeshName(instanciaKey) : false) ||
        esHerrajeNombre(name) ||
        esHerrajeNombre(cleanName) ||
        (instanciaKey ? esHerrajeNombre(instanciaKey) : false);

      const estaOculta = capasOcultasLista.some((pz: string) => {
        if (!pz) return false;
        const pzLow = pz.toLowerCase().trim();
        if (pzLow === idKey || pzLow === cnKey || pzLow === pmKey) return true;

        if (esHw) {
          // 🛡️ HERRAJE: La coincidencia DEBE ser estricta a la misma instancia física numerada
          // NUNCA ocultar todas las cavilhas o porcas del mueble si solo se ocultó una específica
          return coincidenMismoHerraje(pz, idKey) || coincidenMismoHerraje(pz, cnKey) || coincidenMismoHerraje(pz, pmKey);
        }

        return (
          perteneceAMismaFamiliaPieza(pz, cleanName) ||
          perteneceAMismaFamiliaPieza(pz, piezaMadre)
        );
      });

      if (estaOculta) {
        estaOcultaPorReglasPaso = true;
      }
    }

    if (!estaOcultaPorReglasPaso) {
      const esMultiplePlus = pasoActivoManual.tipo === "multiple_plus" || Boolean(pasoActivoManual.multiplePlus?.capas && pasoActivoManual.multiplePlus.capas.length > 0);
      if (esMultiplePlus && capasPlus.length > 0) {
        const capaPlusApagada = capasPlus.some((c) => {
          if (c.visible !== false) return false;
          const elementosCapa = [
            ...(c.tableros || []).map((t) => t.id),
            ...(c.herrajes || []).map((h) => h.id),
            ...(c.congelados || []).map((h) => h.id),
          ];
          return evaluarPertenenciaPaso(elementosCapa, name, cleanName, instanciaKey, piezaMadre);
        });
        if (capaPlusApagada) {
          estaOcultaPorReglasPaso = true;
        }
      } else {
        const confs = pasoActivoManual.configuracionCinematica?.piezasEspera;
        if (confs && confs.length > 0) {
          const confApagada = confs.some((c) => {
            if (c.visible !== false) return false;
            return (
              c.nombrePieza === cleanName ||
              c.nombrePieza === piezaMadre ||
              perteneceAMismaFamiliaPieza(c.nombrePieza, cleanName) ||
              perteneceAMismaFamiliaPieza(c.nombrePieza, piezaMadre)
            );
          });

          if (confApagada) {
            estaOcultaPorReglasPaso = true;
          }
        }
      }
    }
  }

  // 5.5 Ojito de Subbloque: si un subbloque está con su ojito apagado (sub.oculto === true)
  if (!estaOcultaPorReglasPaso) {
    const estaEnSubbloqueOculto = subbloquesPaso.some((sub) => {
      if (!sub.oculto) return false;
      const elementosSub = [...(sub.piezas || []), ...(sub.herrajes || [])];
      return evaluarPertenenciaPaso(elementosSub, name, cleanName, instanciaKey, piezaMadre);
    });

    if (estaEnSubbloqueOculto) {
      estaOcultaPorReglasPaso = true;
    }
  }

  // 5.6 Modo Empacar en Subbloque (Bombillo del Subbloque apagado en gris / picking activo en subbloque)
  if (!estaOcultaPorReglasPaso && esPickingSubbloque && modoPickingManual.modo === "agregar") {
    const subActivo = subbloquesPaso.find((s) => s.id === modoPickingManual.grupoId);
    if (subActivo) {
      const elementosSub = [
        ...(subActivo.piezas || []),
        ...(subActivo.herrajes || []),
        ...(modoPickingManual.piezasTemporalmenteSeleccionadas || [])
      ];
      if (evaluarPertenenciaPaso(elementosSub, name, cleanName, instanciaKey, piezaMadre)) {
        estaOcultaPorReglasPaso = true;
      }
    }
  }

  // 5.6.5 Modo Empacar en Capa de Animación (Bombillo de la Capa apagado en gris / picking activo en capa)
  if (!estaOcultaPorReglasPaso && esPickingCapa && modoPickingManual.modo === "agregar") {
    const capaActiva = capasEsperaPaso.find((c) => c.nombrePieza === modoPickingManual.grupoId);
    const capaPlusActiva = capasPlus.find((c) => c.id === modoPickingManual.grupoId);
    if (capaActiva) {
      const elementosCapa = [
        capaActiva.nombrePieza,
        ...(capaActiva.herrajesCohesionados || []),
        ...(capaActiva.herrajesCongelados || []),
        ...(capaActiva.tablerosAsignados || []),
        ...(modoPickingManual.piezasTemporalmenteSeleccionadas || [])
      ];
      if (evaluarPertenenciaPaso(elementosCapa, name, cleanName, instanciaKey, piezaMadre)) {
        estaOcultaPorReglasPaso = true;
      }
    } else if (capaPlusActiva) {
      const elementosCapa = [
        ...(capaPlusActiva.tableros || []).map((t) => t.id),
        ...(capaPlusActiva.herrajes || []).map((h) => h.id),
        ...(capaPlusActiva.congelados || []).map((h) => h.id),
        ...(modoPickingManual.piezasTemporalmenteSeleccionadas || [])
      ];
      if (evaluarPertenenciaPaso(elementosCapa, name, cleanName, instanciaKey, piezaMadre)) {
        estaOcultaPorReglasPaso = true;
      }
    }
  }

  // 5.7 Modo Empacar en Bloque (Bombillo del Bloque apagado en gris / picking activo en bloque general)
  if (!estaOcultaPorReglasPaso && !esPickingSubbloque && !esPickingCapa) {
    const bombilloBloqueApagado = Boolean(
      pasoActivoManual.piezasOcultas ||
      (modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivoManual.id && !modoPickingManual.grupoId)
    );
    if (bombilloBloqueApagado && perteneceAlPasoActivo) {
      estaOcultaPorReglasPaso = true;
    }
  }

  const isMeshVisible = !estaOcultaPorGrupoCinematico && !estaOcultaPorReglasPaso;

  return {
    isMeshVisible,
    estaOcultaPorReglasPaso,
    estaOcultaPorGrupoCinematico,
    perteneceAlPasoActivo,
    esInactivoCristal: Boolean(esInactivoCristal),
    esInactivoGlobal: Boolean(esInactivoGlobal),
  };
}
