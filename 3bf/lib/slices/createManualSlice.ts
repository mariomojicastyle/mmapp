// @ts-nocheck
import {
  getCachedManualData,
  sanitizarPasosManuales,
  guardarPasosEnCacheLocal,
  encontrarSiguienteIdPasoDisponible,
  generarPasosManualesPorDefecto,
  BLOQUES_ESTANDAR_DEFAULT,
  STORAGE_KEY_PASOS_MANUAL,
  STORAGE_KEY_LAST_MANUAL_ID,
  STORAGE_KEY_MANUAL_ACTIVO,
  obtenerCalibracionInicial,
  STORAGE_KEY_ILUMINACION,
  defaultLucesEstudio,
} from "../storeDefaults";
import type {
  PasoManualStudio,
  Manual3BMProyecto,
  BloqueEstandarDef,
  ModoPickingManualState,
  SubBloqueArmado,
  GrupoCinematicoShowcase,
} from "../storeTypes";
import { agruparMallasEnPiezasMadre, extraerPiezaMadre, esHerrajeNombre } from "../piezaMadreUtils";

export const createManualSlice = (set: any, get: any): any => {
  const initialCachedManual = getCachedManualData();
  const pasosIniciales = (initialCachedManual && initialCachedManual.pasos && initialCachedManual.pasos.length > 0)
    ? initialCachedManual.pasos
    : generarPasosManualesPorDefecto();

  return {

  pasosManual: pasosIniciales,
  pasoActivoManualId: pasosIniciales[0]?.id || "P00",
  isTimelinePlaying: false,
  timelineCurrentTime: 0,
  timelineVelocidad: 1.0,
  idiomaVozManual: "es",
  audioMutedManual: false,

  setPasosManual: (pasosManual) => {
    const sanitizados = sanitizarPasosManuales(pasosManual);
    set({ pasosManual: sanitizados });
    guardarPasosEnCacheLocal(sanitizados, get().manualActivoGuardado);
  },
  seleccionarPasoManualActivo: (pasoActivoManualId) => set({ pasoActivoManualId, timelineCurrentTime: 0, isTimelinePlaying: false }),
  crearPasoManual: (tipo = "ensamble") => {
    const state = get();
    // 1. Encontrar el menor paso faltante disponible (gap-filling inteligente, sin duplicados)
    const { id: nuevoId, numero: num } = encontrarSiguienteIdPasoDisponible(state.pasosManual);

    const nuevoPaso: PasoManualStudio = {
      id: nuevoId,
      numero: num,
      tipo,
      titulo: tipo === "showcase" ? `${nuevoId}: Showcase` : `Bloque de armado ${nuevoId}`,
      descripcion: "Nuevo paso de ensamble",
      duracionTotal: 10.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      guionEs: `Paso ${num}: Ensambla los componentes correspondientes a esta etapa.`,
      guionPt: `Passo ${num}: Monte os componentes correspondentes a esta etapa.`,
      guionEn: `Step ${num}: Assemble the corresponding components for this stage.`,
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: 10.0,
    };

    // 2. Insertar en su posición secuencial natural según el número de paso
    const nuevosPasos = [...state.pasosManual];
    const indiceInsercion = nuevosPasos.findIndex((p) => (p.numero ?? 0) > num);
    if (indiceInsercion >= 0) {
      nuevosPasos.splice(indiceInsercion, 0, nuevoPaso);
    } else {
      nuevosPasos.push(nuevoPaso);
    }

    set({ pasosManual: nuevosPasos, pasoActivoManualId: nuevoId, timelineCurrentTime: 0, isTimelinePlaying: false });
    guardarPasosEnCacheLocal(nuevosPasos, state.manualActivoGuardado);
  },
  eliminarPasoManual: (pasoId) => {
    const state = get();
    // P00 está protegido permanentemente de eliminación
    if (pasoId === "P00" || state.pasosManual.length <= 1) return;
    const filtrados = state.pasosManual.filter((p) => p.id !== pasoId);
    const sanitizados = sanitizarPasosManuales(filtrados);
    let siguienteActivo = state.pasoActivoManualId;
    if (state.pasoActivoManualId === pasoId) {
      const idxEliminado = state.pasosManual.findIndex((p) => p.id === pasoId);
      const prevIdx = Math.max(0, idxEliminado - 1);
      siguienteActivo = sanitizados[prevIdx]?.id || sanitizados[0]?.id || "P00";
    }
    set({ pasosManual: sanitizados, pasoActivoManualId: siguienteActivo, timelineCurrentTime: 0, isTimelinePlaying: false });
    guardarPasosEnCacheLocal(sanitizados, state.manualActivoGuardado);
  },
  actualizarPasoManual: (pasoId, data) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => (p.id === pasoId ? { ...p, ...data } : p));
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
  reordenarSecuenciaPaso: (pasoId, nuevaSecuencia) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => (p.id === pasoId ? { ...p, secuencia: nuevaSecuencia } : p));
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
  asignarPiezaAPasoManual: (pasoId, nombrePieza) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      if (p.piezasAsignadas.includes(nombrePieza)) return p;
      const nuevasPiezas = [...p.piezasAsignadas, nombrePieza];
      return { ...p, piezasAsignadas: nuevasPiezas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },
  desasignarPiezaDePasoManual: (pasoId, nombrePieza) => {
    const state = get();
    const pm = extraerPiezaMadre(nombrePieza);
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        piezasAsignadas: p.piezasAsignadas.filter((nom) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s) => s.nombreNodo !== nombrePieza && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom) => nom !== nombrePieza && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
  asignarHerrajeAPasoManual: (pasoId, nombreHerraje) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      if (p.herrajesAsignados.includes(nombreHerraje)) return p;
      const nuevosHerrajes = [...p.herrajesAsignados, nombreHerraje];
      return { ...p, herrajesAsignados: nuevosHerrajes };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    get().autoGenerarSecuenciaPaso(pasoId);
  },
  desasignarHerrajeDePasoManual: (pasoId, nombreHerraje) => {
    const state = get();
    const pm = extraerPiezaMadre(nombreHerraje);
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        herrajesAsignados: p.herrajesAsignados.filter((nom) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm),
        secuencia: p.secuencia.filter((s) => s.nombreNodo !== nombreHerraje && extraerPiezaMadre(s.nombreNodo) !== pm),
      };
    });
    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === pasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (nom) => nom !== nombreHerraje && extraerPiezaMadre(nom) !== pm
        ),
      };
    }
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },
  autoGenerarSecuenciaPaso: (pasoId) => {
    const state = get();
    const paso = state.pasosManual.find((p) => p.id === pasoId);
    if (!paso) return;
    if (paso.tipo === "showcase") return;

    let t = 0.5;
    const nuevaSecuencia: ElementoSecuenciaCinematica[] = [];

    // 1. Tarugos entran primero con martillo de goma
    paso.herrajesAsignados
      .filter((h) => h.toLowerCase().includes("tarugo") || h.toLowerCase().includes("cavilha"))
      .forEach((tarugo, idx) => {
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
      .filter((h) => (h.toLowerCase().includes("minifix") || h.toLowerCase().includes("perno")) && !h.toLowerCase().includes("tarugo"))
      .forEach((perno, idx) => {
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
      .filter((p) => p !== paso.piezaMaster)
      .forEach((pieza, idx) => {
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
      .filter((h) => h.toLowerCase().includes("tornillo") || h.toLowerCase().includes("parafuso"))
      .forEach((tornillo, idx) => {
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

    const actualizados = state.pasosManual.map((p) =>
      p.id === pasoId ? { ...p, secuencia: nuevaSecuencia, duracionTotal: duracionFinal } : p
    );
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  autoDetectarGruposCinematicos: (pasoId) => {
    const state = get();
    const paso = state.pasosManual.find((p) => p.id === pasoId);
    if (!paso || paso.tipo !== "showcase") return;

    // Obtener todos los nombres de piezas disponibles agrupados como Piezas Madre
    const rawMeshes = state.resultado?.real_meshes || [];
    const declaredOutputs = state.resultado?.declared_outputs || [];
    const partesAsignadas = Object.keys(state.asignacionesPartes || {});
    const rawNombres = [
      ...rawMeshes.map((m: any) => (m.name || "").replace(/^RH_OUT:/i, "").trim()),
      ...declaredOutputs.map((d: string) => d.replace(/^RH_OUT:/i, "").trim()),
      ...partesAsignadas.map((p: string) => p.replace(/^RH_OUT:/i, "").trim()),
    ].filter(Boolean);

    const todasPiezasMadre = agruparMallasEnPiezasMadre(rawNombres);

    // 1. Si el mueble es Cómoda Ravenna o similar con numeración Peça 6..15
    const tieneRavenna = todasPiezasMadre.some((p) => p === "Peça 6" || p === "Peça 7") || (state.parametros?.model_id || "").toLowerCase().includes("ravenna");
    // Distancia uniforme configurada en el paso (ej: 300 o 350 mm)
    const distGlobal = paso.showcase?.distanciaAperturaMm || 350;

    // 🛡️ REGLA DE ORO: Si ya existen grupos cinemáticos configurados con piezas, PRESERVARLOS intactos
    const existentes = paso.showcase?.gruposCinematicos || [];
    const tieneGruposConfigurados = existentes.some((g) => g.piezas && g.piezas.length > 0);

    let gruposDetectados: GrupoCinematicoShowcase[] = [];

    if (tieneGruposConfigurados) {
      gruposDetectados = existentes;
    } else if (tieneRavenna) {
      // Cómoda Ravenna: 6 cajones organizados físicamente (3 a la izquierda, 3 a la derecha)
      gruposDetectados = [
        { id: "cajon_1", nombre: "Cajón 1 (Superior Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_2", nombre: "Cajón 2 (Superior Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_3", nombre: "Cajón 3 (Medio Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_4", nombre: "Cajón 4 (Medio Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_5", nombre: "Cajón 5 (Inferior Izq)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_6", nombre: "Cajón 6 (Inferior Der)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
      ];
    } else {
      gruposDetectados = [
        { id: "cajon_1", nombre: "Cajón 1 (Superior)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
        { id: "cajon_2", nombre: "Cajón 2 (Inferior)", tipo: "cajon", piezas: [], ejeApertura: paso.showcase?.ejeGlobal || "+Z", distanciaMm: distGlobal, oculto: false },
      ];
    }

    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        showcase: {
          ...(p.showcase || {
            abrirCajones: true,
            distanciaAperturaMm: 300,
            abrirPuertas: true,
            anguloPuertasDeg: 90,
            giroPresentacion360: true,
          }),
          distanciaAperturaMm: distGlobal,
          sincronizarCarreraCajones: true,
          coreografia: (p.showcase?.coreografia || "secuencial") as CoreografiaShowcase,
          ejeGlobal: (p.showcase?.ejeGlobal || "+Z") as EjeAperturaShowcase,
          gruposCinematicos: gruposDetectados,
        },
      };
    });

    set({ pasosManual: actualizados, timelineCurrentTime: 0, isTimelinePlaying: false });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  agregarGrupoCinematico: (pasoId, grupo) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      const showcaseActual = p.showcase || {
        abrirCajones: true,
        distanciaAperturaMm: 300,
        abrirPuertas: true,
        anguloPuertasDeg: 90,
        giroPresentacion360: true,
        coreografia: "secuencial" as CoreografiaShowcase,
        ejeGlobal: "+Z" as EjeAperturaShowcase,
        gruposCinematicos: [],
      };
      const actuales = showcaseActual.gruposCinematicos || [];
      return {
        ...p,
        showcase: {
          ...showcaseActual,
          gruposCinematicos: [...actuales, grupo],
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarGrupoCinematico: (pasoId, grupoId, data) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g) =>
        g.id === grupoId ? { ...g, ...data } : g
      );
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  eliminarGrupoCinematico: (pasoId, grupoId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.showcase) return p;
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: (p.showcase.gruposCinematicos || []).filter((g) => g.id !== grupoId),
        },
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === grupoId) {
      nuevoPicking = {
        activo: false,
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      };
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezaAGrupoCinematico: (pasoId, grupoId, nombrePieza) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    if (!piezaKey) return;

    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g) => {
        if (g.id !== grupoId) return g;
        if (g.piezas.includes(piezaKey)) return g;
        return { ...g, piezas: [...g.piezas, piezaKey] };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === grupoId) {
      if (!state.modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaKey)) {
        nuevoPicking = {
          ...state.modoPickingManual,
          piezasTemporalmenteSeleccionadas: [...state.modoPickingManual.piezasTemporalmenteSeleccionadas, piezaKey],
        };
      }
    }

    set({ 
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  desasignarPiezaDeGrupoCinematico: (pasoId, grupoId, nombrePieza) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    const pmKey = extraerPiezaMadre(piezaKey);
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g) => {
        if (g.id !== grupoId) return g;
        return { 
          ...g, 
          piezas: g.piezas.filter((pz) => pz !== piezaKey && pz !== nombrePieza && pz !== pmKey && extraerPiezaMadre(pz) !== pmKey) 
        };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && (!state.modoPickingManual.grupoId || state.modoPickingManual.grupoId === grupoId)) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (p) => p !== piezaKey && p !== nombrePieza && p !== pmKey && extraerPiezaMadre(p) !== pmKey
        ),
      };
    }

    set({ 
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadGrupoCinematico: (pasoId, grupoId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.showcase) return p;
      const modificados = (p.showcase.gruposCinematicos || []).map((g) => {
        if (g.id !== grupoId) return g;
        return { ...g, oculto: !g.oculto };
      });
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadTodosGruposCinematicos: (pasoId = "P00", forzarOcultar) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if ((p.id !== pasoId && p.tipo !== "showcase") || !p.showcase) return p;
      const grupos = p.showcase.gruposCinematicos || [];
      const algunVisible = grupos.some((g) => !g.oculto);
      const nuevoEstado = forzarOcultar !== undefined ? forzarOcultar : algunVisible;
      const modificados = grupos.map((g) => ({ ...g, oculto: nuevoEstado }));
      return {
        ...p,
        showcase: {
          ...p.showcase,
          gruposCinematicos: modificados,
        },
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadPiezasPaso: (pasoId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return { ...p, piezasOcultas: !p.piezasOcultas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarOcultarNoAsignadasPaso: (pasoId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return { ...p, ocultarNoAsignadas: !p.ocultarNoAsignadas };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 🧩 Subbloques de Armado en Pasos de Ensamble
  agregarSubBloqueArmado: (pasoId, nombre) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      const subbloquesActuales = p.subbloques || [];
      const sIdx = subbloquesActuales.length;
      const letra = String.fromCharCode(65 + sIdx); // A, B, C...
      const codigo = `${pasoId}${letra}`; // ej. "P02A"
      const idNuevo = `sub_${pasoId}_${letra}_${Date.now().toString().slice(-4)}`;
      const nuevoSub: SubBloqueArmado = {
        id: idNuevo,
        codigo,
        letra,
        nombre: nombre || `Sub-Bloque ${pasoId}-${letra}`,
        piezas: [],
        herrajes: [],
        oculto: false,
        transformBanco: {
          acostado: false,
          direccionAcostar: "izquierda",
          rotacionYDeg: 0,
          rotacion: [0, 0, 0] as [number, number, number],
          flipCara: false,
          offsetX: 0,
          offsetZ: 0,
          apoyoEnPiso: true,
        },
        trackAnimacion: {
          tiempoInicio: 0,
          duracion: Math.max(p.duracionTotal || 5.0, 1.0),
        },
      };
      return {
        ...p,
        subbloques: [...subbloquesActuales, nuevoSub],
      };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarSubBloqueArmado: (pasoId, subbloqueId, data) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) =>
        s.id === subbloqueId ? { ...s, ...data } : s
      );
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  eliminarSubBloqueArmado: (pasoId, subbloqueId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      return {
        ...p,
        subbloques: p.subbloques.filter((s) => s.id !== subbloqueId),
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
      nuevoPicking = {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      };
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  asignarPiezaASubBloque: (pasoId, subbloqueId, nombrePieza) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    if (!piezaKey) return;
    const esHerraje = esHerrajeNombre(piezaKey);

    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) {
          return {
            ...s,
            piezas: s.piezas.filter((pz) => pz !== piezaKey && extraerPiezaMadre(pz) !== extraerPiezaMadre(piezaKey)),
            herrajes: s.herrajes.filter((hr) => hr !== piezaKey && extraerPiezaMadre(hr) !== extraerPiezaMadre(piezaKey)),
          };
        }
        if (esHerraje) {
          if (s.herrajes.includes(piezaKey)) return s;
          return { ...s, herrajes: [...s.herrajes, piezaKey] };
        } else {
          if (s.piezas.includes(piezaKey)) return s;
          return { ...s, piezas: [...s.piezas, piezaKey] };
        }
      });
      const todasPz = esHerraje ? p.piezasAsignadas : Array.from(new Set([...p.piezasAsignadas, piezaKey]));
      const todosHr = esHerraje ? Array.from(new Set([...p.herrajesAsignados, piezaKey])) : p.herrajesAsignados;

      return {
        ...p,
        piezasAsignadas: todasPz,
        herrajesAsignados: todosHr,
        subbloques: modificados,
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
      if (!state.modoPickingManual.piezasTemporalmenteSeleccionadas.includes(piezaKey)) {
        nuevoPicking = {
          ...state.modoPickingManual,
          piezasTemporalmenteSeleccionadas: [...state.modoPickingManual.piezasTemporalmenteSeleccionadas, piezaKey],
        };
      }
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  desasignarPiezaDeSubBloque: (pasoId, subbloqueId, nombrePieza) => {
    const state = get();
    const piezaKey = (nombrePieza || "").trim();
    const pmKey = extraerPiezaMadre(piezaKey);

    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) return s;
        return {
          ...s,
          piezas: s.piezas.filter((pz) => pz !== piezaKey && pz !== nombrePieza && pz !== pmKey && extraerPiezaMadre(pz) !== pmKey),
          herrajes: s.herrajes.filter((hr) => hr !== piezaKey && hr !== nombrePieza && hr !== pmKey && extraerPiezaMadre(hr) !== pmKey),
        };
      });
      return { ...p, subbloques: modificados };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && (!state.modoPickingManual.grupoId || state.modoPickingManual.grupoId === subbloqueId)) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: state.modoPickingManual.piezasTemporalmenteSeleccionadas.filter(
          (p) => p !== piezaKey && p !== nombrePieza && p !== pmKey && extraerPiezaMadre(p) !== pmKey
        ),
      };
    }

    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  conmutarVisibilidadSubBloqueArmado: (pasoId, subbloqueId) => {
    const state = get();
    let nuevoPicking = state.modoPickingManual;
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) return s;
        const nuevoOculto = !s.oculto;
        if (nuevoOculto && state.modoPickingManual.activo && state.modoPickingManual.grupoId === subbloqueId) {
          nuevoPicking = {
            activo: false,
            modo: "agregar",
            grupoId: null,
            pasoId: null,
            piezasTemporalmenteSeleccionadas: [],
          };
        }
        return { ...s, oculto: nuevoOculto };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados, modoPickingManual: nuevoPicking });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  subbloqueSoloId: null,
  setSubbloqueSolo: (subbloqueSoloId) => set({ subbloqueSoloId }),

  actualizarTransformBancoSubBloque: (pasoId, subbloqueId, transform) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) return s;
        const actual = s.transformBanco || {
          acostado: false,
          rotacionYDeg: 0,
          rotacion: [0, 0, 0] as [number, number, number],
          rotacionPlano: 0,
          flipCara: false,
          offsetX: 0,
          offsetZ: 0,
          apoyoEnPiso: true,
        };
        return {
          ...s,
          transformBanco: { ...actual, ...transform },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  resetTransformBancoSubBloque: (pasoId, subbloqueId) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) return s;
        return {
          ...s,
          transformBanco: {
            acostado: false,
            rotacionYDeg: 0,
            rotacion: [0, 0, 0] as [number, number, number],
            rotacionPlano: 0,
            flipCara: false,
            offsetX: 0,
            offsetZ: 0,
            apoyoEnPiso: true,
          },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  actualizarTrackSubBloque: (pasoId, subbloqueId, track) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId || !p.subbloques) return p;
      const modificados = p.subbloques.map((s) => {
        if (s.id !== subbloqueId) return s;
        const actual = s.trackAnimacion || {
          tiempoInicio: 0,
          duracion: Math.max(p.duracionTotal || 5.0, 1.0),
        };
        return {
          ...s,
          trackAnimacion: { ...actual, ...track },
        };
      });
      return { ...p, subbloques: modificados };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  setCoreografiaSubbloques: (pasoId, coreografia) => {
    const state = get();
    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== pasoId) return p;
      return { ...p, coreografiaSubbloques: coreografia };
    });
    set({ pasosManual: actualizados });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 🎯 Modo Picking 3D / Cuentagotas para Asignación de Piezas
  modoPickingManual: {
    activo: false,
    modo: "agregar",
    grupoId: null,
    pasoId: null,
    piezasTemporalmenteSeleccionadas: [],
  },

  iniciarPickingManual: (pasoId, grupoId = null, modo = "agregar") => {
    const state = get();
    const paso = state.pasosManual.find((p) => p.id === pasoId);
    let piezasIniciales: string[] = [];
    if (paso && paso.showcase && grupoId) {
      const grupo = (paso.showcase.gruposCinematicos || []).find((g) => g.id === grupoId);
      if (grupo) {
        piezasIniciales = [...grupo.piezas];
      }
    } else if (paso && paso.subbloques && grupoId) {
      const sub = paso.subbloques.find((s) => s.id === grupoId);
      if (sub) {
        piezasIniciales = Array.from(new Set([...(sub.piezas || []), ...(sub.herrajes || [])]));
      }
    } else if (paso) {
      // 🧩 Modo Ensamble (Paso 01+): piezas de madera y herrajes asignados al paso
      piezasIniciales = Array.from(new Set([...(paso.piezasAsignadas || []), ...(paso.herrajesAsignados || [])]));
    }

    // 👁️ REGLA: Al seleccionar el cuentagotas, activar simultáneamente por defecto el botón de apagar piezas (primer ojito)
    let pasosActualizados = state.pasosManual;
    if (paso && paso.tipo !== "showcase" && !paso.piezasOcultas) {
      pasosActualizados = state.pasosManual.map((p) =>
        p.id === pasoId ? { ...p, piezasOcultas: true } : p
      );
      guardarPasosEnCacheLocal(pasosActualizados, state.manualActivoGuardado);
    }

    set({
      pasosManual: pasosActualizados,
      modoPickingManual: {
        activo: true,
        modo,
        grupoId: grupoId || null,
        pasoId,
        piezasTemporalmenteSeleccionadas: piezasIniciales,
      },
    });
  },

  retirarComponenteManual3D: (meshTargetKey, pasoId) => {
    const state = get();
    const targetPasoId = pasoId || state.pasoActivoManualId;
    const paso = state.pasosManual.find((p) => p.id === targetPasoId);
    if (!paso) return;

    const targetClean = meshTargetKey.replace(/^RH_OUT:\s*/i, "").trim();
    const targetBase = targetClean.replace(/\s*\(\d+\)$/, "").trim();
    const targetPM = extraerPiezaMadre(targetClean);

    const coincideConTarget = (entry: string) => {
      if (!entry) return false;
      const entryClean = entry.replace(/^RH_OUT:\s*/i, "").trim();
      if (entryClean === targetClean || entry === meshTargetKey) return true;
      const entryPM = extraerPiezaMadre(entryClean);
      if (entryPM === targetPM || entryPM === targetClean) return true;
      return false;
    };

    let nuevosHerrajes = [...paso.herrajesAsignados];
    let nuevasPiezas = [...paso.piezasAsignadas];

    // Verificar si en herrajes hay una entrada genérica que abarca este herraje
    const tieneGenericoEnHerrajes = nuevosHerrajes.some((h) => {
      const hClean = h.replace(/^RH_OUT:\s*/i, "").trim();
      return (hClean === targetBase || extraerPiezaMadre(hClean) === targetBase) && !hClean.includes("(");
    });

    if (tieneGenericoEnHerrajes && targetClean !== targetBase) {
      // Si existía entrada genérica (ej. "Cavilha"), expandirla a todas las instancias físicas excepto la retirada
      const realMeshes: any[] = [];
      Object.values(state.instancias).forEach((inst) => {
        if (inst.resultado?.real_meshes) {
          realMeshes.push(...inst.resultado.real_meshes);
        }
      });
      const anotadas = anotarInstanciasFisicas(realMeshes);
      const instanciasDeEsteTipo = anotadas
        .filter((m) => {
          const mClean = (m.name || "").replace(/^RH_OUT:\s*/i, "").trim();
          return mClean === targetBase || extraerPiezaMadre(mClean).replace(/\s*\(\d+\)$/, "").trim() === targetBase;
        })
        .map((m) => m.instanciaKey)
        .filter(Boolean);

      const instanciasUnicas = Array.from(new Set(instanciasDeEsteTipo));
      if (instanciasUnicas.length > 0) {
        nuevosHerrajes = nuevosHerrajes.filter((h) => {
          const hClean = h.replace(/^RH_OUT:\s*/i, "").trim();
          return hClean !== targetBase && extraerPiezaMadre(hClean) !== targetBase;
        });
        const restantes = instanciasUnicas.filter((instKey) => !coincideConTarget(instKey));
        nuevosHerrajes = Array.from(new Set([...nuevosHerrajes, ...restantes]));
      } else {
        nuevosHerrajes = nuevosHerrajes.filter((h) => !coincideConTarget(h));
      }
    } else {
      nuevosHerrajes = nuevosHerrajes.filter((h) => !coincideConTarget(h));
    }

    // Mismo tratamiento por si hubiera tableros con entrada genérica
    const tieneGenericoEnPiezas = nuevasPiezas.some((p) => {
      const pClean = p.replace(/^RH_OUT:\s*/i, "").trim();
      return (pClean === targetBase || extraerPiezaMadre(pClean) === targetBase) && !pClean.includes("(");
    });

    if (tieneGenericoEnPiezas && targetClean !== targetBase) {
      const realMeshes: any[] = [];
      Object.values(state.instancias).forEach((inst) => {
        if (inst.resultado?.real_meshes) {
          realMeshes.push(...inst.resultado.real_meshes);
        }
      });
      const anotadas = anotarInstanciasFisicas(realMeshes);
      const instanciasDeEsteTipo = anotadas
        .filter((m) => {
          const mClean = (m.name || "").replace(/^RH_OUT:\s*/i, "").trim();
          return mClean === targetBase || extraerPiezaMadre(mClean).replace(/\s*\(\d+\)$/, "").trim() === targetBase;
        })
        .map((m) => m.instanciaKey)
        .filter(Boolean);

      const instanciasUnicas = Array.from(new Set(instanciasDeEsteTipo));
      if (instanciasUnicas.length > 0) {
        nuevasPiezas = nuevasPiezas.filter((p) => {
          const pClean = p.replace(/^RH_OUT:\s*/i, "").trim();
          return pClean !== targetBase && extraerPiezaMadre(pClean) !== targetBase;
        });
        const restantes = instanciasUnicas.filter((instKey) => !coincideConTarget(instKey));
        nuevasPiezas = Array.from(new Set([...nuevasPiezas, ...restantes]));
      } else {
        nuevasPiezas = nuevasPiezas.filter((p) => !coincideConTarget(p));
      }
    } else {
      nuevasPiezas = nuevasPiezas.filter((p) => !coincideConTarget(p));
    }

    const nuevaSecuencia = (paso.secuencia || []).filter((s) => !coincideConTarget(s.nombreNodo));

    const actualizados = state.pasosManual.map((p) => {
      if (p.id !== targetPasoId) return p;
      return {
        ...p,
        piezasAsignadas: nuevasPiezas,
        herrajesAsignados: nuevosHerrajes,
        secuencia: nuevaSecuencia,
      };
    });

    let nuevoPicking = state.modoPickingManual;
    if (state.modoPickingManual.activo && state.modoPickingManual.pasoId === targetPasoId) {
      nuevoPicking = {
        ...state.modoPickingManual,
        piezasTemporalmenteSeleccionadas: Array.from(new Set([...nuevasPiezas, ...nuevosHerrajes])),
      };
    }

    set({
      pasosManual: actualizados,
      modoPickingManual: nuevoPicking,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  togglePiezaEnPickingManual: (piezaMadre) => {
    const pm = extraerPiezaMadre(piezaMadre);
    if (!pm) return;
    const { modoPickingManual, pasosManual } = get();
    if (!modoPickingManual.activo) return;

    // Sincronizar con el grupo activo si existe para que siempre sea la fuente de verdad
    let listaBase = modoPickingManual.piezasTemporalmenteSeleccionadas;
    if (modoPickingManual.pasoId && modoPickingManual.grupoId) {
      const paso = pasosManual.find((p) => p.id === modoPickingManual.pasoId);
      if (paso?.tipo === "showcase") {
        const grupo = (paso?.showcase?.gruposCinematicos || []).find((g) => g.id === modoPickingManual.grupoId);
        if (grupo) {
          listaBase = grupo.piezas;
        }
      } else if (paso?.subbloques) {
        const sub = paso.subbloques.find((s) => s.id === modoPickingManual.grupoId);
        if (sub) {
          listaBase = Array.from(new Set([...(sub.piezas || []), ...(sub.herrajes || [])]));
        }
      }
    } else if (modoPickingManual.pasoId) {
      const paso = pasosManual.find((p) => p.id === modoPickingManual.pasoId);
      if (paso) {
        listaBase = Array.from(new Set([...(paso.piezasAsignadas || []), ...(paso.herrajesAsignados || [])]));
      }
    }

    const existe = listaBase.some((p) => p === pm || extraerPiezaMadre(p) === pm);
    let nuevas: string[];
    if (modoPickingManual.modo === "retirar") {
      nuevas = listaBase.filter((p) => p !== pm && extraerPiezaMadre(p) !== pm);
    } else {
      nuevas = existe
        ? listaBase.filter((p) => p !== pm && extraerPiezaMadre(p) !== pm)
        : [...listaBase, pm];
    }

    // Sincronización reactiva en tiempo real si hay un grupo de cajón activo O subbloque O paso de ensamble
    let pasosActualizados = pasosManual;
    if (modoPickingManual.pasoId && modoPickingManual.grupoId) {
      pasosActualizados = pasosManual.map((p) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        if (p.tipo === "showcase" && p.showcase) {
          const modificados = (p.showcase.gruposCinematicos || []).map((g) => {
            if (g.id !== modoPickingManual.grupoId) return g;
            return { ...g, piezas: nuevas };
          });
          return {
            ...p,
            showcase: {
              ...p.showcase,
              gruposCinematicos: modificados,
            },
          };
        } else if (p.subbloques) {
          const modificados = p.subbloques.map((s) => {
            if (s.id !== modoPickingManual.grupoId) return s;
            return {
              ...s,
              piezas: nuevas.filter((pz) => !esHerrajeNombre(pz)),
              herrajes: nuevas.filter((pz) => esHerrajeNombre(pz)),
            };
          });
          const nuevasPz = nuevas.filter((pz) => !esHerrajeNombre(pz));
          const nuevosHr = nuevas.filter((pz) => esHerrajeNombre(pz));
          const todasPz = modoPickingManual.modo === "agregar"
            ? Array.from(new Set([...p.piezasAsignadas, ...nuevasPz]))
            : p.piezasAsignadas;
          const todosHr = modoPickingManual.modo === "agregar"
            ? Array.from(new Set([...p.herrajesAsignados, ...nuevosHr]))
            : p.herrajesAsignados;

          return {
            ...p,
            piezasAsignadas: todasPz,
            herrajesAsignados: todosHr,
            subbloques: modificados,
          };
        }
        return p;
      });
    } else if (modoPickingManual.pasoId) {
      pasosActualizados = pasosManual.map((p) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        return {
          ...p,
          piezasAsignadas: nuevas.filter((pz) => !esHerrajeNombre(pz)),
          herrajesAsignados: nuevas.filter((pz) => esHerrajeNombre(pz)),
        };
      });
    }

    set({
      pasosManual: pasosActualizados,
      modoPickingManual: {
        ...modoPickingManual,
        piezasTemporalmenteSeleccionadas: nuevas,
      },
    });
    const st = get();
    guardarPasosEnCacheLocal(pasosActualizados, st.manualActivoGuardado);
  },

  limpiarPickingManual: () => {
    set({
      modoPickingManual: {
        activo: false,
        modo: "agregar",
        grupoId: null,
        pasoId: null,
        piezasTemporalmenteSeleccionadas: [],
      },
    });
  },

  confirmarPickingManual: () => {
    const { modoPickingManual, pasosManual } = get();
    if (!modoPickingManual.activo || !modoPickingManual.pasoId) {
      set({
        modoPickingManual: {
          activo: false,
          modo: "agregar",
          grupoId: null,
          pasoId: null,
          piezasTemporalmenteSeleccionadas: [],
        },
      });
      return;
    }

    if (modoPickingManual.grupoId) {
      const actualizados = pasosManual.map((p) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        if (p.showcase) {
          const modificados = (p.showcase.gruposCinematicos || []).map((g) => {
            if (g.id !== modoPickingManual.grupoId) return g;
            return {
              ...g,
              piezas: modoPickingManual.piezasTemporalmenteSeleccionadas,
            };
          });
          return {
            ...p,
            showcase: {
              ...p.showcase,
              gruposCinematicos: modificados,
            },
          };
        } else if (p.subbloques) {
          const nuevas = modoPickingManual.piezasTemporalmenteSeleccionadas;
          const modificados = p.subbloques.map((s) => {
            if (s.id !== modoPickingManual.grupoId) return s;
            return {
              ...s,
              piezas: nuevas.filter((pz) => !esHerrajeNombre(pz)),
              herrajes: nuevas.filter((pz) => esHerrajeNombre(pz)),
            };
          });
          return {
            ...p,
            subbloques: modificados,
          };
        }
        return p;
      });
      set({
        pasosManual: actualizados,
        modoPickingManual: {
          activo: false,
          grupoId: null,
          pasoId: null,
          piezasTemporalmenteSeleccionadas: [],
        },
      });
      const st = get();
      guardarPasosEnCacheLocal(actualizados, st.manualActivoGuardado);
    } else {
      const actualizados = pasosManual.map((p) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        const nuevas = modoPickingManual.piezasTemporalmenteSeleccionadas;
        return {
          ...p,
          piezasAsignadas: nuevas.filter((pz) => !esHerrajeNombre(pz)),
          herrajesAsignados: nuevas.filter((pz) => esHerrajeNombre(pz)),
        };
      });
      set({
        pasosManual: actualizados,
        modoPickingManual: {
          activo: false,
          modo: "agregar",
          grupoId: null,
          pasoId: null,
          piezasTemporalmenteSeleccionadas: [],
        },
      });
      const st = get();
      guardarPasosEnCacheLocal(actualizados, st.manualActivoGuardado);
    }
  },

  setIsTimelinePlaying: (isTimelinePlaying) => set({ isTimelinePlaying }),
  setTimelineCurrentTime: (timelineCurrentTime) => set({ timelineCurrentTime }),
  setTimelineVelocidad: (timelineVelocidad) => set({ timelineVelocidad }),
  setIdiomaVozManual: (idiomaVozManual) => set({ idiomaVozManual }),
  setAudioMutedManual: (audioMutedManual) => set({ audioMutedManual }),

  // 📦 Bloques Estándar de Armado (.3bb.json)
  bloquesEstandar: BLOQUES_ESTANDAR_DEFAULT,
  carpetaBloquesSeleccionada: "Universales",
  setCarpetaBloquesSeleccionada: (carpetaBloquesSeleccionada) => set({ carpetaBloquesSeleccionada }),
  bloqueEstandarEnEdicion: null,
  manualPadrePrevioEdicionBloque: null,
  setBloqueEstandarEnEdicion: (bloqueEstandarEnEdicion) => {
    const state = get();
    if (bloqueEstandarEnEdicion === null && state.manualPadrePrevioEdicionBloque) {
      // 🛡️ BLINDAJE TOTAL: Al salir o cancelar la edición del bloque,
      // restaurar inmediatamente el manual completo del mueble (ej. Cómoda Ravenna con sus 6 cajones)
      const padre = state.manualPadrePrevioEdicionBloque;
      set({
        bloqueEstandarEnEdicion: null,
        manualPadrePrevioEdicionBloque: null,
        manualActivoGuardado: padre.manual,
        pasosManual: padre.pasos,
        pasoActivoManualId: padre.pasoActivoId,
        timelineCurrentTime: 0,
        isTimelinePlaying: false,
      });
      guardarPasosEnCacheLocal(padre.pasos, padre.manual);
      return;
    }
    set({ bloqueEstandarEnEdicion });
  },

  cargarBloquesEstandar: async () => {
    try {
      const res = await fetch("/api/bloques");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bloques) && data.bloques.length > 0) {
          set({ bloquesEstandar: data.bloques });
          return;
        }
      }
    } catch (err) {
      console.warn("[3dBimFab] Error cargando bloques estándar de API:", err);
    }
    set({ bloquesEstandar: BLOQUES_ESTANDAR_DEFAULT });
  },

  insertarBloqueEstandarComoPaso: (bloque: BloqueEstandarDef, indiceInsercion?: number) => {
    const state = get();
    const pasosActuales = sanitizarPasosManuales(state.pasosManual);
    const pasoActivoIdx = pasosActuales.findIndex((p) => p.id === state.pasoActivoManualId);
    // P00 (índice 0) está reservado para Showcase, nunca insertar antes del 1
    const pos = Math.max(1, indiceInsercion !== undefined ? indiceInsercion : (pasoActivoIdx >= 0 ? pasoActivoIdx + 1 : pasosActuales.length));

    const ref: BloqueEstandarRef = {
      id: bloque.id,
      nombre: bloque.nombre,
      categoriaMarca: bloque.categoriaMarca,
      subcategoria: bloque.subcategoria,
      descripcion: bloque.descripcion,
      archivo: bloque.archivo,
      thumbnail: bloque.thumbnail,
      duracion: bloque.duracion || 8.0,
      guionEs: bloque.guionEs,
      guionPt: bloque.guionPt,
      guionEn: bloque.guionEn,
      carpetaModelos: bloque.carpetaModelos,
      partesGlb: bloque.partesGlb,
      animacionTracks: bloque.animacionTracks,
    };

    const nuevoPaso: PasoManualStudio = {
      id: "TEMP",
      numero: 1,
      tipo: "bloque_estandar",
      titulo: bloque.nombre,
      descripcion: bloque.descripcion,
      duracionTotal: bloque.duracion || 8.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      bloqueEstandar: ref,
      guionEs: bloque.guionEs || `Paso: ${bloque.nombre}. Sigue las instrucciones del bloque estándar.`,
      guionPt: bloque.guionPt || `Passo: ${bloque.nombre}. Siga as instruções do bloco padrão.`,
      guionEn: bloque.guionEn || `Step: ${bloque.nombre}. Follow the standard block instructions.`,
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: bloque.duracion || 8.0,
    };

    const lista = [...pasosActuales];
    lista.splice(pos, 0, nuevoPaso);
    const reindexados = sanitizarPasosManuales(lista);
    const pasoInsertado = reindexados[pos] || reindexados[reindexados.length - 1];

    set({
      pasosManual: reindexados,
      pasoActivoManualId: pasoInsertado?.id || state.pasoActivoManualId,
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
    });
    guardarPasosEnCacheLocal(reindexados, state.manualActivoGuardado);
  },

  cargarBloqueEstandarParaEdicion: (bloque: BloqueEstandarDef) => {
    const ref: BloqueEstandarRef = {
      id: bloque.id,
      nombre: bloque.nombre,
      categoriaMarca: bloque.categoriaMarca,
      subcategoria: bloque.subcategoria,
      descripcion: bloque.descripcion,
      archivo: bloque.archivo,
      thumbnail: bloque.thumbnail,
      duracion: bloque.duracion || 8.0,
      guionEs: bloque.guionEs,
      guionPt: bloque.guionPt,
      guionEn: bloque.guionEn,
      carpetaModelos: bloque.carpetaModelos,
      partesGlb: bloque.partesGlb,
      animacionTracks: bloque.animacionTracks,
    };

    const pasoEdicion: PasoManualStudio = {
      id: "P01",
      numero: 1,
      tipo: "bloque_estandar",
      titulo: bloque.nombre,
      descripcion: bloque.descripcion,
      duracionTotal: bloque.duracion || 8.0,
      piezaMaster: "",
      orientacionBanco: { rotacion: [0, 0, 0], apoyoEnPiso: true },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      bloqueEstandar: ref,
      guionEs: bloque.guionEs || `Paso: ${bloque.nombre}. Sigue las instrucciones del bloque estándar.`,
      guionPt: bloque.guionPt || `Passo: ${bloque.nombre}. Siga as instruções do bloco padrão.`,
      guionEn: bloque.guionEn || `Step: ${bloque.nombre}. Follow the standard block instructions.`,
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: bloque.duracion || 8.0,
    };

    // 🛡️ AISLAMIENTO DE SEGURIDAD TOTAL:
    // Si estamos en un manual de mueble (ej. Cómoda Ravenna), salvaguardar todo su estado para restaurarlo intacto al salir
    const state = get();
    let respaldo = state.manualPadrePrevioEdicionBloque;
    if (!respaldo && state.manualActivoGuardado && !state.manualActivoGuardado.id.startsWith("bloque_")) {
      respaldo = {
        manual: state.manualActivoGuardado,
        pasos: state.pasosManual,
        pasoActivoId: state.pasoActivoManualId,
      };
    }

    // Siempre garantizar P00 al inicio en la vista previa del bloque estándar
    const pasosSanitizados = sanitizarPasosManuales([pasoEdicion]);

    const manualBloque: Manual3BMProyecto = {
      id: `bloque_${bloque.id}`,
      muebleOrigenId: bloque.id,
      nombre: `Bloque: ${bloque.nombre}`,
      marca: bloque.categoriaMarca || "Universales",
      tipologia: "Bloques Estándar",
      fechaModificacion: new Date().toISOString(),
      parametrosMueble: {},
      pasos: pasosSanitizados,
    };

    set({
      manualPadrePrevioEdicionBloque: respaldo,
      bloqueEstandarEnEdicion: bloque,
      manualActivoGuardado: manualBloque,
      pasosManual: pasosSanitizados,
      pasoActivoManualId: "P01",
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      mostrarNPanel: false, // Cerrar panel lateral para ver inmediatamente el 3D
    });
    // NOTA: NO llamamos a guardarPasosEnCacheLocal aquí para no sobreescribir la memoria persistente del mueble padre
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

  guardarNuevoBloqueEstandar: async (bloque: BloqueEstandarDef) => {
    try {
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloque),
      });
      if (res.ok) {
        const state = get();
        const existe = state.bloquesEstandar.some((b) => b.id === bloque.id);
        const actualizados = existe
          ? state.bloquesEstandar.map((b) => (b.id === bloque.id ? bloque : b))
          : [...state.bloquesEstandar, bloque];
        set({ bloquesEstandar: actualizados });
        return true;
      }
    } catch (err) {
      console.error("[3dBimFab] Error guardando bloque estándar:", err);
    }
    return false;
  },

  eliminarBloqueEstandar: async (id: string, categoriaMarca?: string, archivo?: string) => {
    try {
      const res = await fetch("/api/bloques", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, categoriaMarca, archivo }),
      });
      if (res.ok) {
        set((state) => ({
          bloquesEstandar: state.bloquesEstandar.filter((b) => b.id !== id),
        }));
        return true;
      }
    } catch (err) {
      console.error("[3dBimFab] Error eliminando bloque estándar:", err);
    }
    return false;
  },

  // 📦 Persistencia de Manuales en Google Drive (.3bm.json) y Caché Local
  manualActivoGuardado: initialCachedManual.manual,
  manualesDrive: [],
  modalBibliotecaManualesAbierto: false,
  guardandoManual: false,

  setModalBibliotecaManualesAbierto: (modalBibliotecaManualesAbierto) => set({ modalBibliotecaManualesAbierto }),

  cargarManualesDesdeDrive: async () => {
    try {
      const res = await fetch("/api/drive/manuales", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.manuales) {
          set({ manualesDrive: data.manuales });

          // 🛡️ Auto-restauración en recarga (F5):
          // REGLA SUPREMA: NUNCA sobreescribir pasos si el usuario ya tiene grupos cinemáticos o piezas locales
          const state = get();
          const p00 = (state.pasosManual || []).find((p) => p.id === "P00");
          const tieneGruposConfigurados = (p00?.showcase?.gruposCinematicos?.length || 0) > 0;
          const tienePiezasAsignadas = (state.pasosManual || []).some(
            (p) => (p.piezasAsignadas && p.piezasAsignadas.length > 0) || (p.herrajesAsignados && p.herrajesAsignados.length > 0)
          );
          const tieneTrabajoLocal = tieneGruposConfigurados || tienePiezasAsignadas;

          // 1. Intentar vincular por muebleActivoGuardado
          const muebleActivoId = state.muebleActivoGuardado?.id;
          const muebleActivoNombre = state.muebleActivoGuardado?.nombre;
          let target = null;
          if (muebleActivoId || muebleActivoNombre) {
            target = data.manuales.find(
              (m: any) =>
                (muebleActivoId && m.muebleOrigenId === muebleActivoId) ||
                (muebleActivoNombre && m.nombre.toLowerCase().includes(muebleActivoNombre.toLowerCase()))
            );
          }

          // 2. Si no hay target específico por ID pero el manual actual local no tiene grupos cinemáticos,
          // buscar el manual guardado en Drive que sí tenga grupos cinemáticos en P00 (ej: Cómoda Ravenna con 6 cajones)
          if (!target && !tieneTrabajoLocal) {
            target = data.manuales.find((m: any) => {
              const p00m = (m.pasos || []).find((p: any) => p.id === "P00");
              return (p00m?.showcase?.gruposCinematicos?.length || 0) > 0;
            });
          }

          if (target) {
            if (tieneTrabajoLocal) {
              if (!state.manualActivoGuardado) {
                const manualEnlazado: Manual3BMProyecto = {
                  ...target,
                  pasos: state.pasosManual,
                  fechaModificacion: new Date().toISOString(),
                };
                set({ manualActivoGuardado: manualEnlazado });
                guardarPasosEnCacheLocal(state.pasosManual, manualEnlazado);
              }
            } else {
              // Restaurar automáticamente la versión completa guardada con animaciones
              console.log("[3dBimFab] Auto-cargando manual guardado con animaciones:", target.nombre);
              get().cargarManualProyecto(target);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[3dBimFab Drive] Error cargando manuales:", e);
    }
  },

  cargarManualProyecto: (manual) => {
    const pasosCrudos = manual.pasos && manual.pasos.length > 0 ? manual.pasos : generarPasosManualesPorDefecto();
    const pasos = sanitizarPasosManuales(pasosCrudos);
    set({
      manualActivoGuardado: manual,
      pasosManual: pasos,
      pasoActivoManualId: pasos[0]?.id || "P00",
      timelineCurrentTime: 0,
      isTimelinePlaying: false,
      modalBibliotecaManualesAbierto: false,
    });
    guardarPasosEnCacheLocal(pasos, manual);
  },

  guardarManualProyecto: async (nombre, marca = "RTA Design", tipologia = "Manuales 3D") => {
    const state = get();
    set({ guardandoManual: true });

    try {
      const currentNombre = nombre || state.manualActivoGuardado?.nombre || state.muebleActivoGuardado?.nombre || "1_Comoda Ravenna";
      // Asegurar id canónico sin cruzar con mn_ravenna
      let manualId = state.manualActivoGuardado?.id;
      if (!manualId || (manualId === "manual_mn_ravenna" && currentNombre.toLowerCase().includes("comoda"))) {
        manualId = `manual_${currentNombre.toLowerCase().replace(/[^a-z0-9]/gi, "_")}`;
      }

      const payload: Manual3BMProyecto = {
        id: manualId,
        muebleOrigenId: state.muebleActivoGuardado?.id || state.parametros?.model_id || "1_Comoda Ravenna",
        nombre: currentNombre,
        marca: marca || state.manualActivoGuardado?.marca || "RTA Design",
        tipologia: tipologia || state.manualActivoGuardado?.tipologia || "Manuales 3D",
        fechaModificacion: new Date().toISOString(),
        parametrosMueble: { ...state.parametros },
        pasos: state.pasosManual,
      };

      const res = await fetch("/api/drive/manuales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_manual", manual: payload }),
      });

      if (res.ok) {
        set({ manualActivoGuardado: payload });
        guardarPasosEnCacheLocal(payload.pasos, payload);

        // 🔗 Sincronización Inteligente: Guardar pasos y geometría fresca también en el archivo .3bf del mueble
        let muebleTarget = state.muebleActivoGuardado;
        if (!muebleTarget && state.mueblesGuardados.length > 0) {
          muebleTarget = state.mueblesGuardados.find(
            (m) => m.nombre.toLowerCase() === currentNombre.toLowerCase() || m.id === "mueble_1789226875940_xq2sn"
          ) || null;
        }

        if (muebleTarget) {
          // Sanitizar instancias y purgar geometría duplicada para persistir el GHX fresco en .3bf
          const rawInst = state.instancias || {};
          const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
          for (const [k, v] of Object.entries(rawInst)) {
            sanitizedInst[k] = {
              ...v,
              posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
              rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
              parametros: { ...(v.parametros || {}) },
              resultado: v.resultado ? purgarResultadoGeometria(v.resultado) : undefined,
            };
          }

          const muebleSincronizado: MuebleGuardadoItem = {
            ...muebleTarget,
            instancias: Object.keys(sanitizedInst).length > 0 ? sanitizedInst : muebleTarget.instancias,
            pasosManual: payload.pasos,
            manualVinculadoId: payload.id,
            fechaGuardado: new Date().toISOString(),
          };
          set({ muebleActivoGuardado: muebleSincronizado });
          try {
            await fetch("/api/drive/muebles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "save_furniture", furniture: muebleSincronizado }),
            });
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("3bf_ultimo_mueble_id", muebleSincronizado.id);
            }
          } catch (eMueble) {
            console.warn("Mueble vinculado actualizado en local:", eMueble);
          }
        }

        try {
          const resList = await fetch("/api/drive/manuales", { method: "GET" });
          if (resList.ok) {
            const data = await resList.json();
            if (data.manuales) {
              set({ manualesDrive: data.manuales });
            }
          }
        } catch {}
        return true;
      }
      return false;
    } catch (e) {
      console.error("[3dBimFab Drive] Error guardando manual:", e);
      return false;
    } finally {
      set({ guardandoManual: false });
    }
  },

  eliminarManualProyecto: async (manualId) => {
    try {
      const res = await fetch("/api/drive/manuales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_manual", id: manualId }),
      });
      if (res.ok) {
        const state = get();
        if (state.manualActivoGuardado?.id === manualId) {
          set({ manualActivoGuardado: null });
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.removeItem(STORAGE_KEY_MANUAL_ACTIVO);
            localStorage.removeItem(STORAGE_KEY_LAST_MANUAL_ID);
          }
        }
        await get().cargarManualesDesdeDrive();
      }
    } catch (e) {
      console.error("[3dBimFab Drive] Error eliminando manual:", e);
    }
  },
  
  workerStatus: "checking",
  setWorkerStatus: (workerStatus) => set({ workerStatus }),
 
  modoVisual: "semitransparente",
  setModoVisual: (modoVisual) => set({ modoVisual }),
 
  escenarioLimpio: false,
  setEscenarioLimpio: (escenarioLimpio) => set({ escenarioLimpio }),
 
  calibracion: obtenerCalibracionInicial(),
  tieneIluminacionPredeterminada: typeof window !== "undefined" && window.localStorage ? Boolean(localStorage.getItem(STORAGE_KEY_ILUMINACION)) : false,
  setCalibracion: (key, value) =>
    set((state) => ({
      calibracion: { ...state.calibracion, [key]: value },
    })),
  resetCalibracion: () => set({ calibracion: defaultCalibracion }),

  // 💡 Iluminación de Estudio Interactiva
  setLuzPropiedad: (luzId, prop, valor) =>
    set((state) => {
      const luzActual = state.calibracion.lucesEstudio?.[luzId];
      if (!luzActual) return state;

      const luzActualizada: StudioLightConfig = {
        ...luzActual,
        [prop]: valor,
      };

      // Si cambia temperatura Kelvin, actualizar también el color Hex
      if (prop === "temperaturaKelvin") {
        luzActualizada.color = kelvinToHex(Number(valor));
      }

      // Sincronización retrocompatible de intensidades
      const extraSync: Partial<CalibracionVisual> = {};
      if (prop === "intensidad") {
        if (luzId === "key_sun") extraSync.intensidadLuzDirecta = Number(valor);
        if (luzId === "fill_light") extraSync.intensidadLuzRelleno = Number(valor);
        if (luzId === "ambient_light") extraSync.intensidadLuzAmbiental = Number(valor);
        if (luzId === "env_hdri") extraSync.intensidadLuzEntorno = Number(valor);
      }

      return {
        calibracion: {
          ...state.calibracion,
          ...extraSync,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: luzActualizada,
          },
        },
      };
    }),

  setLuzTarget: (luzId, target) =>
    set((state) => {
      const luz = state.calibracion.lucesEstudio?.[luzId];
      if (!luz) return state;
      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: { ...luz, target },
          },
        },
      };
    }),

  setLuzPosicionCartesiana: (luzId, pos) =>
    set((state) => {
      const luz = state.calibracion.lucesEstudio?.[luzId];
      if (!luz) return state;
      const [x, y, z] = pos;
      const distancia = Math.max(0.5, Math.sqrt(x * x + y * y + z * z));
      const elevacion = Math.max(5, Math.min(85, Math.round((Math.asin(Math.max(-1, Math.min(1, y / distancia))) * 180) / Math.PI)));
      let azimut = Math.round((Math.atan2(x, z) * 180) / Math.PI);
      if (azimut < 0) azimut += 360;

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: {
            ...state.calibracion.lucesEstudio,
            [luzId]: {
              ...luz,
              distancia: Number(distancia.toFixed(2)),
              elevacion,
              azimut,
            },
          },
        },
      };
    }),

  enfocarLuzACentro: (luzId) => {
    get().setLuzTarget(luzId, [0, 0.45, 0]);
  },

  seleccionarLuzEstudio: (luzId) =>
    set((state) => ({
      calibracion: {
        ...state.calibracion,
        luzSeleccionadaId: luzId,
      },
    })),

  toggleGizmosLuces: (mostrar) =>
    set((state) => ({
      calibracion: {
        ...state.calibracion,
        mostrarGizmosLuces: mostrar !== undefined ? mostrar : !state.calibracion.mostrarGizmosLuces,
      },
    })),

  mostrarMarcoEncuadre: false,
  setMostrarMarcoEncuadre: (mostrar) => set({ mostrarMarcoEncuadre: mostrar }),
  toggleMarcoEncuadre: () => set((s) => ({ mostrarMarcoEncuadre: !s.mostrarMarcoEncuadre })),

  aplicarPresetIluminacion: (presetKey) =>
    set((state) => {
      const preset = PRESETS_ILUMINACION[presetKey];
      if (!preset) return state;

      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      Object.entries(preset.luces).forEach(([lId, cambios]) => {
        if (lucesActuales[lId]) {
          lucesActuales[lId] = {
            ...lucesActuales[lId],
            ...cambios,
            color: cambios.temperaturaKelvin ? kelvinToHex(cambios.temperaturaKelvin) : (cambios.color || lucesActuales[lId].color),
          };
        }
      });

      return {
        calibracion: {
          ...state.calibracion,
          presetIluminacion: presetKey,
          intensidadLuzDirecta: lucesActuales["key_sun"]?.intensidad ?? state.calibracion.intensidadLuzDirecta,
          intensidadLuzRelleno: lucesActuales["fill_light"]?.intensidad ?? state.calibracion.intensidadLuzRelleno,
          intensidadLuzAmbiental: lucesActuales["ambient_light"]?.intensidad ?? state.calibracion.intensidadLuzAmbiental,
          lucesEstudio: lucesActuales,
        },
      };
    }),

  guardarIluminacionPredeterminada: () => {
    const { calibracion } = get();
    if (typeof window !== "undefined" && window.localStorage) {
      const configAGuardar = {
        presetIluminacion: calibracion.presetIluminacion,
        lucesEstudio: calibracion.lucesEstudio,
        intensidadLuzDirecta: calibracion.intensidadLuzDirecta,
        intensidadLuzAmbiental: calibracion.intensidadLuzAmbiental,
        intensidadLuzEntorno: calibracion.intensidadLuzEntorno,
        intensidadLuzRelleno: calibracion.intensidadLuzRelleno,
        mostrarGizmosLuces: calibracion.mostrarGizmosLuces,
      };
      try {
        localStorage.setItem(STORAGE_KEY_ILUMINACION, JSON.stringify(configAGuardar));
      } catch (e) {
        console.error("Error guardando iluminación predeterminada:", e);
      }
      set({ tieneIluminacionPredeterminada: true });
    }
  },

  restaurarIluminacionPredeterminada: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY_ILUMINACION);
    }
    set((state) => ({
      tieneIluminacionPredeterminada: false,
      calibracion: {
        ...state.calibracion,
        presetIluminacion: "estudio_suave",
        lucesEstudio: defaultLucesEstudio,
        intensidadLuzDirecta: 0.9,
        intensidadLuzAmbiental: 0.45,
        intensidadLuzEntorno: 1.0,
        intensidadLuzRelleno: 0.6,
      },
    }));
  },

  setHdriPersonalizado: (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);
    const blobUrl = URL.createObjectURL(file);

    set((state) => {
      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      const envHdriActual = lucesActuales["env_hdri"] || defaultLucesEstudio.env_hdri;

      lucesActuales["env_hdri"] = {
        ...envHdriActual,
        hdriUrl: blobUrl,
        hdriNombre: file.name,
        hdriThumbnailUrl: isImage ? blobUrl : undefined,
        esHdriPorDefecto: false,
      };

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: lucesActuales,
        },
      };
    });
  },

  restablecerHdriPorDefecto: () => {
    set((state) => {
      const lucesActuales = { ...(state.calibracion.lucesEstudio || defaultLucesEstudio) };
      const envHdriActual = lucesActuales["env_hdri"] || defaultLucesEstudio.env_hdri;

      lucesActuales["env_hdri"] = {
        ...envHdriActual,
        hdriUrl: DEFAULT_HDRI_CONFIG.url,
        hdriNombre: DEFAULT_HDRI_CONFIG.nombre,
        hdriThumbnailUrl: DEFAULT_HDRI_CONFIG.thumbnailUrl,
        esHdriPorDefecto: true,
      };

      return {
        calibracion: {
          ...state.calibracion,
          lucesEstudio: lucesActuales,
        },
      };
    });
  },

  hoveredPiece: null,
  setHoveredPiece: (hoveredPiece) => set({ hoveredPiece }),

  // Blender N-Panel (Sidebar)
  mostrarNPanel: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_mostrar_npanel") === "true",
  setMostrarNPanel: (mostrar) =>
    set((state) => {
      const nuevo = typeof mostrar === "function" ? mostrar(state.mostrarNPanel) : mostrar;
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_mostrar_npanel", String(nuevo));
      }
      return { mostrarNPanel: nuevo };
    }),
  pestanaNPanel: "componentes",
  setPestanaNPanel: (pestanaNPanel) => set({ pestanaNPanel: pestanaNPanel as any }),
  anchoNPanel: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_ancho_npanel")
    ? (() => {
        const val = Number(localStorage.getItem("3bf_ancho_npanel"));
        const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
        if (esMovil) {
          // En móvil forzar siempre escala ultra-angosta (175px por defecto, max 195px)
          if (!val || val > 195 || val < 130) return 175;
          return Math.max(140, Math.min(195, val));
        }
        if (!val || val < 280) return 380; // En PC restaurar a 380
        const maxLimit = typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400;
        return Math.max(280, Math.min(maxLimit, val));
      })()
    : (typeof window !== "undefined" && window.innerWidth < 1024 ? 175 : 380),
  setAnchoNPanel: (ancho) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 140 : 280;
    const maxW = esMovil ? 360 : (typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400);
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_npanel", String(normalizado));
    }
    set({ anchoNPanel: normalizado });
  },
  anchoNPanelManual: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_ancho_npanel_manual")
    ? (() => {
        const val = Number(localStorage.getItem("3bf_ancho_npanel_manual"));
        const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
        if (esMovil) {
          if (!val || val > 360 || val < 140) return 260;
          return Math.max(140, Math.min(360, val));
        }
        if (!val || val < 500) return 740; // En PC Modo Manual por defecto 740px funcional
        const maxLimit = typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400;
        return Math.max(500, Math.min(maxLimit, val));
      })()
    : (typeof window !== "undefined" && window.innerWidth < 1024 ? 260 : 740),
  setAnchoNPanelManual: (ancho) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 140 : 500;
    const maxW = esMovil ? 360 : (typeof window !== "undefined" ? Math.max(1400, window.innerWidth - 60) : 1400);
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_npanel_manual", String(normalizado));
    }
    set({ anchoNPanelManual: normalizado });
  },
  anchoPanelDerecho: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_ancho_panel_derecho")
    ? (() => {
        const val = Number(localStorage.getItem("3bf_ancho_panel_derecho"));
        const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
        if (esMovil) {
          // En móvil forzar siempre escala ultra-angosta (180px por defecto, max 210px)
          if (!val || val > 210 || val < 150) return 180;
          return Math.max(150, Math.min(210, val));
        }
        if (!val || val < 280) return 380; // En PC restaurar a 380
        return Math.max(280, Math.min(800, val));
      })()
    : (typeof window !== "undefined" && window.innerWidth < 1024 ? 180 : 380),
  setAnchoPanelDerecho: (ancho) => {
    const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
    const minW = esMovil ? 150 : 280;
    const maxW = esMovil ? 220 : 800;
    const normalizado = Math.max(minW, Math.min(maxW, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_panel_derecho", String(normalizado));
    }
    set({ anchoPanelDerecho: normalizado });
  },

  };
};
