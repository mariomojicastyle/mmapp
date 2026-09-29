"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Layers,
  Crown,
  Trash2,
  Snowflake,
  Search,
  Plus,
  Box,
  Eye,
  EyeOff,
  GripVertical,
  GripHorizontal,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  LocateFixed,
  Check,
  Move,
  Link2,
} from "lucide-react";
import { CapaMultiplePlus, PasoManualStudio, TableroCapaPlus, HerrajeCapaPlus, OffsetBancoCm } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";
import { CapsulaTableroPlus } from "./CapsulaTableroPlus";
import { CapsulaHerrajePlus } from "./CapsulaHerrajePlus";
import { IconOcultarMostrar, IconOcultarMostrarInvertido as IconInvertir } from "../StepManagerIcons";

interface CapaMultiplePlusCardProps {
  capa: CapaMultiplePlus;
  paso: PasoManualStudio;
  pasosManual: PasoManualStudio[];
  botonActivoColor: string;
  piezaEnPosicionamiento: { pasoId: string; nombrePieza: string } | string | null;
  modoPickingManual: any;
  indexCapa?: number;
  esDragOver?: boolean;
  onHoverHerrajes: (mallas: string[] | null) => void;
  onToggleVisibilidadCapa: (capaId: string) => void;
  onRenombrarCapa: (capaId: string, nuevoNombre: string) => void;
  onDragStartCapa?: (e: React.DragEvent, index: number) => void;
  onDragOverCapa?: (e: React.DragEvent, index: number) => void;
  onDragLeaveCapa?: (e: React.DragEvent, index: number) => void;
  onDropCapa?: (e: React.DragEvent, index: number) => void;
  onDragEndCapa?: () => void;
  onEliminarCapa: (capaId: string) => void;
  onActualizarTablero: (capaId: string, tableroId: string, partial: Partial<TableroCapaPlus>) => void;
  onRemoverTablero: (capaId: string, tableroId: string) => void;
  onActualizarHerraje: (capaId: string, herrajeId: string, partial: Partial<HerrajeCapaPlus>) => void;
  onRemoverHerraje: (capaId: string, herrajeId: string) => void;
  onToggleCongelarHerraje: (capaId: string, herrajeId: string) => void;
  onDefinirMaster: (capaId: string, piezaNombre: string | undefined) => void;
  onActualizarOffsetMaster?: (capaId: string, offset: OffsetBancoCm) => void;
  onActualizarTiempoAcopleMaster?: (capaId: string, tiempoAcopleSegundos: number, duracionAcopleSegundos: number) => void;
  onToggleColapsar?: (capaId: string) => void;
  onTogglePosicionar: (tableroId: string) => void;
  onIniciarPickingCapa: (capaId: string) => void;
  onLimpiarPicking: () => void;
  onToggleBloqueHeredado: (capaId: string, bloqueId: string) => void;
  onToggleVisibilidadBloqueHeredado: (capaId: string, bloqueId: string) => void;
  onInvertirSeleccion: () => void;
  onPosicionarHerrajesEnPieza?: (capaId: string) => void;
}

