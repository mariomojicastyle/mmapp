// @ts-nocheck
import { guardarPasosEnCacheLocal } from "../../storeDefaults";
import { anotarInstanciasFisicas, extraerPiezaMadre, esHerrajeNombre } from "../../piezaMadreUtils";
import type { ModoPickingManualState } from "../../storeTypes";

export const createManualPickingSlice = (set: any, get: any): any => ({
  // 🎯 Modo Picking 3D / Cuentagotas para Asignación de Piezas
  modoPickingManual: {
    activo: false,
    modo: "agregar",
    grupoId: null,
    pasoId: null,
    piezasTemporalmenteSeleccionadas: [],
  } as ModoPickingManualState,

  iniciarPickingManual: (pasoId: string, grupoId: string | null = null, modo: "agregar" | "retirar" = "agregar") => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    let piezasIniciales: string[] = [];
    if (paso && paso.showcase && grupoId) {
      const grupo = (paso.showcase.gruposCinematicos || []).find((g: any) => g.id === grupoId);
      if (grupo) {
        piezasIniciales = [...grupo.piezas];
      }
    } else if (paso && paso.subbloques && grupoId) {
      const sub = paso.subbloques.find((s: any) => s.id === grupoId);
      if (sub) {
        piezasIniciales = Array.from(new Set([...(sub.piezas || []), ...(sub.herrajes || [])]));
      }
    } else if (paso) {
      // 🧩 Modo Ensamble (Paso 01+): piezas de madera y herrajes asignados al paso
      piezasIniciales = Array.from(new Set([...(paso.piezasAsignadas || []), ...(paso.herrajesAsignados || [])]));
    }

    // En modo picking no forzamos piezasOcultas en el paso; la ocultación temporal se gestiona por el modo de picking activo
    set({
      modoPickingManual: {
        activo: true,
        modo,
        grupoId: grupoId || null,
        pasoId,
        piezasTemporalmenteSeleccionadas: piezasIniciales,
      },
    });
  },

  retirarComponenteManual3D: (meshTargetKey: string, pasoId?: string) => {
    const state = get();
    const targetPasoId = pasoId || state.pasoActivoManualId;
    const paso = state.pasosManual.find((p: any) => p.id === targetPasoId);
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
    const tieneGenericoEnHerrajes = nuevosHerrajes.some((h: string) => {
      const hClean = h.replace(/^RH_OUT:\s*/i, "").trim();
      return (hClean === targetBase || extraerPiezaMadre(hClean) === targetBase) && !hClean.includes("(");
    });

    if (tieneGenericoEnHerrajes && targetClean !== targetBase) {
      // Si existía entrada genérica (ej. "Cavilha"), expandirla a todas las instancias físicas excepto la retirada
      const realMeshes: any[] = [];
      Object.values(state.instancias).forEach((inst: any) => {
        if (inst.resultado?.real_meshes) {
          realMeshes.push(...inst.resultado.real_meshes);
        }
      });
      const anotadas = anotarInstanciasFisicas(realMeshes);
      const instanciasDeEsteTipo = anotadas
        .filter((m: any) => {
          const mClean = (m.name || "").replace(/^RH_OUT:\s*/i, "").trim();
          return mClean === targetBase || extraerPiezaMadre(mClean).replace(/\s*\(\d+\)$/, "").trim() === targetBase;
        })
        .map((m: any) => m.instanciaKey)
        .filter(Boolean);

      const instanciasUnicas = Array.from(new Set(instanciasDeEsteTipo));
      if (instanciasUnicas.length > 0) {
        nuevosHerrajes = nuevosHerrajes.filter((h: string) => {
          const hClean = h.replace(/^RH_OUT:\s*/i, "").trim();
          return hClean !== targetBase && extraerPiezaMadre(hClean) !== targetBase;
        });
        const restantes = instanciasUnicas.filter((instKey) => !coincideConTarget(instKey));
        nuevosHerrajes = Array.from(new Set([...nuevosHerrajes, ...restantes]));
      } else {
        nuevosHerrajes = nuevosHerrajes.filter((h: string) => !coincideConTarget(h));
      }
    } else {
      nuevosHerrajes = nuevosHerrajes.filter((h: string) => !coincideConTarget(h));
    }

    // Mismo tratamiento por si hubiera tableros con entrada genérica
    const tieneGenericoEnPiezas = nuevasPiezas.some((p: string) => {
      const pClean = p.replace(/^RH_OUT:\s*/i, "").trim();
      return (pClean === targetBase || extraerPiezaMadre(pClean) === targetBase) && !pClean.includes("(");
    });

    if (tieneGenericoEnPiezas && targetClean !== targetBase) {
      const realMeshes: any[] = [];
      Object.values(state.instancias).forEach((inst: any) => {
        if (inst.resultado?.real_meshes) {
          realMeshes.push(...inst.resultado.real_meshes);
        }
      });
      const anotadas = anotarInstanciasFisicas(realMeshes);
      const instanciasDeEsteTipo = anotadas
        .filter((m: any) => {
          const mClean = (m.name || "").replace(/^RH_OUT:\s*/i, "").trim();
          return mClean === targetBase || extraerPiezaMadre(mClean).replace(/\s*\(\d+\)$/, "").trim() === targetBase;
        })
        .map((m: any) => m.instanciaKey)
        .filter(Boolean);

      const instanciasUnicas = Array.from(new Set(instanciasDeEsteTipo));
      if (instanciasUnicas.length > 0) {
        nuevasPiezas = nuevasPiezas.filter((p: string) => {
          const pClean = p.replace(/^RH_OUT:\s*/i, "").trim();
          return pClean !== targetBase && extraerPiezaMadre(pClean) !== targetBase;
        });
        const restantes = instanciasUnicas.filter((instKey) => !coincideConTarget(instKey));
        nuevasPiezas = Array.from(new Set([...nuevasPiezas, ...restantes]));
      } else {
        nuevasPiezas = nuevasPiezas.filter((p: string) => !coincideConTarget(p));
      }
    } else {
      nuevasPiezas = nuevasPiezas.filter((p: string) => !coincideConTarget(p));
    }

    const nuevaSecuencia = (paso.secuencia || []).filter((s: any) => !coincideConTarget(s.nombreNodo));

    const actualizados = state.pasosManual.map((p: any) => {
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

  togglePiezaEnPickingManual: (piezaMadre: string) => {
    const pm = extraerPiezaMadre(piezaMadre);
    if (!pm) return;
    const { modoPickingManual, pasosManual } = get();
    if (!modoPickingManual.activo) return;

    // Sincronizar con el grupo activo si existe para que siempre sea la fuente de verdad
    let listaBase = modoPickingManual.piezasTemporalmenteSeleccionadas;
    if (modoPickingManual.pasoId && modoPickingManual.grupoId) {
      const paso = pasosManual.find((p: any) => p.id === modoPickingManual.pasoId);
      if (paso?.tipo === "showcase") {
        const grupo = (paso?.showcase?.gruposCinematicos || []).find((g: any) => g.id === modoPickingManual.grupoId);
        if (grupo) {
          listaBase = grupo.piezas;
        }
      } else if (paso?.subbloques) {
        const sub = paso.subbloques.find((s: any) => s.id === modoPickingManual.grupoId);
        if (sub) {
          listaBase = Array.from(new Set([...(sub.piezas || []), ...(sub.herrajes || [])]));
        }
      }
    } else if (modoPickingManual.pasoId) {
      const paso = pasosManual.find((p: any) => p.id === modoPickingManual.pasoId);
      if (paso) {
        listaBase = Array.from(new Set([...(paso.piezasAsignadas || []), ...(paso.herrajesAsignados || [])]));
      }
    }

    const existe = listaBase.some((p: string) => p === pm || extraerPiezaMadre(p) === pm);
    let nuevas: string[];
    if (modoPickingManual.modo === "retirar") {
      nuevas = listaBase.filter((p: string) => p !== pm && extraerPiezaMadre(p) !== pm);
    } else {
      nuevas = existe
        ? listaBase.filter((p: string) => p !== pm && extraerPiezaMadre(p) !== pm)
        : [...listaBase, pm];
    }

    // Sincronización reactiva en tiempo real si hay un grupo de cajón activo O subbloque O paso de ensamble
    let pasosActualizados = pasosManual;
    if (modoPickingManual.pasoId && modoPickingManual.grupoId) {
      pasosActualizados = pasosManual.map((p: any) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        if (p.tipo === "showcase" && p.showcase) {
          const modificados = (p.showcase.gruposCinematicos || []).map((g: any) => {
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
          const modificados = p.subbloques.map((s: any) => {
            if (s.id !== modoPickingManual.grupoId) return s;
            return {
              ...s,
              piezas: nuevas.filter((pz: string) => !esHerrajeNombre(pz)),
              herrajes: nuevas.filter((pz: string) => esHerrajeNombre(pz)),
            };
          });
          const nuevasPz = nuevas.filter((pz: string) => !esHerrajeNombre(pz));
          const nuevosHr = nuevas.filter((pz: string) => esHerrajeNombre(pz));
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
      pasosActualizados = pasosManual.map((p: any) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        return {
          ...p,
          piezasAsignadas: nuevas.filter((pz: string) => !esHerrajeNombre(pz)),
          herrajesAsignados: nuevas.filter((pz: string) => esHerrajeNombre(pz)),
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
    const st = get();
    let pasosActualizados = st.pasosManual;
    const pasoActivoId = st.modoPickingManual.pasoId || st.pasoActivoManualId;
    if (pasoActivoId) {
      const paso = st.pasosManual.find((p: any) => p.id === pasoActivoId);
      if (paso && paso.piezasOcultas) {
        pasosActualizados = st.pasosManual.map((p: any) =>
          p.id === pasoActivoId ? { ...p, piezasOcultas: false } : p
        );
        guardarPasosEnCacheLocal(pasosActualizados, st.manualActivoGuardado);
      }
    }

    set({
      pasosManual: pasosActualizados,
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
      const actualizados = pasosManual.map((p: any) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        if (p.showcase) {
          const modificados = (p.showcase.gruposCinematicos || []).map((g: any) => {
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
          const modificados = p.subbloques.map((s: any) => {
            if (s.id !== modoPickingManual.grupoId) return s;
            return {
              ...s,
              piezas: nuevas.filter((pz: string) => !esHerrajeNombre(pz)),
              herrajes: nuevas.filter((pz: string) => esHerrajeNombre(pz)),
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
      const actualizados = pasosManual.map((p: any) => {
        if (p.id !== modoPickingManual.pasoId) return p;
        const nuevas = modoPickingManual.piezasTemporalmenteSeleccionadas;
        return {
          ...p,
          piezasAsignadas: nuevas.filter((pz: string) => !esHerrajeNombre(pz)),
          herrajesAsignados: nuevas.filter((pz: string) => esHerrajeNombre(pz)),
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
});
