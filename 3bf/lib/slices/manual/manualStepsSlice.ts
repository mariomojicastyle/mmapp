import {
  getCachedManualData,
  generarPasosManualesPorDefecto,
  sanitizarPasosManuales,
  guardarPasosEnCacheLocal,
  encontrarSiguienteIdPasoDisponible,
} from "../../storeDefaults";
import type {
  PasoManualStudio,
  ElementoSecuenciaCinematica,
} from "../../storeTypes";
import { extraerPiezaMadre, perteneceAMismaFamiliaPieza } from "../../piezaMadreUtils";
import { coincidenMismoHerraje } from "../../engine/cadStateUtils";

export const createManualStepsSlice = (set: any, get: any): any => {
  const initialCachedManual = getCachedManualData();
  const pasosIniciales =
    initialCachedManual && initialCachedManual.pasos && initialCachedManual.pasos.length > 0
      ? initialCachedManual.pasos
      : generarPasosManualesPorDefecto();

  return {
    pasosManual: pasosIniciales,
    pasoActivoManualId: pasosIniciales[0]?.id || "P00",
    simuladorMovilActivo: false,
    simuladorMovilOrientacion: "horizontal",
    setSimuladorMovilActivo: (simuladorMovilActivo: boolean) => set({ simuladorMovilActivo }),
    toggleSimuladorMovil: () => set((s: any) => ({ simuladorMovilActivo: !s.simuladorMovilActivo })),
    setSimuladorMovilOrientacion: (simuladorMovilOrientacion: "vertical" | "horizontal") =>
      set({ simuladorMovilOrientacion }),
    toggleSimuladorMovilOrientacion: () =>
      set((s: any) => ({
        simuladorMovilOrientacion: s.simuladorMovilOrientacion === "vertical" ? "horizontal" : "vertical",
      })),
    autoEnfoqueCamaraManual: false,
    setAutoEnfoqueCamaraManual: (autoEnfoqueCamaraManual: boolean) => set({ autoEnfoqueCamaraManual }),

    piezaEnPosicionamientoManual: null,
    setPiezaEnPosicionamientoManual: (piezaEnPosicionamientoManual: any) =>
      set({ piezaEnPosicionamientoManual }),
    ultimaPiezaCalibrada: null,
    setUltimaPiezaCalibrada: (ultimaPiezaCalibrada: string | null) => set({ ultimaPiezaCalibrada }),
    herrajesHovered: null,
    setHerrajesHovered: (herrajesHovered: string[] | null) => set({ herrajesHovered }),
    vistaPiezasDesplazadas: false,
    setVistaPiezasDesplazadas: (vistaPiezasDesplazadas: boolean) => set({ vistaPiezasDesplazadas }),

    setPasosManual: (pasosManual: PasoManualStudio[]) => {
      const sanitizados = sanitizarPasosManuales(pasosManual);
      set({ pasosManual: sanitizados });
      guardarPasosEnCacheLocal(sanitizados, get().manualActivoGuardado);
    },

  seleccionarPasoManualActivo: (pasoActivoManualId: string) =>
    set({
      pasoActivoManualId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      piezaEnPosicionamientoManual: null,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    }),

  crearPasoManual: (tipo: "ensamble" | "showcase" | "bloque_estandar" | "multiple_plus" = "multiple_plus") => {
    const state = get();
    const { id: nuevoId, numero: num } = encontrarSiguienteIdPasoDisponible(state.pasosManual);
    const tipoEfectivo = tipo === "ensamble" ? "multiple_plus" : tipo;

    const nuevoPaso: PasoManualStudio = {
      id: nuevoId,
      numero: num,
      tipo: tipoEfectivo,
      titulo: tipoEfectivo === "showcase" ? `${nuevoId}: Showcase` : `Paso ${nuevoId}: Armado por Capas`,
      descripcion: "Nuevo paso de ensamble",
      duracionTotal: 10.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      subbloques: [],
      piezasOcultas: false,
      ocultarNoAsignadas: false,
      multiplePlus: tipoEfectivo === "multiple_plus" ? {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      } : undefined,
      guionEs: "",
      guionPt: "",
      guionEn: "",
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: 10.0,
    };

    const nuevosPasos = [...state.pasosManual];
    const indiceInsercion = nuevosPasos.findIndex((p) => (p.numero ?? 0) > num);
    if (indiceInsercion >= 0) {
      nuevosPasos.splice(indiceInsercion, 0, nuevoPaso);
    } else {
      nuevosPasos.push(nuevoPaso);
    }

    set({
      pasosManual: nuevosPasos,
      pasoActivoManualId: nuevoId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    });
    guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
  },

  eliminarPasoManual: (pasoId: string) => {
    const state = get();
    if (pasoId === "P00" || state.pasosManual.length <= 1) return;
    const filtrados = state.pasosManual.filter((p: any) => p.id !== pasoId);
    const sanitizados = sanitizarPasosManuales(filtrados);
    let siguienteActivo = state.pasoActivoManualId;
    if (state.pasoActivoManualId === pasoId) {
      const idxEliminado = state.pasosManual.findIndex((p: any) => p.id === pasoId);
      const prevIdx = Math.max(0, idxEliminado - 1);
      siguienteActivo = sanitizados[prevIdx]?.id || sanitizados[0]?.id || "P00";
    }
    set({
      pasosManual: sanitizados,
      pasoActivoManualId: siguienteActivo,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    });
    guardarPasosEnCacheLocal(sanitizados, state.manualActivoGuardado);
  },

  actualizarPasoManual: (pasoId: string, data: Partial<PasoManualStudio>) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => (p.id === pasoId ? { ...p, ...data } : p));
    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  reordenarSecuenciaPaso: (pasoId: string, nuevaSecuencia: ElementoSecuenciaCinematica[]) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => (p.id === pasoId ? { ...p, secuencia: nuevaSecuencia } : p));
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezaAPasoManual: (pasoId: string, nombrePieza: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      if (p.piezasAsignadas.includes(nombrePieza)) return p;
      const nuevasPiezas = [...p.piezasAsignadas, nombrePieza];
      return { ...p, piezasAsignadas: nuevasPiezas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },

  desasignarPiezaDePasoManual: (pasoId: string, nombrePieza: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        piezasAsignadas: p.piezasAsignadas.filter((nom: string) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s: any) => s.nombreNodo !== nombrePieza && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom: string) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarHerrajeAPasoManual: (pasoId: string, nombreHerraje: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      if (p.herrajesAsignados.includes(nombreHerraje)) return p;
      const nuevosHerrajes = [...p.herrajesAsignados, nombreHerraje];
      return { ...p, herrajesAsignados: nuevosHerrajes };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },

  desasignarHerrajeDePasoManual: (pasoId: string, nombreHerraje: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombreHerraje);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        herrajesAsignados: p.herrajesAsignados.filter((nom: string) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s: any) => s.nombreNodo !== nombreHerraje && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom: string) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  autoGenerarSecuenciaPaso: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;
    if (paso.tipo === "showcase") return;

    let t = 0.5;
    const nuevaSecuencia: ElementoSecuenciaCinematica[] = [];

    // 1. Tarugos entran primero con martillo de goma
    paso.herrajesAsignados
      .filter((h: string) => h.toLowerCase().includes("tarugo") || h.toLowerCase().includes("cavilha"))
      .forEach((tarugo: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${tarugo}_${idx}`,
          nombreNodo: tarugo,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.0,
          popIn: true,
          distanciaAproximacion: 0.12,
          herramienta: "martillo",
          impactosHerramienta: 3,
        });
        t += 1.8;
      });

    // 2. Pernos / Minifix con destornillador
    paso.herrajesAsignados
      .filter((h: string) => (h.toLowerCase().includes("minifix") || h.toLowerCase().includes("perno")) && !h.toLowerCase().includes("tarugo"))
      .forEach((perno: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${perno}_${idx}`,
          nombreNodo: perno,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.0,
          popIn: true,
          distanciaAproximacion: 0.15,
          rotacionGrados: 180,
          herramienta: "destornillador",
        });
        t += 1.8;
      });

    // 3. Piezas de madera que se acoplan (distintas de la piezaMaster)
    paso.piezasAsignadas
      .filter((p: string) => p !== paso.piezaMaster)
      .forEach((pieza: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${pieza}_${idx}`,
          nombreNodo: pieza,
          tipo: "pieza",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.5,
          popIn: true,
          distanciaAproximacion: 0.25,
          herramienta: "ninguna",
        });
        t += 2.8;
      });

    // 4. Tornillos estructurales con Llave Allen (720 deg)
    paso.herrajesAsignados
      .filter((h: string) => h.toLowerCase().includes("tornillo") || h.toLowerCase().includes("parafuso"))
      .forEach((tornillo: string, idx: number) => {
        nuevaSecuencia.push({
          id: `seq_${tornillo}_${idx}`,
          nombreNodo: tornillo,
          tipo: "herraje",
          tiempoInicio: Number(t.toFixed(1)),
          duracionMovimiento: 2.5,
          popIn: true,
          distanciaAproximacion: 0.15,
          rotacionGrados: 720,
          herramienta: "llave_allen",
        });
        t += 2.2;
      });

    const duracionFinal = Math.max(paso.duracionAudioSegundos || 8.0, Number((t + 1.0).toFixed(1)));

    const actualizados = state.pasosManual.map((p: any) =>
      p.id === pasoId ? { ...p, secuencia: nuevaSecuencia, duracionTotal: duracionFinal } : p
    );
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  reordenarPasosManual: (origenIndex: number, destinoIndex: number) => {
    const state = get();
    if (origenIndex <= 0 || destinoIndex <= 0) return; // P00 está fijo y protegido
    if (origenIndex === destinoIndex) return;
    if (origenIndex >= state.pasosManual.length || destinoIndex >= state.pasosManual.length) return;

    const lista = [...state.pasosManual];
    const [removido] = lista.splice(origenIndex, 1);
    lista.splice(destinoIndex, 0, removido);

    const idActivoAnterior = state.pasoActivoManualId;
    let nuevoIdActivo = idActivoAnterior;

    const reindexados = lista.map((p, idx) => {
      if (idx === 0) return p; // P00 inalterado
      const nuevoId = `P${String(idx).padStart(2, "0")}`;
      if (p.id === idActivoAnterior) {
        nuevoIdActivo = nuevoId;
      }
      return {
        ...p,
        id: nuevoId,
        numero: idx,
      };
    });

    set({
      pasosManual: reindexados,
      pasoActivoManualId: nuevoIdActivo,
    });
    guardarPasosEnCacheLocal(reindexados, state.manualActivoGuardado);
  },

  // 🧩 BLOQUES HEREDADOS Y MULTI-DESTINO POR CAPA
  asociarBloqueHeredado: (pasoId: string, bloqueId: string) => {
    if (pasoId === bloqueId) return;
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const idsActuales = p.bloquesHeredadosIds || [];
      if (idsActuales.includes(bloqueId)) return p;
      const nuevosIds = [...idsActuales, bloqueId];
      const visActuales = p.bloquesHeredadosVisibles || {};
      return {
        ...p,
        bloquesHeredadosIds: nuevosIds,
        bloquesHeredadosVisibles: { ...visActuales, [bloqueId]: true },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  desasociarBloqueHeredado: (pasoId: string, bloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const idsActuales = p.bloquesHeredadosIds || [];
      const nuevosIds = idsActuales.filter((id: string) => id !== bloqueId);
      const visActuales = { ...(p.bloquesHeredadosVisibles || {}) };
      delete visActuales[bloqueId];
      return {
        ...p,
        bloquesHeredadosIds: nuevosIds,
        bloquesHeredadosVisibles: visActuales,
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadBloqueHeredado: (pasoId: string, bloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const visActuales = { ...(p.bloquesHeredadosVisibles || {}) };
      const estadoActual = visActuales[bloqueId] !== false;
      visActuales[bloqueId] = !estadoActual;
      return {
        ...p,
        bloquesHeredadosVisibles: visActuales,
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadCapaPieza: (pasoId: string, nombrePieza: string, herrajesAsociados?: string[]) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    let nuevoEstadoVisible = false;
    let todosLosHerrajesCapa: string[] = herrajesAsociados ? [...herrajesAsociados] : [];

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const confCin = p.configuracionCinematica || {
        velocidadPiezasCmS: 15,
        velocidadHerrajesCmS: 8,
        piezasEspera: [],
      };

      const piezasEspera = [...(confCin.piezasEspera || [])];
      const idxExistente = piezasEspera.findIndex(
        (pz: any) =>
          pz.nombrePieza === nombrePieza ||
          extraerPiezaMadre(pz.nombrePieza) === pm ||
          perteneceAMismaFamiliaPieza(pz.nombrePieza, nombrePieza)
      );

      const pExistente = idxExistente >= 0 ? piezasEspera[idxExistente] : null;

      // Si no se pasaron herrajesAsociados desde la UI, recolectar de la pieza de espera existente
      if (todosLosHerrajesCapa.length === 0 && pExistente) {
        todosLosHerrajesCapa = Array.from(new Set([
          ...(pExistente.herrajesCohesionados || []),
          ...(pExistente.herrajesCongelados || []),
          ...(pExistente.herrajesActivados || []),
          ...Object.keys(pExistente.direccionesHerrajes || {}),
          ...Object.keys(pExistente.tiemposAparicionHerrajes || {}),
        ]));
      }

      let nuevasPiezasEspera: any[];
      if (pExistente) {
        const visActual = pExistente.visible !== false;
        nuevoEstadoVisible = !visActual;
        nuevasPiezasEspera = piezasEspera.map((item: any, idx: number) => {
          if (idx === idxExistente) {
            return { ...item, visible: nuevoEstadoVisible };
          }
          return item;
        });
      } else {
        nuevoEstadoVisible = false;
        nuevasPiezasEspera = [
          ...piezasEspera,
          {
            nombrePieza,
            ordenEnsamble: piezasEspera.length + 1,
            offsetXCm: 0,
            offsetYCm: 0,
            offsetZCm: 0,
            apoyadaEnPiso: true,
            visible: false,
          },
        ];
      }

      const capasOcultasPrev = p.capasOcultas || [];
      let nuevasCapasOcultas: string[];
      if (!nuevoEstadoVisible) {
        nuevasCapasOcultas = Array.from(new Set([
          ...capasOcultasPrev,
          nombrePieza,
          pm,
          ...todosLosHerrajesCapa,
        ]));
      } else {
        const itemsARemover = new Set([nombrePieza, pm, ...todosLosHerrajesCapa]);
        nuevasCapasOcultas = capasOcultasPrev.filter(
          (c: string) =>
            !itemsARemover.has(c) &&
            !perteneceAMismaFamiliaPieza(c, nombrePieza) &&
            !todosLosHerrajesCapa.some((h) => coincidenMismoHerraje(h, c) || h.toLowerCase() === c.toLowerCase())
        );
      }

      return {
        ...p,
        capasOcultas: nuevasCapasOcultas,
        configuracionCinematica: {
          ...confCin,
          piezasEspera: nuevasPiezasEspera,
        },
      };
    });

    // 🚀 Feedback instantáneo en la escena Three.js para la Pieza Y todos sus Herrajes
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        searchRoot.traverse((obj: any) => {
          if (!obj.isMesh) return;
          const n = obj.name || "";
          const cn = obj.userData?.cleanName || "";
          const ik = obj.userData?.instanciaKey || "";
          const pmObj = obj.userData?.piezaMadre || extraerPiezaMadre(cn || n);

          const esLaPieza =
            n === nombrePieza ||
            cn === nombrePieza ||
            ik === nombrePieza ||
            pmObj === pm ||
            perteneceAMismaFamiliaPieza(n, nombrePieza) ||
            perteneceAMismaFamiliaPieza(cn, nombrePieza) ||
            perteneceAMismaFamiliaPieza(ik, nombrePieza);

          const esHerrajeDeEstaCapa = todosLosHerrajesCapa.some((h) =>
            coincidenMismoHerraje(h, ik) ||
            coincidenMismoHerraje(h, cn) ||
            coincidenMismoHerraje(h, n) ||
            h.toLowerCase().trim() === ik.toLowerCase().trim() ||
            h.toLowerCase().trim() === cn.toLowerCase().trim() ||
            h.toLowerCase().trim() === n.toLowerCase().trim()
          );

          if (esLaPieza || esHerrajeDeEstaCapa) {
            obj.visible = nuevoEstadoVisible;
          }
        });
      }
    }

    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  setPiezaDestinoCapa: (pasoId: string, nombrePieza: string, piezaDestinoId?: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const confCin = p.configuracionCinematica;
      if (!confCin || !confCin.piezasEspera) return p;

      const nuevasPiezasEspera = confCin.piezasEspera.map((pz: any) => {
        if (pz.nombrePieza === nombrePieza || extraerPiezaMadre(pz.nombrePieza) === pm) {
          return { ...pz, piezaDestinoId: piezaDestinoId || undefined };
        }
        return pz;
      });

      return {
        ...p,
        configuracionCinematica: {
          ...confCin,
          piezasEspera: nuevasPiezasEspera,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  eliminarCapaPiezaManual: (pasoId: string, nombrePieza: string) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    const targetClean = nombrePieza.replace(/^RH_OUT:\s*/i, "").trim();

    const coincideConTarget = (entry: string) => {
      if (!entry) return false;
      const entryClean = entry.replace(/^RH_OUT:\s*/i, "").trim();
      if (entryClean === targetClean || entry === nombrePieza) return true;
      const entryPM = extraerPiezaMadre(entryClean);
      if (entryPM === pm || entryPM === targetClean) return true;
      return perteneceAMismaFamiliaPieza(entryClean, targetClean);
    };

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;

      // 1. Filtrar piezas asignadas del paso
      const nuevasPiezas = (p.piezasAsignadas || []).filter((pz: string) => !coincideConTarget(pz));

      // 2. Filtrar configuración de piezas en espera (re-indexando ordenEnsamble)
      const confCin = p.configuracionCinematica;
      let nuevasPiezasEspera = confCin?.piezasEspera || [];
      if (confCin && confCin.piezasEspera) {
        nuevasPiezasEspera = confCin.piezasEspera
          .filter((pz: any) => !coincideConTarget(pz.nombrePieza))
          .map((pz: any, idx: number) => ({
            ...pz,
            ordenEnsamble: idx + 1,
          }));
      }

      // 3. Filtrar de la secuencia cinemática
      const nuevaSecuencia = (p.secuencia || []).filter((s: any) => !coincideConTarget(s.nombreNodo));

      // 4. Si era la Pieza Master, desmarcarla
      let nuevaPiezaMaster = p.piezaMaster;
      if (nuevaPiezaMaster && coincideConTarget(nuevaPiezaMaster)) {
        nuevaPiezaMaster = undefined;
      }

      return {
        ...p,
        piezasAsignadas: nuevasPiezas,
        piezaMaster: nuevaPiezaMaster,
        secuencia: nuevaSecuencia,
        configuracionCinematica: confCin
          ? {
              ...confCin,
              piezasEspera: nuevasPiezasEspera,
            }
          : undefined,
      };
    });

    // 5. Restaurar posición original en escena 3D si estaba desplazada
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        searchRoot.traverse((obj: any) => {
          if (obj.isMesh && (coincideConTarget(obj.name) || coincideConTarget(obj.userData?.cleanName || ""))) {
            const pRest = obj.userData?.restPosition;
            if (pRest) {
              obj.position.copy(pRest);
              obj.updateWorldMatrix(true, true);
            }
          }
        });
      }
    }

    // 6. Sincronizar picking temporal si está activo en este paso
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (pz: string) => !coincideConTarget(pz)
        ),
      };
    }

    set({
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
  };
};