export function CapaMultiplePlusCard({
  capa,
  paso,
  pasosManual,
  botonActivoColor,
  piezaEnPosicionamiento,
  modoPickingManual,
  indexCapa,
  esDragOver,
  onHoverHerrajes,
  onToggleVisibilidadCapa,
  onRenombrarCapa,
  onDragStartCapa,
  onDragOverCapa,
  onDragLeaveCapa,
  onDropCapa,
  onDragEndCapa,
  onEliminarCapa,
  onActualizarTablero,
  onRemoverTablero,
  onActualizarHerraje,
  onRemoverHerraje,
  onToggleCongelarHerraje,
  onDefinirMaster,
  onActualizarOffsetMaster,
  onActualizarTiempoAcopleMaster,
  onToggleColapsar,
  onTogglePosicionar,
  onIniciarPickingCapa,
  onLimpiarPicking,
  onToggleBloqueHeredado,
  onToggleVisibilidadBloqueHeredado,
  onInvertirSeleccion,
  onPosicionarHerrajesEnPieza,
}: CapaMultiplePlusCardProps) {
  const conmutarVisibilidadGrupoCinematico = use3BFStore((s: any) => s.conmutarVisibilidadGrupoCinematico);

  const pasoP00 = useMemo(() => {
    return pasosManual.find((p) => p.showcase?.gruposCinematicos && p.showcase.gruposCinematicos.length > 0) || pasosManual[0];
  }, [pasosManual]);

  // Identificar si esta capa corresponde a un bloque funcional de P00
  const grupoBloqueFuncional = useMemo(() => {
    const grupos = pasoP00?.showcase?.gruposCinematicos || [];
    if (capa.bloqueFuncionalId) {
      const match = grupos.find((g: any) => g.id === capa.bloqueFuncionalId);
      if (match) return match;
    }
    const nombreLow = (capa.nombre || "").toLowerCase();
    return grupos.find((g: any) => nombreLow.includes(g.nombre.toLowerCase()));
  }, [capa.bloqueFuncionalId, capa.nombre, pasoP00]);

  const [busquedaHerrajes, setBusquedaHerrajes] = useState("");
  const [nombreSeleccionado, setNombreSeleccionado] = useState(false);
  const [posicionadoOk, setPosicionadoOk] = useState(false);

  // 📏 Altura ajustable y expandible para la lista de herrajes (memoria local)
  const [alturaHerrajesPx, setAlturaHerrajesPx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const guardada = localStorage.getItem("3bf_capa_herrajes_height");
      if (guardada) {
        const parsed = parseInt(guardada, 10);
        if (!isNaN(parsed) && parsed >= 120 && parsed <= 1600) return parsed;
      }
    }
    return 192; // 192px = equivalente a max-h-48
  });
  const [esHerrajesExpandido, setEsHerrajesExpandido] = useState(false);
  const [arrastrandoAltura, setArrastrandoAltura] = useState(false);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(0);

  // 🪵 Altura ajustable y expandible para la lista de tableros de madera (memoria local)
  const [alturaTablerosPx, setAlturaTablerosPx] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const guardada = localStorage.getItem("3bf_capa_tableros_height");
      if (guardada) {
        const parsed = parseInt(guardada, 10);
        if (!isNaN(parsed) && parsed >= 80 && parsed <= 1200) return parsed;
      }
    }
    return 180; // 180px por defecto
  });
  const [esTablerosExpandido, setEsTablerosExpandido] = useState(false);
  const [arrastrandoAlturaTableros, setArrastrandoAlturaTableros] = useState(false);
  const dragStartYTablerosRef = useRef(0);
  const startHeightTablerosRef = useRef(0);

  const handleStartResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setArrastrandoAltura(true);
    setEsHerrajesExpandido(false);
    dragStartYRef.current = e.clientY;
    startHeightRef.current = alturaHerrajesPx;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!arrastrandoAltura) return;
    const deltaY = e.clientY - dragStartYRef.current;
    const nuevaAltura = Math.max(120, Math.min(1400, Math.round(startHeightRef.current + deltaY)));
    setAlturaHerrajesPx(nuevaAltura);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!arrastrandoAltura) return;
    setArrastrandoAltura(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.setItem("3bf_capa_herrajes_height", String(alturaHerrajesPx));
    }
  };

  const handleToggleExpandir = () => {
    setEsHerrajesExpandido((prev) => !prev);
  };

  const handleStartResizeTableros = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setArrastrandoAlturaTableros(true);
    setEsTablerosExpandido(false);
    dragStartYTablerosRef.current = e.clientY;
    startHeightTablerosRef.current = alturaTablerosPx;
  };

  const handlePointerMoveTableros = (e: React.PointerEvent) => {
    if (!arrastrandoAlturaTableros) return;
    const deltaY = e.clientY - dragStartYTablerosRef.current;
    const nuevaAltura = Math.max(80, Math.min(1200, Math.round(startHeightTablerosRef.current + deltaY)));
    setAlturaTablerosPx(nuevaAltura);
  };

  const handlePointerUpTableros = (e: React.PointerEvent) => {
    if (!arrastrandoAlturaTableros) return;
    setArrastrandoAlturaTableros(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.setItem("3bf_capa_tableros_height", String(alturaTablerosPx));
    }
  };

  const handleToggleExpandirTableros = () => {
    setEsTablerosExpandido((prev) => !prev);
  };

  const handlePosicionarHerrajes = () => {
    if (onPosicionarHerrajesEnPieza) {
      onPosicionarHerrajesEnPieza(capa.id);
      setPosicionadoOk(true);
      setTimeout(() => setPosicionadoOk(false), 1600);
    }
  };

  const estaEnPickingCapa = Boolean(
    modoPickingManual.activo &&
    modoPickingManual.pasoId === paso.id &&
    modoPickingManual.grupoId === capa.id
  );

  const estaColapsada = Boolean(capa.colapsada);

  // Opciones de destino: bloques heredados + tableros de la misma capa + tableros de otras capas
  const opcionesDestino = useMemo(() => {
    const list: Array<{ id: string; label: string; esHeredado?: boolean }> = [];

    // Bloques heredados asignados a esta capa
    (capa.bloquesHeredadosIds || []).forEach((bId) => {
      const pHeredado = pasosManual.find((p) => p.id === bId);
      list.push({
        id: bId,
        label: pHeredado ? `${pHeredado.id} - ${pHeredado.titulo}` : bId,
        esHeredado: true,
      });
    });

    // Tableros de esta misma capa (compañeros de capa para ensamblaje relativo)
    (capa.tableros || []).forEach((t) => {
      list.push({
        id: t.id,
        label: t.id,
        esHeredado: false,
      });
    });

    // Tableros de otras capas del mismo paso
    (paso.multiplePlus?.capas || []).forEach((c) => {
      if (c.id !== capa.id) {
        c.tableros.forEach((t) => {
          list.push({
            id: t.id,
            label: `${t.id} (${c.nombre})`,
            esHeredado: false,
          });
        });
      }
    });

    return list;
  }, [capa.bloquesHeredadosIds, capa.tableros, paso.multiplePlus?.capas, pasosManual, capa.id]);

  // Pasos previos elegibles para Bloques Heredados
  const pasosPrevios = useMemo(() => {
    const idxActual = pasosManual.findIndex((p) => p.id === paso.id);
    if (idxActual <= 0) return [];
    return pasosManual.slice(0, idxActual);
  }, [pasosManual, paso.id]);

  // Filtrado de herrajes activos
  const herrajesFiltrados = useMemo(() => {
    if (!busquedaHerrajes.trim()) return capa.herrajes;
    const q = busquedaHerrajes.toLowerCase();
    return capa.herrajes.filter((h) => h.id.toLowerCase().includes(q));
  }, [capa.herrajes, busquedaHerrajes]);

  return (
    <div
      draggable={Boolean(onDragStartCapa)}
      onDragStart={(e) => onDragStartCapa && typeof indexCapa === "number" && onDragStartCapa(e, indexCapa)}
      onDragOver={(e) => onDragOverCapa && typeof indexCapa === "number" && onDragOverCapa(e, indexCapa)}
      onDragLeave={(e) => onDragLeaveCapa && typeof indexCapa === "number" && onDragLeaveCapa(e, indexCapa)}
      onDrop={(e) => onDropCapa && typeof indexCapa === "number" && onDropCapa(e, indexCapa)}
      onDragEnd={() => onDragEndCapa && onDragEndCapa()}
      className={`flex flex-col border shadow-sm transition-all ${
        estaColapsada ? "p-2 px-3.5 gap-0 rounded-2xl" : "p-3.5 gap-3 rounded-3xl"
      } ${
        esDragOver ? "ring-2 ring-cyan-500 scale-[1.01] shadow-md" : ""
      } ${
        capa.visible !== false
          ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-cyan-500/40"
          : "border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 opacity-75"
      }`}
    >
      {/* ── FILA 1: CABECERA DE LA CAPA (Colapsar, Grip, Nombre Editable, Ojito, Bloques Heredados, Controles) ── */}
      <div className={`flex flex-wrap items-center justify-between gap-2 ${
        estaColapsada ? "border-b-0 pb-0" : "border-b border-slate-100 dark:border-slate-800/80 pb-2.5"
      }`}>
        {/* Izquierda: Chevrón colapsar, Grip de arrastre, Badge, Nombre Editable y Ojito de Visibilidad */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* ▾ / ▸ Botón Colapsar / Minimizar */}
          <button
            type="button"
            onClick={() => onToggleColapsar && onToggleColapsar(capa.id)}
            title={estaColapsada ? "Expandir detalles de la capa" : "Minimizar / Colapsar capa"}
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            {estaColapsada ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {onDragStartCapa && (
            <div
              title="Arrastra para reordenar esta capa"
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
          <span
            style={{ backgroundColor: botonActivoColor }}
            className="w-2.5 h-2.5 rounded-full shrink-0"
          />
          <input
            type="text"
            value={capa.nombre}
            onChange={(e) => onRenombrarCapa(capa.id, e.target.value)}
            onFocus={(e) => {
              if (!nombreSeleccionado) {
                e.currentTarget.select();
              }
            }}
            onClick={(e) => {
              if (!nombreSeleccionado) {
                e.currentTarget.select();
                setNombreSeleccionado(true);
              }
            }}
            onBlur={() => {
              setNombreSeleccionado(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                e.currentTarget.blur();
              }
            }}
            placeholder="Nombre de la capa..."
            title="1 clic: seleccionar todo para reemplazar | 2 clics: editar texto"
            className="font-extrabold text-xs text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 focus:bg-cyan-50/20 dark:focus:bg-cyan-950/20 outline-none transition px-1 py-0.5 rounded cursor-text min-w-[120px] max-w-[260px] truncate select-all"
          />
          {/* 👁️ Ojito interactivo al lado derecho del nombre de la capa */}
          <button
            type="button"
            onClick={() => onToggleVisibilidadCapa(capa.id)}
            title={capa.visible !== false ? "Ocultar capa completa en el visor 3D" : "Mostrar capa completa en el visor 3D"}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              capa.visible !== false
                ? "text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {capa.visible !== false ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 🗄️ Botón Espejo de Visibilidad de Bloque Funcional */}
          {grupoBloqueFuncional && (
            <button
              type="button"
              onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupoBloqueFuncional.id)}
              title={
                grupoBloqueFuncional.oculto
                  ? `Bloque Funcional oculto en 3D. Clic para mostrar ${grupoBloqueFuncional.nombre}`
                  : `Bloque Funcional visible en 3D. Clic para ocultar ${grupoBloqueFuncional.nombre}`
              }
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border transition cursor-pointer shadow-2xs shrink-0 ${
                grupoBloqueFuncional.oculto
                  ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs animate-pulse"
                  : "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100"
              }`}
            >
              <span className="text-[10px]">🗄️</span>
              <span className="truncate max-w-[85px]">{grupoBloqueFuncional.nombre}</span>
              {grupoBloqueFuncional.oculto ? (
                <EyeOff className="w-3 h-3 text-white" />
              ) : (
                <Eye className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              )}
            </button>
          )}
        </div>

        {/* Centro-Derecha: Bloques Heredados */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {pasosPrevios.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <Box className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="text-slate-500">Bloques heredados:</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onToggleBloqueHeredado(capa.id, e.target.value);
                  }
                }}
                className="bg-transparent font-extrabold text-cyan-700 dark:text-cyan-300 outline-none cursor-pointer text-[10px]"
              >
                <option value="">+ Asignar...</option>
                {pasosPrevios.map((pPrev) => {
                  const yaAsignado = (capa.bloquesHeredadosIds || []).includes(pPrev.id);
                  return (
                    <option key={pPrev.id} value={pPrev.id}>
                      {yaAsignado ? `✓ ${pPrev.id} - ${pPrev.titulo}` : `${pPrev.id} - ${pPrev.titulo}`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Píldoras de bloques heredados asignados */}
          {(capa.bloquesHeredadosIds || []).map((bId) => {
            const visible = capa.bloquesHeredadosVisibles?.[bId] !== false;
            return (
              <div
                key={bId}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-cyan-50 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200 shadow-2xs"
              >
                <span>🧩 {bId}</span>
                <button
                  type="button"
                  onClick={() => onToggleVisibilidadBloqueHeredado(capa.id, bId)}
                  title={visible ? "Ocultar bloque heredado" : "Mostrar bloque heredado"}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition cursor-pointer ${
                    visible ? "text-cyan-600 hover:text-cyan-800" : "text-slate-400 line-through"
                  }`}
                >
                  <IconOcultarMostrar className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleBloqueHeredado(capa.id, bId)}
                  title="Desasignar bloque heredado de esta capa"
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}

          {/* 💡 Bombillo de Picking 3D (Amarillo cuando activo / Gris para iniciar) */}
          <button
            type="button"
            onClick={() => {
              onHoverHerrajes(null);
              if (estaEnPickingCapa) {
                onLimpiarPicking();
              } else {
                onIniciarPickingCapa(capa.id);
              }
            }}
            title={
              estaEnPickingCapa
                ? "Picking activo: toca piezas en el visor 3D para agregarlas o retirarlas. Clic para finalizar."
                : "Activar picking 3D: toca piezas en el visor 3D para empacar en esta capa"
            }
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer shadow-xs ${
              estaEnPickingCapa
                ? "bg-amber-400 text-amber-950 ring-2 ring-amber-400/50 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            <IconOcultarMostrar className="w-3.5 h-3.5" />
          </button>

          {/* 🔄 Botón Invertir Selección */}
          <button
            type="button"
            onClick={() => {
              onHoverHerrajes(null);
              onInvertirSeleccion();
            }}
            title={
              paso.ocultarNoAsignadas
                ? "Invertir activo: solo se muestran las piezas asignadas al paso. Clic para ver todo el mueble."
                : "Invertir: aislar la vista y ver únicamente las piezas asignadas a este paso"
            }
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer shadow-xs ${
              paso.ocultarNoAsignadas
                ? "bg-cyan-500 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
            }`}
          >
            <IconInvertir className="w-3.5 h-3.5" />
          </button>

          {/* ❌ Botón Eliminar Capa */}
          <button
            type="button"
            onClick={() => {
              onHoverHerrajes(null);
              onEliminarCapa(capa.id);
            }}
            title="Eliminar esta capa de armado"
            className="w-7 h-7 rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── FILAS 2 A 5: DETALLES DE LA CAPA (Ocultas si la capa está colapsada) ── */}
      {!estaColapsada && (
        <>
          {/* ── FILA 2: TABLEROS ASIGNADOS A LA CAPA ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-500" />
            Tableros de Madera ({capa.tableros.length}):
          </span>
          <div className="flex items-center gap-1.5">
            {capa.tableros.length === 0 && (
              <span className="text-[9px] text-slate-400 italic">
                Activa el bombillo y toca tableros en el visor 3D para añadirlos
              </span>
            )}
            {/* 🔲 Botón Expandir / Maximizar lista de tableros */}
            {capa.tableros.length > 2 && (
              <button
                type="button"
                onClick={handleToggleExpandirTableros}
                title={
                  esTablerosExpandido
                    ? "Compactar a la altura ajustada"
                    : "Expandir para ver todos los tableros sin límite de altura"
                }
                className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer shadow-2xs ${
                  esTablerosExpandido
                    ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-cyan-600/30 ring-1 ring-cyan-400/50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {esTablerosExpandido ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 📦 Contenedor dinámico de tableros con altura ajustable */}
        <div
          style={{
            height: esTablerosExpandido ? "auto" : `${alturaTablerosPx}px`,
            maxHeight: esTablerosExpandido ? "none" : `${alturaTablerosPx}px`,
          }}
          className={`flex flex-wrap gap-1 content-start overflow-y-auto pr-1 transition-[max-height] duration-150 custom-scrollbar ${
            arrastrandoAlturaTableros ? "select-none" : ""
          }`}
        >
          {capa.tableros.map((tab) => (
            <CapsulaTableroPlus
              key={tab.id}
              tablero={tab}
              capaId={capa.id}
              pasoId={paso.id}
              opcionesDestino={opcionesDestino}
              estaPosicionando={
                typeof piezaEnPosicionamiento === "string"
                  ? piezaEnPosicionamiento === tab.id
                  : (piezaEnPosicionamiento?.pasoId === paso.id && piezaEnPosicionamiento?.nombrePieza === tab.id)
              }
              onHover={onHoverHerrajes}
              onActualizar={(id, partial) => onActualizarTablero(capa.id, id, partial)}
              onRemover={(id) => onRemoverTablero(capa.id, id)}
              onTogglePosicionar={onTogglePosicionar}
            />
          ))}
        </div>

        {/* ↕️ Tirador inferior interactivo (Resize Handle) para estirar la sección de tableros arrastrando */}
        {capa.tableros.length > 2 && (
          <div
            onPointerDown={handleStartResizeTableros}
            onPointerMove={handlePointerMoveTableros}
            onPointerUp={handlePointerUpTableros}
            onDoubleClick={handleToggleExpandirTableros}
            title="Arrastra hacia abajo/arriba para cambiar la altura de los tableros. Doble clic para expandir/compactar todo."
            className={`w-full py-0.5 -mt-0.5 flex items-center justify-center cursor-ns-resize group select-none transition-colors rounded-full ${
              arrastrandoAlturaTableros ? "bg-amber-100/50 dark:bg-amber-950/40" : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 shadow-2xs transition-all">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span className="text-[7.5px] font-bold tracking-wider uppercase">
                {esTablerosExpandido
                  ? "Ver todo activo (Doble clic para compactar)"
                  : `${alturaTablerosPx}px (Arrastra para estirar | Doble clic expande)`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── FILA 3: HERRAJES ASIGNADOS A LA CAPA (Con buscador, scroll y cápsulas de alto brillo) ── */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
              🔩 Herrajes e Inserción ({capa.herrajes.length}):
            </span>

            {/* 🎯 Botón Cápsula "Posicionar en pieza" (Terminación circular obligatoria) */}
            {capa.tableros.length > 0 && (capa.herrajes.length > 0 || (capa.congelados && capa.congelados.length > 0)) && (
              <button
                type="button"
                onClick={handlePosicionarHerrajes}
                title="Posicionar y alinear todos los herrajes de la capa en los barrenos del tablero desplazado"
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold transition cursor-pointer shadow-xs active:scale-95 ${
                  posicionadoOk
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-400/40"
                    : "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 hover:text-cyan-800 dark:hover:bg-cyan-900/60"
                }`}
              >
                {posicionadoOk ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in" />
                    <span>¡Posicionados en pieza!</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Posicionar en pieza</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Buscador / Filtro ergonómico */}
            {capa.herrajes.length > 3 && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[9px] w-32 sm:w-36">
                <Search className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar herraje..."
                  value={busquedaHerrajes}
                  onChange={(e) => setBusquedaHerrajes(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 outline-none w-full text-[9px]"
                />
              </div>
            )}

            {/* 🔲 Botón Expandir / Maximizar lista completa de herrajes */}
            {capa.herrajes.length > 4 && (
              <button
                type="button"
                onClick={handleToggleExpandir}
                title={
                  esHerrajesExpandido
                    ? "Compactar a la altura ajustada"
                    : "Expandir para ver todos los herrajes sin límite de altura"
                }
                className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer shadow-2xs ${
                  esHerrajesExpandido
                    ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-cyan-600/30 ring-1 ring-cyan-400/50"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {esHerrajesExpandido ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* 📦 Contenedor dinámico de herrajes con altura ajustable y rigidez estructural (mínimo 320px por cápsula) */}
        <div
          style={{
            height: esHerrajesExpandido ? "auto" : `${alturaHerrajesPx}px`,
            maxHeight: esHerrajesExpandido ? "none" : `${alturaHerrajesPx}px`,
          }}
          className={`grid [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-1.5 content-start overflow-y-auto pr-1 transition-[max-height] duration-150 custom-scrollbar ${
            arrastrandoAltura ? "select-none" : ""
          }`}
        >
          {herrajesFiltrados.map((hw) => (
            <CapsulaHerrajePlus
              key={hw.id}
              herraje={hw}
              capaId={capa.id}
              pasoId={paso.id}
              esCongelado={false}
              onHover={onHoverHerrajes}
              onActualizar={(id, partial) => onActualizarHerraje(capa.id, id, partial)}
              onRemover={(id) => onRemoverHerraje(capa.id, id)}
              onToggleCongelar={(id) => onToggleCongelarHerraje(capa.id, id)}
            />
          ))}
          {capa.herrajes.length === 0 && (
            <span className="text-[9px] text-slate-400 italic">
              Activa el bombillo y toca herrajes en el visor 3D para añadirlos
            </span>
          )}
        </div>

        {/* ↕️ Tirador inferior interactivo (Resize Handle) para estirar la sección de herrajes arrastrando */}
        {capa.herrajes.length > 4 && (
          <div
            onPointerDown={handleStartResize}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleToggleExpandir}
            title="Arrastra hacia abajo/arriba para cambiar la altura de la sección. Doble clic para expandir/compactar todo."
            className={`w-full py-1 -mt-0.5 flex items-center justify-center cursor-ns-resize group select-none transition-colors rounded-full ${
              arrastrandoAltura ? "bg-cyan-100/50 dark:bg-cyan-950/40" : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 group-hover:border-cyan-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shadow-2xs transition-all">
              <GripHorizontal className="w-3.5 h-3.5" />
              <span className="text-[7.5px] font-bold tracking-wider uppercase">
                {esHerrajesExpandido
                  ? "Ver todo activo (Doble clic para compactar)"
                  : `${alturaHerrajesPx}px (Arrastra para estirar | Doble clic expande)`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── FILA 4: CONGELADOR DE HERRAJES (Pre-instalados en pasos anteriores) ── */}
      {capa.congelados.length > 0 && (
        <div className="flex flex-col gap-1 p-2 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-sky-500" />
              Herrajes Congelados ({capa.congelados.length}):
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] text-sky-600/70 dark:text-sky-400/70 italic hidden sm:inline">
                Viajan fijos sin aproximación
              </span>
              {/* ⚡ Fijar a todos a la vez */}
              <div
                title="Fijar el segundo de aparición de todos los herrajes congelados a la vez (presiona Enter)"
                className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-700 shadow-2xs text-[8.5px]"
              >
                <span className="font-bold text-sky-700 dark:text-sky-300">Todos a:</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0);
                      capa.congelados.forEach((h) => onActualizarHerraje(capa.id, h.id, { tiempoAparicion: val }));
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-7 text-center font-mono font-bold bg-transparent text-sky-800 dark:text-sky-200 outline-none p-0 border-none cursor-text"
                />
                <span className="font-bold text-sky-500">s</span>
              </div>
            </div>
          </div>

          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))] gap-1.5 content-start max-h-28 overflow-y-auto pr-1 custom-scrollbar">
            {capa.congelados.map((hw) => (
              <CapsulaHerrajePlus
                key={hw.id}
                herraje={hw}
                capaId={capa.id}
                pasoId={paso.id}
                esCongelado={true}
                onHover={onHoverHerrajes}
                onActualizar={(id, partial) => onActualizarHerraje(capa.id, id, partial)}
                onRemover={(id) => onRemoverHerraje(capa.id, id)}
                onToggleCongelar={(id) => onToggleCongelarHerraje(capa.id, id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── FILA 5: PIEZA MASTER DE LA CAPA & SUBENSAMBLE DESPLAZADO ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
        {/* Selector de Pieza Master y Controles de Subensamble */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 text-[10px]">
            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="font-bold text-amber-800 dark:text-amber-200">Pieza Master:</span>
            <select
              value={capa.piezaMaster || ""}
              onChange={(e) => onDefinirMaster(capa.id, e.target.value || undefined)}
              className="bg-transparent font-extrabold text-amber-900 dark:text-amber-100 outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="">(Ninguna / Solidaria)</option>
              {capa.tableros.map((t) => (
                <option key={t.id} value={t.id}>
                  👑 {t.id}
                </option>
              ))}
            </select>
          </div>

          {/* 🌟 Controles de Subensamble Desplazado en Banco & Acople */}
          {capa.piezaMaster && (
            <>
              {/* Cápsula de Desplazamiento en Banco */}
              <div
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-2xs"
                title="Desplazamiento del subensamble en el banco de trabajo (X transversal, Z longitudinal)"
              >
                <Move className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="font-bold text-slate-600 dark:text-slate-300">Banco:</span>

                {/* X */}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-mono text-slate-400">X:</span>
                  <input
                    type="number"
                    value={capa.offsetBancoCm?.x ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onActualizarOffsetMaster?.(capa.id, {
                        x: isNaN(val) ? 0 : val,
                        y: capa.offsetBancoCm?.y ?? 0,
                        z: capa.offsetBancoCm?.z ?? 0,
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    step={5}
                    className="w-11 px-1 py-0.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[9.5px] outline-none focus:border-cyan-500 shadow-2xs"
                  />
                </div>

                {/* Z */}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-mono text-slate-400">Z:</span>
                  <input
                    type="number"
                    value={capa.offsetBancoCm?.z ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onActualizarOffsetMaster?.(capa.id, {
                        x: capa.offsetBancoCm?.x ?? 0,
                        y: capa.offsetBancoCm?.y ?? 0,
                        z: isNaN(val) ? 0 : val,
                      });
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    step={5}
                    className="w-11 px-1 py-0.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[9.5px] outline-none focus:border-cyan-500 shadow-2xs"
                  />
                  <span className="text-[9px] text-slate-400 font-medium">cm</span>
                </div>
              </div>

              {/* Cápsula de Acople / Docking */}
              <div
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-2xs"
                title="Momento en que el subensamble finalizado viaja desde el banco a su posición final en el mueble"
              >
                <Link2 className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-600 dark:text-slate-300">Acople:</span>

                {/* Segundo de acople */}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] text-slate-400">seg:</span>
                  <input
                    type="number"
                    value={
                      capa.tiempoAcopleSegundos ??
                      Math.max(0.5, Number(((paso.duracionAudioSegundos || 6) - 2.0).toFixed(1)))
                    }
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const dur = capa.duracionAcopleSegundos ?? 2.0;
                      onActualizarTiempoAcopleMaster?.(capa.id, isNaN(val) ? 0 : val, dur);
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    step={0.5}
                    min={0}
                    max={paso.duracionAudioSegundos || 60}
                    className="w-11 px-1 py-0.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[9.5px] outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>

                {/* Duración del acople */}
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] text-slate-400">dur:</span>
                  <input
                    type="number"
                    value={capa.duracionAcopleSegundos ?? 2.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const tAcople =
                        capa.tiempoAcopleSegundos ??
                        Math.max(0.5, Number(((paso.duracionAudioSegundos || 6) - 2.0).toFixed(1)));
                      onActualizarTiempoAcopleMaster?.(capa.id, tAcople, isNaN(val) ? 2.0 : val);
                    }}
                    onFocus={(e) => e.currentTarget.select()}
                    step={0.5}
                    min={0.5}
                    max={10}
                    className="w-10 px-1 py-0.5 text-center font-mono font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-[9.5px] outline-none focus:border-amber-500 shadow-2xs"
                  />
                  <span className="text-[9px] text-slate-400 font-medium">s</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
