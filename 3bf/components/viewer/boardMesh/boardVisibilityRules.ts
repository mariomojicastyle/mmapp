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
  const pasoConGrupos = (pasoActivoManual.showcase?.gruposCinematicos && pasoActivoManual.showcase.gruposCinematicos.length > 0)
    ? pasoActivoManual
    : pasosManual.find((p) => p.id === 'P00' || p.tipo === 'showcase');

  if (pasoConGrupos?.showcase?.gruposCinematicos) {
    estaOcultaPorGrupoCinematico = pasoConGrupos.showcase.gruposCinematicos.some(
      (g) =>
        g.oculto &&
        g.piezas.some(
          (pz) =>
            pz === piezaMadre ||
            pz === cleanName ||
            (instanciaKey && pz === instanciaKey) ||
            extraerPiezaMadre(pz) === piezaMadre ||
            (instanciaKey && extraerPiezaMadre(pz) === instanciaKey)
        )
    );
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
  // - Si estamos en picking de subbloque (grupoId activo), las piezas temporalmente seleccionadas
  //   pertenecen a ese subbloque específico. NO deben usarse para alterar la pertenencia macro del paso.
  // - Solo si el picking es para el paso general (sin grupoId), se suman a las asignadas del paso.
  const esPickingSubbloque = modoPickingManual.activo && Boolean(modoPickingManual.grupoId);
  const asignadasPaso = [
    ...(pasoActivoManual.piezasAsignadas || []),
    ...(pasoActivoManual.herrajesAsignados || []),
    ...((modoPickingManual.activo && !modoPickingManual.grupoId && modoPickingManual.pasoId === pasoActivoManual.id)
      ? modoPickingManual.piezasTemporalmenteSeleccionadas
      : [])
  ];

  const perteneceAlPasoActivo = evaluarPertenenciaPaso(asignadasPaso, name, cleanName, instanciaKey, piezaMadre);

  // 5. Reglas de Aislamiento
  let estaOcultaPorReglasPaso = false;
  const subbloquesPaso = pasoActivoManual.subbloques || [];

  // 5.0 Bloque estándar: aislar completamente
  if (pasoActivoManual.tipo === 'bloque_estandar') {
    estaOcultaPorReglasPaso = true;
  }

  // 5.1 Picking de Subbloque: si no pertenece al paso P02, se oculta estrictamente
  if (esPickingSubbloque && !perteneceAlPasoActivo) {
    estaOcultaPorReglasPaso = true;
  }

  // 5.2 Invertir del Bloque: si Invertir está activo, oculta todo lo que NO pertenezca a este bloque
  if (pasoActivoManual.ocultarNoAsignadas && !perteneceAlPasoActivo) {
    estaOcultaPorReglasPaso = true;
  }

  // 5.3 Ojito de Subbloque: si un subbloque está con su ojito apagado (sub.oculto === true)
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

  // 5.4 Modo Empacar en Subbloque (Bombillo del Subbloque apagado en gris / picking activo en subbloque)
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

  // 5.5 Modo Empacar en Bloque (Bombillo del Bloque apagado en gris / picking activo en bloque general)
  if (!estaOcultaPorReglasPaso && !esPickingSubbloque) {
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
    perteneceAlPasoActivo
  };
}
