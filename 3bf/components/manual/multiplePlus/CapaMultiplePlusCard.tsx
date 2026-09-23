"use client";

import React, { useState, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  LocateFixed,
  Check,
} from "lucide-react";
import { CapaMultiplePlus, PasoManualStudio, TableroCapaPlus, HerrajeCapaPlus } from "@/lib/storeTypes";
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
  onToggleColapsar,
  onTogglePosicionar,
  onIniciarPickingCapa,
  onLimpiarPicking,
  onToggleBloqueHeredado,
  onToggleVisibilidadBloqueHeredado,
  onInvertirSeleccion,
  onPosicionarHerrajesEnPieza,
}: CapaMultiplePlusCardProps) {
  const [busquedaHerrajes, setBusquedaHerrajes] = useState("");
  const [nombreSeleccionado, setNombreSeleccionado] = useState(false);
  const [posicionadoOk, setPosicionadoOk] = useState(false);

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

  // Opciones de destino: bloques heredados + tableros de otras capas
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
  }, [capa.bloquesHeredadosIds, paso.multiplePlus?.capas, pasosManual, capa.id]);

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
            onClick={onInvertirSeleccion}
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
            onClick={() => onEliminarCapa(capa.id)}
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-500" />
            Tableros de Madera ({capa.tableros.length}):
          </span>
          {capa.tableros.length === 0 && (
            <span className="text-[9px] text-slate-400 italic">
              Activa el bombillo y toca tableros en el visor 3D para añadirlos
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
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

          {/* Buscador / Filtro ergonómico */}
          {capa.herrajes.length > 3 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[9px] w-36">
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
        </div>

        <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto pr-1">
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
      </div>

      {/* ── FILA 4: CONGELADOR DE HERRAJES (Pre-instalados en pasos anteriores) ── */}
      {capa.congelados.length > 0 && (
        <div className="flex flex-col gap-1 p-2 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
              <Snowflake className="w-3 h-3 text-sky-500" />
              Herrajes Congelados ({capa.congelados.length}):
            </span>
            <span className="text-[8.5px] text-sky-600/70 dark:text-sky-400/70 italic">
              Viajan fijos sin animación de aproximación
            </span>
          </div>

          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
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

      {/* ── FILA 5: PIEZA MASTER DE LA CAPA ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
        {/* Selector de Pieza Master */}
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
      </div>
        </>
      )}
    </div>
  );
}
