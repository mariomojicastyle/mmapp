// @ts-nocheck
import * as THREE from "three";
import { guardarPasosEnCacheLocal } from "../../storeDefaults";
import { 
  coincidenMismoHerraje, 
  getSafeRestPosition, 
  resolverTableroAnfitrionHerraje, 
  TableroCapaReferencia 
} from "../../engine/cadStateUtils";
import { perteneceAMismaFamiliaPieza } from "../../piezaMadreUtils";
import type {
  CapaMultiplePlus,
  TableroCapaPlus,
  HerrajeCapaPlus,
  MultiplePlusConfigPaso,
  OffsetBancoCm,
  AcopleHeredadosConfig,
} from "../../storeTypes";

export const createManualMultiplePlusSlice = (set: any, get: any): any => ({
  // Inicializar o asegurar la estructura multiplePlus en el paso
  asegurarMultiplePlusPaso: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;

    if (!paso.multiplePlus || paso.tipo !== "multiple_plus") {
      const nuevoConfig: MultiplePlusConfigPaso = paso.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      const actualizados = state.pasosManual.map((p: any) =>
        p.id === pasoId ? { ...p, multiplePlus: nuevoConfig, tipo: "multiple_plus" } : p
      );
      set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
      guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    }
  },

  // 1. Crear una nueva capa limpia (Cero llenado automático)
  crearCapaPlus: (pasoId: string, nombre?: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const mp = p.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      const capaIndex = (mp.capas || []).length + 1;
      const nuevaCapa: CapaMultiplePlus = {
        id: `capa_plus_${Date.now()}_${capaIndex}`,
        nombre: nombre || `Capa ${capaIndex} de armado ${p.id}`,
        visible: true,
        tableros: [],
        herrajes: [],
        congelados: [],
        bloquesHeredadosIds: [],
        bloquesHeredadosVisibles: {},
        piezaMaster: undefined,
        orientacionBanco: {
          rotacion: [0, 0, 0],
          apoyoEnPiso: true,
        },
      };

      return {
        ...p,
        multiplePlus: {
          ...mp,
          capas: [...(mp.capas || []), nuevaCapa],
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 2. Eliminar capa
  eliminarCapaPlus: (pasoId: string, capaId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;

      // 🔍 Encontrar la capa a eliminar para liberar sus piezas hacia el paso
      const capaAEliminar = (p.multiplePlus.capas || []).find((c: any) => c.id === capaId);
      const tablerosIds = (capaAEliminar?.tableros || []).map((t: any) => t.id);
      const herrajesIds = [
        ...(capaAEliminar?.herrajes || []).map((h: any) => h.id),
        ...(capaAEliminar?.congelados || []).map((c: any) => c.id),
      ];

      // 🛡️ REGLA CANÓNICA: Los objetos dentro de la capa eliminada NO desaparecen al limbo:
      // Pasan automáticamente a piezasAsignadas y herrajesAsignados del paso, quedando visibles en reposo
      const piezasAsignadasSet = new Set<string>(p.piezasAsignadas || []);
      tablerosIds.forEach((id: string) => piezasAsignadasSet.add(id));

      const herrajesAsignadosSet = new Set<string>(p.herrajesAsignados || []);
      herrajesIds.forEach((id: string) => herrajesAsignadosSet.add(id));

      // Limpiar de capasOcultas si estuvieran allí para que queden visibles
      const todasLiberadas = new Set([...tablerosIds, ...herrajesIds]);
      const nuevasCapasOcultas = (p.capasOcultas || []).filter((o: string) => !todasLiberadas.has(o));

      return {
        ...p,
        piezasAsignadas: Array.from(piezasAsignadasSet),
        herrajesAsignados: Array.from(herrajesAsignadosSet),
        capasOcultas: nuevasCapasOcultas,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).filter((c: any) => c.id !== capaId),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 3. Toggle visibilidad de capa (Bombillo general de la capa)
  toggleVisibilidadCapaPlus: (pasoId: string, capaId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) =>
            c.id === capaId ? { ...c, visible: c.visible === false ? true : false } : c
          ),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 3b. Renombrar capa
  renombrarCapaPlus: (pasoId: string, capaId: string, nuevoNombre: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) =>
            c.id === capaId ? { ...c, nombre: nuevoNombre } : c
          ),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 3c. Reordenar capas con drag and drop
  reordenarCapasPlus: (pasoId: string, origenIndex: number, destinoIndex: number) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      const capas = [...(p.multiplePlus.capas || [])];
      if (
        origenIndex < 0 ||
        origenIndex >= capas.length ||
        destinoIndex < 0 ||
        destinoIndex >= capas.length
      ) {
        return p;
      }
      const [movida] = capas.splice(origenIndex, 1);
      capas.splice(destinoIndex, 0, movida);
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 4. Agregar Tablero a la capa
  // Por defecto: destinoId = "base_master", tiempoAparicion = 0, tiempoInicioMovimiento = 500
  agregarTableroPlus: (pasoId: string, capaId: string, tableroId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            // Evitar duplicados
            if (c.tableros.some((t: any) => t.id === tableroId)) return c;
            const nuevoTablero: TableroCapaPlus = {
              id: tableroId,
              destinoId: "base_master",
              tiempoAparicion: 0,
              tiempoInicioMovimiento: 500,
              offsetXCm: 0,
              offsetYCm: 0,
              offsetZCm: 0,
            };
            return {
              ...c,
              tableros: [...c.tableros, nuevoTablero],
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 5. Remover Tablero de la capa
  removerTableroPlus: (pasoId: string, capaId: string, tableroId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              tableros: c.tableros.filter((t: any) => t.id !== tableroId),
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 6. Actualizar configuración de un Tablero
  actualizarTableroPlus: (
    pasoId: string,
    capaId: string,
    tableroId: string,
    partial: Partial<TableroCapaPlus>
  ) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        tipo: "multiple_plus",
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              tableros: c.tableros.map((t: any) =>
                t.id === tableroId ? { ...t, ...partial } : t
              ),
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 7. Agregar Herraje a la capa
  // Por defecto: ejeAproximacion = "-X", tiempoAparicion = 0
  agregarHerrajePlus: (pasoId: string, capaId: string, herrajeId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            if (c.herrajes.some((h: any) => h.id === herrajeId) || (c.congelados || []).some((h: any) => h.id === herrajeId)) {
              return c;
            }
            const nuevoHerraje: HerrajeCapaPlus = {
              id: herrajeId,
              ejeAproximacion: "-X",
              tiempoAparicion: 0,
              congelado: false,
            };
            return {
              ...c,
              herrajes: [...c.herrajes, nuevoHerraje],
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 8. Remover Herraje de la capa
  removerHerrajePlus: (pasoId: string, capaId: string, herrajeId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              herrajes: c.herrajes.filter((h: any) => h.id !== herrajeId),
              congelados: (c.congelados || []).filter((h: any) => h.id !== herrajeId),
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 9. Actualizar Herraje
  actualizarHerrajePlus: (
    pasoId: string,
    capaId: string,
    herrajeId: string,
    partial: Partial<HerrajeCapaPlus>
  ) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              herrajes: (c.herrajes || []).map((h: any) =>
                h.id === herrajeId ? { ...h, ...partial } : h
              ),
              congelados: (c.congelados || []).map((h: any) =>
                h.id === herrajeId ? { ...h, ...partial } : h
              ),
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();

    if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
      (window as any).__3bfDespertarAnimacion();
    }
  },

  // 10. Congelar Herraje (Pasa a la sección Congelados)
  congelarHerrajePlus: (pasoId: string, capaId: string, herrajeId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const target = c.herrajes.find((h: any) => h.id === herrajeId);
            if (!target) return c;
            const herrajeCongelado = { ...target, congelado: true };
            return {
              ...c,
              herrajes: c.herrajes.filter((h: any) => h.id !== herrajeId),
              congelados: [...(c.congelados || []), herrajeCongelado],
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 11. Descongelar Herraje (Regresa a la sección activa de Herrajes)
  descongelarHerrajePlus: (pasoId: string, capaId: string, herrajeId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const target = (c.congelados || []).find((h: any) => h.id === herrajeId);
            if (!target) return c;
            const herrajeActivo = { ...target, congelado: false };
            return {
              ...c,
              congelados: (c.congelados || []).filter((h: any) => h.id !== herrajeId),
              herrajes: [...c.herrajes, herrajeActivo],
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 11b. Toggle Congelar / Descongelar Herraje
  toggleCongelarHerrajePlus: (pasoId: string, capaId: string, herrajeId: string) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const enCongelados = (c.congelados || []).find((h: any) => h.id === herrajeId);
            if (enCongelados) {
              const herrajeActivo = { ...enCongelados, congelado: false, ejeAproximacion: enCongelados.ejeAproximacion || "-X" };
              return {
                ...c,
                congelados: (c.congelados || []).filter((h: any) => h.id !== herrajeId),
                herrajes: [...c.herrajes, herrajeActivo],
              };
            }
            const enMoviles = (c.herrajes || []).find((h: any) => h.id === herrajeId);
            if (enMoviles) {
              const herrajeCongelado = { ...enMoviles, congelado: true };
              return {
                ...c,
                herrajes: c.herrajes.filter((h: any) => h.id !== herrajeId),
                congelados: [...(c.congelados || []), herrajeCongelado],
              };
            }
            return c;
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();
  },

  // 12. Velocidades globales del paso
  setVelocidadesPlus: (
    pasoId: string,
    velocidades: {
      velocidadTablerosCmS?: number;
      velocidadHerrajesCmS?: number;
      movimientoGlobalCm?: number;
    }
  ) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const mp = p.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      return {
        ...p,
        multiplePlus: {
          ...mp,
          ...velocidades,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 13. Pieza Master de la capa
  setPiezaMasterPlus: (pasoId: string, capaId: string, masterName?: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) =>
            c.id === capaId ? { ...c, piezaMaster: masterName || undefined } : c
          ),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  definirPiezaMasterPlus: (pasoId: string, capaId: string, masterName?: string) => {
    get().setPiezaMasterPlus(pasoId, capaId, masterName);
  },

  // 13.1 Desplazamiento del Subensamble en Banco de Trabajo (Offset X, Y, Z)
  actualizarOffsetBancoMasterPlus: (pasoId: string, capaId: string, offset: Partial<OffsetBancoCm>) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const actual = c.offsetBancoCm || { x: 0, y: 0, z: 0 };
            return {
              ...c,
              offsetBancoCm: {
                x: offset.x !== undefined ? offset.x : actual.x,
                y: offset.y !== undefined ? offset.y : actual.y,
                z: offset.z !== undefined ? offset.z : actual.z,
              },
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 13.2 Tiempo y Duración del Acople Solidario al Mueble CAD
  actualizarTiempoAcopleMasterPlus: (pasoId: string, capaId: string, tiempo?: number, duracion?: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              tiempoAcopleSegundos: tiempo !== undefined ? tiempo : c.tiempoAcopleSegundos,
              duracionAcopleSegundos: duracion !== undefined ? duracion : c.duracionAcopleSegundos,
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 14. Giro de Banco de Trabajo
  setGiroBancoPlus: (pasoId: string, capaId: string, axis: "X" | "Y", angleDeg: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const rotActual = c.orientacionBanco?.rotacion || [0, 0, 0];
            const angleRad = (angleDeg * Math.PI) / 180;
            const nuevaRot: [number, number, number] = [
              axis === "X" ? rotActual[0] + angleRad : rotActual[0],
              axis === "Y" ? rotActual[1] + angleRad : rotActual[1],
              rotActual[2],
            ];
            return {
              ...c,
              orientacionBanco: {
                rotacion: nuevaRot,
                apoyoEnPiso: c.orientacionBanco?.apoyoEnPiso ?? true,
              },
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 15. Toggle Apoyo en Piso
  toggleApoyoPisoPlus: (pasoId: string, capaId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const ob = c.orientacionBanco || { rotacion: [0, 0, 0], apoyoEnPiso: true };
            return {
              ...c,
              orientacionBanco: {
                ...ob,
                apoyoEnPiso: !ob.apoyoEnPiso,
              },
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 16. Toggle Bloque Heredado
  toggleBloqueHeredadoPlus: (pasoId: string, capaId: string, bloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const arr = c.bloquesHeredadosIds || [];
            const existe = arr.includes(bloqueId);
            const nuevosIds = existe ? arr.filter((id: string) => id !== bloqueId) : [...arr, bloqueId];
            return {
              ...c,
              bloquesHeredadosIds: nuevosIds,
              bloquesHeredadosVisibles: {
                ...(c.bloquesHeredadosVisibles || {}),
                [bloqueId]: !existe,
              },
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 17. Toggle Visibilidad de Bloque Heredado
  toggleVisibilidadBloqueHeredadoPlus: (pasoId: string, capaId: string, bloqueId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            const visMap = c.bloquesHeredadosVisibles || {};
            const estadoActual = visMap[bloqueId] !== false;
            return {
              ...c,
              bloquesHeredadosVisibles: {
                ...visMap,
                [bloqueId]: !estadoActual,
              },
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 18. Giro Global de Banco para todas las capas (X±90°, Y±90°, Z±90°)
  girarBancoGlobalPlus: (pasoId: string, eje: "X" | "Y" | "Z", anguloObjetivo: number) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;

    const rotActual = paso.orientacionBanco?.rotacion || [0, 0, 0];
    const rotX = rotActual[0] || 0;
    const rotY = rotActual[1] || 0;
    const rotZ = rotActual[2] || 0;

    const anguloActualEje = eje === "X" ? rotX : eje === "Y" ? rotY : rotZ;
    const nuevoAngulo = (anguloActualEje === anguloObjetivo || (Math.abs(anguloActualEje) === 180 && Math.abs(anguloObjetivo) === 180)) ? 0 : anguloObjetivo;
    const nuevoX = eje === "X" ? nuevoAngulo : rotX;
    const nuevoY = eje === "Y" ? nuevoAngulo : rotY;
    const nuevoZ = eje === "Z" ? nuevoAngulo : rotZ;

    const nuevaOrientacion = {
      rotacion: [nuevoX, nuevoY, nuevoZ] as [number, number, number],
      apoyoEnPiso: paso.orientacionBanco?.apoyoEnPiso ?? true,
      alturaZCm: paso.orientacionBanco?.alturaZCm ?? paso.multiplePlus?.alturaZCm ?? 0,
    };

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        orientacionBanco: nuevaOrientacion,
        multiplePlus: p.multiplePlus
          ? {
              ...p.multiplePlus,
              orientacionBanco: nuevaOrientacion,
            }
          : p.multiplePlus,
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 19. Toggle Apoyo Global en Piso (Suelo)
  toggleApoyoPisoGlobalPlus: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;

    const estadoActual = paso.orientacionBanco?.apoyoEnPiso ?? true;
    const nuevaOrientacion = {
      rotacion: (paso.orientacionBanco?.rotacion || [0, 0, 0]) as [number, number, number],
      apoyoEnPiso: !estadoActual,
      alturaZCm: paso.orientacionBanco?.alturaZCm ?? paso.multiplePlus?.alturaZCm ?? 0,
    };

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        orientacionBanco: nuevaOrientacion,
        multiplePlus: p.multiplePlus
          ? {
              ...p.multiplePlus,
              orientacionBanco: nuevaOrientacion,
            }
          : p.multiplePlus,
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 19.1 Ajustar desplazamiento del eje de rotación en cm (CDG)
  setOffsetEjeRotacionPlus: (pasoId: string, cm: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        multiplePlus: p.multiplePlus
          ? {
              ...p.multiplePlus,
              offsetEjeRotacionCm: cm,
            }
          : p.multiplePlus,
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 19.2 Ajustar altura vertical en Z (cm)
  setAlturaZPlus: (pasoId: string, cm: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const ob = p.orientacionBanco || { rotacion: [0, 0, 0], apoyoEnPiso: true };
      const nuevaOrientacion = {
        ...ob,
        alturaZCm: cm,
      };
      return {
        ...p,
        orientacionBanco: nuevaOrientacion,
        multiplePlus: p.multiplePlus
          ? {
              ...p.multiplePlus,
              alturaZCm: cm,
              orientacionBanco: nuevaOrientacion,
            }
          : p.multiplePlus,
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 19.3 Toggle Antigravedad Global Plus (Neutralizar caída al suelo de piezas al posicionar)
  toggleAntigravedadPlus: (pasoId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso) return;

    const actual = Boolean(paso.multiplePlus?.antigravedad);
    const nuevo = !actual;

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;

      // Si se activa la antigravedad, neutralizamos cualquier caída al suelo previa
      // (offsetYCm originado por floorDrop) en los tableros de este paso
      let nuevoMultiplePlus = p.multiplePlus ? { ...p.multiplePlus, antigravedad: nuevo } : p.multiplePlus;
      if (nuevo && nuevoMultiplePlus && nuevoMultiplePlus.capas) {
        nuevoMultiplePlus = {
          ...nuevoMultiplePlus,
          capas: nuevoMultiplePlus.capas.map((capa: any) => ({
            ...capa,
            tableros: (capa.tableros || []).map((t: any) => {
              if (typeof t.offsetYCm === "number" && t.offsetYCm !== 0) {
                return { ...t, offsetYCm: 0 };
              }
              return t;
            }),
          })),
        };
      }

      // Sincronizar también piezasEspera en configuracionCinematica si existe
      let nuevaConfigCinematica = p.configuracionCinematica;
      if (nuevo && nuevaConfigCinematica?.piezasEspera) {
        nuevaConfigCinematica = {
          ...nuevaConfigCinematica,
          piezasEspera: nuevaConfigCinematica.piezasEspera.map((pz: any) => {
            if (typeof pz.offsetYCm === "number" && pz.offsetYCm !== 0) {
              return { ...pz, offsetYCm: 0, apoyadaEnPiso: false };
            }
            return pz;
          }),
        };
      }

      return {
        ...p,
        multiplePlus: nuevoMultiplePlus,
        configuracionCinematica: nuevaConfigCinematica,
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 20. Toggle Animación Poner de Pie al Terminar
  togglePonerDePieAlFinalPlus: (pasoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      const estadoActual = Boolean(p.multiplePlus.ponerDePieAlFinal);
      const nuevoEstado = !estadoActual;

      let tInicio = p.multiplePlus.tiempoInicioDePie;
      let duracion = p.multiplePlus.duracionDePie ?? 4.0;
      let durPaso = (p.duracionTotal && p.duracionTotal < 60) ? p.duracionTotal : 10;

      if (nuevoEstado) {
        if (tInicio === undefined || tInicio === null) {
          let maxFin = 0;
          (p.multiplePlus.capas || []).forEach((c: any) => {
            (c.tableros || []).forEach((t: any) => {
              const tMov = t.tiempoInicioMovimiento || 0;
              if (tMov < 60) {
                const fin = tMov + 2.5;
                if (fin > maxFin) maxFin = fin;
              }
            });
            (c.herrajes || []).forEach((h: any) => {
              const tAp = h.tiempoAparicion || 0;
              if (tAp < 60) {
                const fin = tAp + 1.5;
                if (fin > maxFin) maxFin = fin;
              }
            });
          });
          tInicio = maxFin > 0 ? Math.ceil(maxFin) : 0;
        }
        durPaso = Math.max(8, Math.ceil(tInicio + duracion));
      }

      return {
        ...p,
        duracionTotal: durPaso,
        multiplePlus: {
          ...p.multiplePlus,
          ponerDePieAlFinal: nuevoEstado,
          tiempoInicioDePie: tInicio,
          duracionDePie: duracion,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 20b. Configurar tiempos exactos de Poner de Pie al Terminar
  setParametrosDePieAlFinalPlus: (pasoId: string, params: { tiempoInicio?: number; duracion?: number }) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      const tInicio = params.tiempoInicio !== undefined 
        ? Math.max(0, params.tiempoInicio) 
        : (p.multiplePlus.tiempoInicioDePie ?? 0);
      const duracion = params.duracion !== undefined 
        ? Math.max(0.5, params.duracion) 
        : (p.multiplePlus.duracionDePie ?? 4.0);

      const durPaso = Math.max(8, Math.ceil(tInicio + duracion));

      return {
        ...p,
        duracionTotal: durPaso,
        multiplePlus: {
          ...p.multiplePlus,
          tiempoInicioDePie: tInicio,
          duracionDePie: duracion,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 20c. Toggle Volteo / Giro Intermedio 180° (Sin retorno)
  toggleVolteoIntermedioPlus: (pasoId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      const actual = p.multiplePlus.volteoIntermedio;
      const estadoActual = Boolean(actual?.activo);
      const nuevoEstado = !estadoActual;

      const nuevoVolteo = {
        activo: nuevoEstado,
        eje: actual?.eje || "Y",
        anguloGrados: actual?.anguloGrados ?? 180,
        tiempoInicio: actual?.tiempoInicio ?? Math.max(10, Math.round((p.duracionTotal || 50) * 0.45)),
        duracion: actual?.duracion ?? 3.0,
        alturaEjeZCm: actual?.alturaEjeZCm ?? p.multiplePlus.offsetEjeRotacionCm ?? 30,
      };

      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          volteoIntermedio: nuevoVolteo,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 20d. Configurar parámetros de Volteo / Giro Intermedio 180°
  setParametrosVolteoIntermedioPlus: (pasoId: string, params: any) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      const actual = p.multiplePlus.volteoIntermedio || {
        activo: true,
        eje: "Y",
        anguloGrados: 180,
        tiempoInicio: 48,
        duracion: 3.0,
        alturaEjeZCm: p.multiplePlus.offsetEjeRotacionCm ?? 30,
      };

      const actualizado = {
        ...actual,
        ...params,
        tiempoInicio: params.tiempoInicio !== undefined ? Math.max(0, params.tiempoInicio) : actual.tiempoInicio,
        duracion: params.duracion !== undefined ? Math.max(0.5, params.duracion) : actual.duracion,
        alturaEjeZCm: params.alturaEjeZCm !== undefined ? params.alturaEjeZCm : (actual.alturaEjeZCm ?? p.multiplePlus.offsetEjeRotacionCm ?? 30),
      };

      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          volteoIntermedio: actualizado,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 21. Toggle Colapsar / Minimizar Capa
  toggleColapsarCapaPlus: (pasoId: string, capaId: string) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => {
            if (c.id !== capaId) return c;
            return {
              ...c,
              colapsada: !Boolean(c.colapsada),
            };
          }),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 22. Colapsar o Expandir todas las capas
  setColapsarTodasCapasPlus: (pasoId: string, colapsadas: boolean) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId || !p.multiplePlus) return p;
      return {
        ...p,
        multiplePlus: {
          ...p.multiplePlus,
          capas: (p.multiplePlus.capas || []).map((c: any) => ({
            ...c,
            colapsada: colapsadas,
          })),
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 23. Velocidad Tableros Plus
  setVelocidadTablerosPlus: (pasoId: string, velocidadCmS: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        multiplePlus: {
          ...(p.multiplePlus || {}),
          velocidadTablerosCmS: velocidadCmS,
        },
      };
    });
    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 24. Velocidad Herrajes Plus
  setVelocidadHerrajesPlus: (pasoId: string, velocidadCmS: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        multiplePlus: {
          ...(p.multiplePlus || {}),
          velocidadHerrajesCmS: velocidadCmS,
        },
      };
    });
    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 25. Movimiento Global (Desplazamiento) Plus
  setMovimientoGlobalPlus: (pasoId: string, movimientoCm: number) => {
    const state = get();
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        multiplePlus: {
          ...(p.multiplePlus || {}),
          movimientoGlobalCm: movimientoCm,
        },
      };
    });
    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
  },

  // 26. Posicionar en Pieza: Ubica y alinea todos los herrajes de la capa en los barrenos del tablero desplazado
  posicionarHerrajesEnPiezaPlus: (pasoId: string, capaId: string) => {
    const state = get();
    const paso = state.pasosManual.find((p: any) => p.id === pasoId);
    if (!paso || !paso.multiplePlus?.capas) return;

    const capa = paso.multiplePlus.capas.find((c: any) => c.id === capaId);
    if (!capa) return;

    // Actualizar directamente en Three.js para respuesta visual instantánea
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        // 1. Recolectar referencias de todos los tableros de la capa en reposo
        const tablerosCapaRefs: TableroCapaReferencia[] = [];
        searchRoot.traverse((child: any) => {
          if (child.isMesh) {
            const ik = (child.userData?.instanciaKey || "").toLowerCase().trim();
            const cn = (child.userData?.cleanName || "").toLowerCase().trim();
            const n = (child.name || "").toLowerCase().trim();
            const matchTab = (capa.tableros || []).find((t: any) => {
              const tId = (t.id || "").toLowerCase().trim();
              if (tId === ik || tId === cn || tId === n) return true;
              const matchT = tId.match(/\((\d+)\)/);
              const matchM = ik.match(/\((\d+)\)/) || cn.match(/\((\d+)\)/);
              if (matchT) {
                if (matchM) {
                  return matchM[1] === matchT[1] && perteneceAMismaFamiliaPieza(cn, tId);
                }
                return false;
              }
              if (matchM) return false;
              return (
                perteneceAMismaFamiliaPieza(tId, ik) ||
                perteneceAMismaFamiliaPieza(tId, cn) ||
                perteneceAMismaFamiliaPieza(tId, n)
              );
            });
            if (matchTab) {
              const pRest = getSafeRestPosition(child);
              const pRestWorld = child.parent ? child.parent.localToWorld(pRest.clone()) : pRest.clone();
              const curPos = child.position.clone();
              child.position.copy(pRest);
              child.updateWorldMatrix(true, true);
              const box = new THREE.Box3().setFromObject(child);
              child.position.copy(curPos);
              child.updateWorldMatrix(true, true);

              tablerosCapaRefs.push({
                id: matchTab.id,
                mesh: child,
                restWorldPos: pRestWorld,
                boxRestWorld: box,
                offsetXCm: matchTab.offsetXCm,
                offsetYCm: matchTab.offsetYCm,
                offsetZCm: matchTab.offsetZCm,
                tiempoInicioMovimiento: matchTab.tiempoInicioMovimiento,
              });
            }
          }
        });

        // 2. Para cada herraje de la capa, resolver su tablero anfitrión exacto
        const todosHerrajes = [...(capa.herrajes || []), ...(capa.congelados || [])];
        searchRoot.traverse((child: any) => {
          if (child.isMesh) {
            const ik = (child.userData?.instanciaKey || "").toLowerCase().trim();
            const cn = (child.userData?.cleanName || "").toLowerCase().trim();
            const n = (child.name || "").toLowerCase().trim();
            const coincide = todosHerrajes.some((h: any) => {
              const hLow = (h.id || "").toLowerCase().trim();
              const hwTargetLow = hLow.replace(/^rh_out:\s*/i, "").split("::").pop()!.trim();
              return (
                coincidenMismoHerraje(h.id, ik) ||
                coincidenMismoHerraje(hwTargetLow, ik) ||
                coincidenMismoHerraje(h.id, cn) ||
                coincidenMismoHerraje(hwTargetLow, cn) ||
                coincidenMismoHerraje(h.id, n) ||
                coincidenMismoHerraje(hwTargetLow, n)
              );
            });

            if (coincide) {
              const pRest = getSafeRestPosition(child);
              const pHwRestWorld = child.parent ? child.parent.localToWorld(pRest.clone()) : pRest.clone();
              const tabAnfitrion = resolverTableroAnfitrionHerraje(pHwRestWorld, tablerosCapaRefs);
              let vOffset = new THREE.Vector3(
                (tabAnfitrion?.offsetXCm || 0) / 100,
                (tabAnfitrion?.offsetYCm || 0) / 100,
                (tabAnfitrion?.offsetZCm || 0) / 100
              );

              // 🎯 Si la pieza anfitriona está en la escena, sincronizar con su desplazamiento real en vivo
              if (tabAnfitrion?.mesh) {
                const pRestMesh = getSafeRestPosition(tabAnfitrion.mesh);
                const curMeshPos = tabAnfitrion.mesh.position.clone();
                vOffset.copy(curMeshPos.sub(pRestMesh));
              }

              const pTarget = pRest.clone().add(vOffset);
              child.position.copy(pTarget);
              child.updateMatrixWorld(true);
            }
          }
        });
      }
    }

    // Forzar actualización de versión de animación y guardar
    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      return {
        ...p,
        tipo: "multiple_plus",
        versionAnimacionManual: (p.versionAnimacionManual || 0) + 1,
      };
    });

    set({
      pasosManual: actualizados,
      versionAnimacionManual: (state.versionAnimacionManual || 0) + 1,
    });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);

    if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
      (window as any).__3bfDespertarAnimacion();
    }
  },

  // 17. Conmutar modo de visualización de la Capa Virtual de Inactivos ("oculto" | "cristal" | "global")
  setModoVisualizacionInactivosPlus: (pasoId: string, modo: "oculto" | "cristal" | "global") => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const mp = p.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      return {
        ...p,
        multiplePlus: {
          ...mp,
          modoVisualizacionInactivos: modo,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();

    if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
      (window as any).__3bfDespertarAnimacion();
    }
  },

  // 17b. Conmutar modo de visualización de la Capa de Objetos Heredados ("solido" | "cristal" | "oculto")
  setModoVisualizacionHeredadosPlus: (pasoId: string, modo: "solido" | "cristal" | "oculto") => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const mp = p.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      return {
        ...p,
        multiplePlus: {
          ...mp,
          modoVisualizacionHeredados: modo,
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();

    if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
      (window as any).__3bfDespertarAnimacion();
    }
  },

  // 17c. Actualizar cinemática de acople de los objetos heredados hacia el paso actual
  actualizarAcopleHeredadosPlus: (pasoId: string, config: Partial<AcopleHeredadosConfig>) => {
    const state = get();
    if (state.prepararHistorialParaCambio) state.prepararHistorialParaCambio();

    const actualizados = state.pasosManual.map((p: any) => {
      if (p.id !== pasoId) return p;
      const mp = p.multiplePlus || {
        velocidadTablerosCmS: 15,
        velocidadHerrajesCmS: 8,
        movimientoGlobalCm: 20,
        capas: [],
      };
      const acopleActual: AcopleHeredadosConfig = mp.acopleHeredados || {
        modo: "recien_armado_a_heredado",
        tiempoAparicion: 0,
        tiempoInicio: Math.max(0.5, Number(((p.duracionAudioSegundos || 8) - 2.5).toFixed(1))),
        duracion: 2.5,
        ejeAproximacion: "+Z",
        distanciaAproximacionCm: 30,
      };

      return {
        ...p,
        multiplePlus: {
          ...mp,
          acopleHeredados: {
            ...acopleActual,
            ...config,
          },
        },
      };
    });

    set({ pasosManual: actualizados, versionAnimacionManual: (state.versionAnimacionManual || 0) + 1 });
    guardarPasosEnCacheLocal(actualizados, state.manualActivoGuardado);
    if (get().guardarEstadoHistorial) get().guardarEstadoHistorial();

    if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
      (window as any).__3bfDespertarAnimacion();
    }
  },

  // 18. Asignación rápida de una pieza/herraje inactivo a una capa activa
  asignarInactivoACapaPlus: (pasoId: string, capaId: string, meshKey: string, tipo: "tablero" | "herraje") => {
    const slice = get();
    if (tipo === "tablero") {
      if (slice.agregarTableroPlus) {
        slice.agregarTableroPlus(pasoId, capaId, meshKey);
      }
    } else {
      if (slice.agregarHerrajePlus) {
        slice.agregarHerrajePlus(pasoId, capaId, meshKey);
      }
    }
  },
});

