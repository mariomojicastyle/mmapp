import { PasoManualStudio, ModoPickingManualState } from '@/lib/store';
import { extraerPiezaMadre } from '@/lib/piezaMadreUtils';

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

  return asignadas.some((pz) => {
    if (!pz) return false;

    // 1. Coincidencia directa con instanciaKey o piezaMadre
    if (instanciaKey && (pz === instanciaKey || pz.toLowerCase() === instanciaKey.toLowerCase())) {
      return true;
    }
    if (piezaMadre && (pz === piezaMadre || pz.toLowerCase() === piezaMadre.toLowerCase())) {
      return true;
    }

    // 2. Discriminación estricta de instancias numeradas
    const tieneInstanciaPz = Boolean(pz.match(/\s*\(\d+\)$/));
    const tieneInstanciaMesh = Boolean((instanciaKey || piezaMadre || '').match(/\s*\(\d+\)$/));
    if (tieneInstanciaPz && tieneInstanciaMesh) {
      return false;
    }

    // 3. Coincidencia por nombre limpio
    if (cleanName && (pz === cleanName || pz.toLowerCase() === cleanName.toLowerCase())) {
      return true;
    }
    if (rawClean && (pz === rawClean || pz.toLowerCase() === rawClean.toLowerCase())) {
      return true;
    }

    // 4. Coincidencia canónica de Pieza Madre
    const pmPz = extraerPiezaMadre(pz);
    const pmMesh = piezaMadre || (instanciaKey ? extraerPiezaMadre(instanciaKey) : extraerPiezaMadre(cleanName || rawClean));
    if (pmPz && pmMesh && pmPz.toLowerCase() === pmMesh.toLowerCase()) {
      if (!tieneInstanciaPz && !tieneInstanciaMesh) return true;
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

  // 5.0 Bloque estándar: aislar completamente
  if (pasoActivoManual.tipo === 'bloque_estandar') {
    estaOcultaPorReglasPaso = true;
  }

  // 5.1 Picking de Subbloque: si no pertenece al paso P02, se oculta estrictamente
  if (esPickingSubbloque && !perteneceAlPasoActivo) {
    estaOcultaPorReglasPaso = true;
  }

  // 5.2 Aislamiento de subbloques con Invert Hide
  const subbloquesPaso = pasoActivoManual.subbloques || [];
  if (subbloquesPaso.length > 0 && pasoActivoManual.ocultarNoAsignadas) {
    if (!perteneceAlPasoActivo) {
      estaOcultaPorReglasPaso = true;
    }
  }

  // 5.3 Invertir General: oculta todas las piezas que NO pertenecen a este bloque
  if (pasoActivoManual.ocultarNoAsignadas) {
    if (!perteneceAlPasoActivo) {
      estaOcultaPorReglasPaso = true;
    }
  }

  // 5.4 Ocultar piezas asignadas cuando el bombillo está apagado (modo empacar activo)
  // Solo aplica si NO está invertido (en modo Invertir, las asignadas deben estar visibles)
  if (!pasoActivoManual.ocultarNoAsignadas && (pasoActivoManual.piezasOcultas || (modoPickingManual.activo && modoPickingManual.modo === "agregar" && modoPickingManual.pasoId === pasoActivoManual.id)) && !esPickingSubbloque) {
    if (perteneceAlPasoActivo) {
      estaOcultaPorReglasPaso = true;
    }
  }

  // 5.5 Ojito individual de subbloque
  if (!estaOcultaPorReglasPaso) {
    const rawClean = name ? name.replace(/^RH_(?:OUT|IN):\s*/i, '').trim() : '';
    const estaEnSubbloqueOculto = subbloquesPaso.some((sub) => {
      if (!sub.oculto) return false;
      const elementosSub = [...(sub.piezas || []), ...(sub.herrajes || [])];
      return elementosSub.some((pz) => {
        if (!pz) return false;
        if (instanciaKey && (pz === instanciaKey || pz.toLowerCase() === instanciaKey.toLowerCase())) return true;
        if (piezaMadre && (pz === piezaMadre || pz.toLowerCase() === piezaMadre.toLowerCase())) return true;
        if (cleanName && (pz === cleanName || pz.toLowerCase() === cleanName.toLowerCase())) return true;
        if (rawClean && (pz === rawClean || pz.toLowerCase() === rawClean.toLowerCase())) return true;
        const pmPz = extraerPiezaMadre(pz);
        const pmMesh = piezaMadre || (instanciaKey ? extraerPiezaMadre(instanciaKey) : extraerPiezaMadre(cleanName || rawClean));
        return pmPz && pmMesh && pmPz.toLowerCase() === pmMesh.toLowerCase();
      });
    });

    if (estaEnSubbloqueOculto) {
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
