"use client";

import React from "react";
import {
  GripVertical,
  Crown,
  Crosshair,
  RotateCcw,
  Wrench,
  Timer,
  Snowflake,
  ArrowRight,
  Eye,
  EyeOff,
  Trash2,
  Layers,
  X,
} from "lucide-react";
import { IconOcultarMostrar } from "@/components/manual/StepManagerIcons";
import { PiezaEsperaConfig } from "@/lib/store";
import {
  HerrajeContactoItem,
  comprobarHerrajeCongelado,
  coincidenMismoHerraje,
  resolverDuenioHerrajeCanonica,
  obtenerDescripcionEspanolHerraje,
} from "@/lib/engine/cadStateUtils";
import { TiempoCinematicoInput } from "./TiempoCinematicoInput";
import { HerrajePillItem } from "./HerrajePillItem";

interface CapaPiezaEsperaItemProps {
  pieza: PiezaEsperaConfig;
  esMaster: boolean;
  estaPosicionando: boolean;
  estaSiendoArrastrada: boolean;
  estaSobreDrag: boolean;
  herrajesPieza: HerrajeContactoItem[];
  contactosPorHerraje: Record<string, string[]>;
  piezasConConfig: PiezaEsperaConfig[];
  modoTiempo: "global" | "por_capa";
  piezaMasterNombre?: string;
  opcionesDestino?: { id: string; label: string; esHeredado?: boolean }[];
  draggedHerraje: { nombrePieza: string; herrajeId: string } | null;
  dragOverNormalPieza: string | null;
  dragOverCongeladorPieza: string | null;
  comprobarActivoEnTiempo: (nombrePieza: string, herrajeId: string, instKey: string) => boolean;
  onDragStart: (e: React.DragEvent, nombrePieza: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, nombrePieza: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, nombrePieza: string) => void;
  onDefinirMaster: (nombrePieza: string) => void;
  onTogglePosicionar: (nombrePieza: string) => void;
  onToggleVisibilidad?: (nombrePieza: string) => void;
  estaEnPickingAgregarCapa?: boolean;
  onTogglePickingAgregar?: (nombrePieza: string) => void;
  tablerosAsignados?: string[];
  onRetirarTableroAsignado?: (nombreCapa: string, tableroNombre: string) => void;
  onCambiarPiezaDestino?: (nombrePieza: string, destinoId: string) => void;
  onEliminarCapa?: (nombrePieza: string) => void;
  onCambiarTiempoAparicion: (nombrePieza: string, segundos: number) => void;
  onCambiarTiempoFinHerrajes: (nombrePieza: string, segundos: number) => void;
  onCambiarOffset: (nombrePieza: string, eje: "offsetXCm" | "offsetYCm", valor: number) => void;
  onResetOffset: (nombrePieza: string) => void;
  onToggleHerraje: (nombrePieza: string, herrajeId: string) => void;
  onHoverHerrajes: (mallas: string[] | null) => void;
  onCambiarDireccionHerraje: (nombrePieza: string, herrajeId: string, dir: string) => void;
  onCambiarTiempoHerraje: (nombrePieza: string, herrajeId: string, segundos: number) => void;
  onCongelarHerraje: (nombrePieza: string, herrajeId: string) => void;
  onDescongelarHerraje: (nombrePieza: string, herrajeId: string) => void;
  onRetirarHerraje?: (herrajeKey: string) => void;
  onCambiarTiempoPieza: (nombrePieza: string, delta: number) => void;
  setDraggedHerraje: (val: { nombrePieza: string; herrajeId: string } | null) => void;
  setDragOverNormalPieza: (nombre: string | null) => void;
  setDragOverCongeladorPieza: (nombre: string | null) => void;
}

export function CapaPiezaEsperaItem({
  pieza: p,
  esMaster,
  estaPosicionando,
  estaSiendoArrastrada,
  estaSobreDrag,
  herrajesPieza,
  contactosPorHerraje,
  piezasConConfig,
  modoTiempo,
  piezaMasterNombre,
  opcionesDestino,
  draggedHerraje,
  dragOverNormalPieza,
  dragOverCongeladorPieza,
  comprobarActivoEnTiempo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDefinirMaster,
  onTogglePosicionar,
  onToggleVisibilidad,
  estaEnPickingAgregarCapa = false,
  onTogglePickingAgregar,
  tablerosAsignados = [],
  onRetirarTableroAsignado,
  onCambiarPiezaDestino,
  onEliminarCapa,
  onCambiarTiempoAparicion,
  onCambiarTiempoFinHerrajes,
  onCambiarOffset,
  onResetOffset,
  onToggleHerraje,
  onHoverHerrajes,
  onCambiarDireccionHerraje,
  onCambiarTiempoHerraje,
  onCongelarHerraje,
  onDescongelarHerraje,
  onRetirarHerraje,
  onCambiarTiempoPieza,
  setDraggedHerraje,
  setDragOverNormalPieza,
  setDragOverCongeladorPieza,
}: CapaPiezaEsperaItemProps) {
  const idsCongelados = p.herrajesCongelados || [];

  const estaEnCongelador = (hwItem: HerrajeContactoItem) => {
    const ik = hwItem.nombresMallas[0] || hwItem.id.split("::")[1];
    return (
      comprobarHerrajeCongelado(hwItem.id, idsCongelados) ||
      comprobarHerrajeCongelado(ik, idsCongelados) ||
      idsCongelados.some(
        (c) =>
          c === hwItem.id ||
          c === ik ||
          coincidenMismoHerraje(c, hwItem.id) ||
          coincidenMismoHerraje(c, ik)
      )
    );
  };

  const herrajesNormales = herrajesPieza.filter((hw) => !estaEnCongelador(hw));
  const herrajesEnCongelador = herrajesPieza.filter((hw) => estaEnCongelador(hw));

  const estaOculta = p.visible === false;

  return (
    <div
      onDragOver={(e) => onDragOver(e, p.nombrePieza)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, p.nombrePieza)}
      className={`p-2.5 rounded-2xl border flex flex-col gap-2 text-[10.5px] transition-all select-none ${
        estaOculta ? "opacity-60 saturate-50 " : ""
      }${
        estaSiendoArrastrada
          ? "opacity-40 scale-[0.98]"
          : estaSobreDrag
          ? "border-t-2 border-t-cyan-500 border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-50/50 dark:bg-cyan-950/30"
          : estaPosicionando
          ? "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500/50 shadow-sm ring-1 ring-cyan-400/40"
          : esMaster
          ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 shadow-sm ring-1 ring-amber-400/30"
          : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/50"
      }`}
    >
      {/* ── Fila 1: Identificación y Acciones Principales ── */}
      <div className="flex items-center justify-between gap-2">
        {/* Izquierda: Agarrador/Corona + Orden + Nombre de Pieza + Promover/Master + Bombillito */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {!esMaster ? (
            <div
              draggable={!estaPosicionando}
              onDragStart={(e) => onDragStart(e, p.nombrePieza)}
              onDragEnd={onDragEnd}
              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition shrink-0"
              title="Arrastrar con clic sostenido para reordenar"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDefinirMaster(p.nombrePieza);
              }}
              className="p-1 shrink-0 cursor-pointer hover:scale-115 active:scale-95 transition"
              title="Pieza Master fija (Base de ensamble). Clic para desmarcar"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </button>
          )}

          <span
            className={`w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center shrink-0 ${
              esMaster
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            {p.ordenEnsamble}
          </span>

          <span
            onMouseEnter={() => onHoverHerrajes([p.nombrePieza])}
            onMouseLeave={() => onHoverHerrajes(null)}
            className={`font-bold text-[11px] select-text truncate cursor-pointer hover:underline ${
              esMaster
                ? "text-amber-950 dark:text-amber-100"
                : "text-slate-800 dark:text-slate-100"
            }`}
            title={`${p.nombrePieza}: Pasar el cursor resalta la pieza en el visor 3D`}
          >
            {p.nombrePieza}
          </span>

          {/* Badges de Estado / Botón Master */}
          {esMaster ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDefinirMaster(p.nombrePieza);
              }}
              title="Pieza Master activa. Clic para desmarcar y dejar sin pieza master"
              className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900/90 text-amber-800 dark:text-amber-200 text-[8.5px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer transition shadow-2xs ml-1"
            >
              <Crown className="w-2.5 h-2.5 fill-amber-600 text-amber-600" /> MASTER
            </button>
          ) : estaPosicionando ? (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-100 text-[8.5px] font-bold animate-pulse shrink-0 ml-1">
              Moviendo
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDefinirMaster(p.nombrePieza);
              }}
              title="Designar esta pieza como la Pieza Master (Base #1)"
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition shrink-0 ml-1 cursor-pointer"
            >
              <Crown className="w-3 h-3" />
            </button>
          )}

          {/* 👁️ Botón de Visibilidad 3D de la Capa (Ojito) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibilidad?.(p.nombrePieza);
            }}
            title={
              p.visible !== false
                ? `👁️ ${p.nombrePieza} y sus herrajes visibles en visor 3D. Clic para ocultar`
                : `👁️ ${p.nombrePieza} y sus herrajes ocultos en visor 3D. Clic para mostrar`
            }
            className={`w-6 h-6 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ml-1 ${
              p.visible !== false
                ? "text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/60"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 opacity-60"
            }`}
          >
            {p.visible !== false ? (
              <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* 💡 Botón Circular Oficial: Ocultar / Mostrar y Empacar en esta Capa (El Bombillo) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePickingAgregar?.(p.nombrePieza);
            }}
            title={
              estaEnPickingAgregarCapa
                ? `Bombillo apagado (Gris): Cada pieza o herraje que toques en 3D se oculta y queda dentro de ${p.nombrePieza}. Clic para encender y finalizar.`
                : `Bombillo encendido (Amarillo): Todo el mueble se muestra en 3D. Clic para apagar y ocultar piezas tocándolas para agregarlas a esta capa.`
            }
            className={`w-6 h-6 flex items-center justify-center rounded-full transition shrink-0 cursor-pointer border shadow-2xs ml-0.5 ${
              !estaEnPickingAgregarCapa
                ? "bg-amber-400/20 text-amber-500 border-amber-400/50 hover:bg-amber-400/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-200"
            }`}
          >
            <IconOcultarMostrar
              className="w-3.5 h-3.5"
              encendido={!estaEnPickingAgregarCapa}
            />
          </button>
        </div>

        {/* Derecha: Posicionar + Reset al Origen (↺) + Eliminar Capa (🗑️) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePosicionar(p.nombrePieza);
            }}
            title={
              estaPosicionando
                ? "Mueve el mouse por el piso 3D y haz clic para fijar la posición"
                : `Posicionar ${p.nombrePieza} en el escenario con el puntero`
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer shrink-0 ${
              estaPosicionando
                ? "bg-cyan-600 text-white border-cyan-600 shadow-sm animate-pulse"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:text-cyan-600"
            }`}
          >
            <Crosshair className={`w-3 h-3 ${estaPosicionando ? "animate-spin" : ""}`} />
            <span>{estaPosicionando ? "Puntero..." : "Posicionar"}</span>
          </button>

          {/* ↺ Botón de Reset al Origen (restablece X: 0, Y: 0) */}
          <button
            type="button"
            onClick={() => onResetOffset(p.nombrePieza)}
            title={`Restablecer posición de espera de ${p.nombrePieza} al origen CAD (X: 0, Y: 0)`}
            className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 cursor-pointer ${
              p.offsetXCm !== 0 || (p.offsetYCm ?? p.offsetZCm ?? 0) !== 0
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 hover:scale-105 active:scale-95 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50"
            }`}
            disabled={p.offsetXCm === 0 && (p.offsetYCm ?? p.offsetZCm ?? 0) === 0}
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* 🗑️ Botón Eliminar Capa (Tacho de Basura) */}
          {onEliminarCapa && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEliminarCapa(p.nombrePieza);
              }}
              title={`Eliminar capa de ${p.nombrePieza} del paso de ensamble`}
              className="w-6 h-6 rounded-full flex items-center justify-center border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 hover:text-rose-700 hover:scale-105 active:scale-95 transition shadow-2xs shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Fila 2: Tiempos de Animación, Destino y Coordenadas ── */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
        {/* Izquierda: 👁️ Aparición + 🚀 Traslado + 🎯 Selector Destino */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* 👁️ Segundo en que la capa/pieza aparece a escala real */}
          <div
            onClick={(e) => e.stopPropagation()}
            title={`👁️ Aparición en escena: segundo en que ${p.nombrePieza} aparece visible (0s = desde el inicio del paso)`}
            className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-600/80 rounded-full px-1.5 py-0 shadow-2xs shrink-0 hover:border-cyan-500 transition cursor-text"
          >
            <Eye className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400 select-none shrink-0" />
            <TiempoCinematicoInput
              valorInicial={p.tiempoAparicionPieza || 0}
              onGuardar={(val) => onCambiarTiempoAparicion(p.nombrePieza, val)}
            />
            <span className="text-[7.5px] font-mono font-bold text-slate-400 select-none">s</span>
          </div>

          {/* 🚀 Segundo en que concluye el ensamble de herrajes e inicia el desplazamiento de la pieza */}
          <div
            onClick={(e) => e.stopPropagation()}
            title={`🚀 Inicio de desplazamiento: segundo en que concluye el ensamble de herrajes y ${p.nombrePieza} se traslada hacia el ensamble (0s = automático tras herrajes)`}
            className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-600/80 rounded-full px-1.5 py-0 shadow-2xs shrink-0 hover:border-amber-500 transition cursor-text"
          >
            <ArrowRight className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 select-none shrink-0 -mr-0.5" />
            <TiempoCinematicoInput
              valorInicial={p.tiempoFinHerrajes || 0}
              onGuardar={(val) => onCambiarTiempoFinHerrajes(p.nombrePieza, val)}
            />
            <span className="text-[7.5px] font-mono font-bold text-slate-400 select-none">s</span>
          </div>

          {/* 🎯 Selector de Pieza Destino (Hacia: Multi-Destino por Capa) */}
          {!esMaster && opcionesDestino && opcionesDestino.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 text-[10px] shadow-2xs hover:border-cyan-500/60 transition"
              title="Pieza de destino hacia la que se acoplará esta capa durante la animación"
            >
              <span className="font-bold text-slate-400 dark:text-slate-500 text-[9px]">Hacia:</span>
              <select
                value={p.piezaDestinoId || ""}
                onChange={(e) => onCambiarPiezaDestino?.(p.nombrePieza, e.target.value)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[130px] truncate text-[9.5px]"
              >
                <option value="">
                  {piezaMasterNombre ? `👑 Master (${piezaMasterNombre})` : "👑 Base Master"}
                </option>
                {opcionesDestino
                  .filter((op) => op.id !== p.nombrePieza)
                  .map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.esHeredado ? `🧩 ${op.label}` : op.label}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Derecha: Entradas numéricas X e Y (Offset en cm en el piso) */}
        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-rose-500 text-[9px]">X:</span>
            <input
              type="number"
              value={p.offsetXCm}
              onChange={(e) =>
                onCambiarOffset(
                  p.nombrePieza,
                  "offsetXCm",
                  parseInt(e.target.value, 10) || 0
                )
              }
              className="w-8 bg-transparent text-right outline-none font-bold"
            />
            <span className="opacity-50 text-[9px]">cm</span>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-emerald-500 text-[9px]">Y:</span>
            <input
              type="number"
              value={p.offsetYCm ?? p.offsetZCm ?? 0}
              onChange={(e) =>
                onCambiarOffset(
                  p.nombrePieza,
                  "offsetYCm",
                  parseInt(e.target.value, 10) || 0
                )
              }
              className="w-8 bg-transparent text-right outline-none font-bold"
            />
            <span className="opacity-50 text-[9px]">cm</span>
          </div>
        </div>
      </div>

      {/* 📦 Fila de Piezas / Tableros Adicionales Asignados a esta Capa */}
      {tablerosAsignados && tablerosAsignados.length > 0 && (
        <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-wrap items-center gap-1.5 text-[9.5px]">
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold shrink-0 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-500" />
            Piezas asignadas:
          </span>
          {tablerosAsignados.map((tablero) => (
            <div
              key={tablero}
              onMouseEnter={() => onHoverHerrajes([tablero])}
              onMouseLeave={() => onHoverHerrajes(null)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border transition select-none bg-amber-50/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs text-[9.5px] cursor-pointer hover:border-amber-400 hover:ring-1 hover:ring-amber-400/50"
              title={`Pieza/Tablero ${tablero} asignado solidario a la capa de ${p.nombrePieza}`}
            >
              <Layers className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              <span>{tablero}</span>

              {/* ❌ Botón para desasignar / corregir selección accidental */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetirarTableroAsignado?.(p.nombrePieza, tablero);
                }}
                title={`Retirar ${tablero} de esta capa (desasignar selección accidental)`}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-rose-200 dark:hover:bg-rose-900/60 text-amber-700 hover:text-rose-700 transition ml-0.5 cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fila 2 (Nivel de Capa): Herrajes en Contacto (Pre-ensamble Solidario) y Tiempo por Capa */}
      <div
        onDragOver={(e) => {
          if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
            e.preventDefault();
            setDragOverNormalPieza(p.nombrePieza);
          }
        }}
        onDragLeave={() => setDragOverNormalPieza(null)}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
            onDescongelarHerraje(p.nombrePieza, draggedHerraje.herrajeId);
          }
          setDraggedHerraje(null);
          setDragOverNormalPieza(null);
        }}
        className={`pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50 flex flex-wrap items-center justify-between gap-1.5 text-[9.5px] rounded-lg transition-colors ${
          dragOverNormalPieza === p.nombrePieza
            ? "bg-cyan-50/50 dark:bg-cyan-950/30 ring-1 ring-cyan-400/50"
            : ""
        }`}
      >
        {/* Herrajes en Contacto Físico (Activos de Ensamble) */}
        <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold shrink-0 flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5 text-slate-400" />
            Herrajes en contacto:
          </span>
          {herrajesNormales.length > 0 ? (
            herrajesNormales.map((hw) => {
              const instKey = hw.nombresMallas[0] || hw.id.split("::")[1];
              const contactos = contactosPorHerraje[instKey] || [p.nombrePieza];
              const duenioActual = resolverDuenioHerrajeCanonica(instKey, contactos, piezasConConfig);
              const estaPrendido = duenioActual === p.nombrePieza;
              const otraPieza = contactos.find((c) => c !== p.nombrePieza);

              const descEs = obtenerDescripcionEspanolHerraje(hw.label);
              const dirsMap = p.direccionesHerrajes || {};
              let direccion = "+Y";
              let tieneDir = false;
              for (const [k, v] of Object.entries(dirsMap)) {
                if (
                  k === hw.id ||
                  k === instKey ||
                  coincidenMismoHerraje(k, hw.id) ||
                  coincidenMismoHerraje(k, instKey)
                ) {
                  direccion = v;
                  tieneDir = true;
                  break;
                }
              }
              if (!tieneDir) {
                const nHwLow = (instKey || hw.id || "").toLowerCase();
                if (nHwLow.includes("cantoneira") || nHwLow.includes("cantonera") || nHwLow.includes("escuadra")) {
                  direccion = "-Y";
                }
              }

              const tiempos = p.tiemposAparicionHerrajes || {};
              let tiempoAparicion = 0;
              for (const [k, v] of Object.entries(tiempos)) {
                if (
                  k === hw.id ||
                  k === instKey ||
                  coincidenMismoHerraje(k, hw.id) ||
                  coincidenMismoHerraje(k, instKey)
                ) {
                  tiempoAparicion = v;
                  break;
                }
              }

              const activoEnTiempo = comprobarActivoEnTiempo(p.nombrePieza, hw.id, instKey);

              return (
                <div key={hw.id} className="inline-flex items-center gap-0.5">
                  <HerrajePillItem
                    herraje={hw}
                    nombrePieza={p.nombrePieza}
                    estaPrendido={estaPrendido}
                    instKey={instKey}
                    descEs={descEs}
                    otraPieza={otraPieza}
                    direccion={direccion}
                    tiempoAparicion={tiempoAparicion}
                    activoEnTiempo={activoEnTiempo}
                    onToggle={() => onToggleHerraje(p.nombrePieza, hw.id)}
                    onHover={onHoverHerrajes}
                    onCambiarDireccion={(dir) => onCambiarDireccionHerraje(p.nombrePieza, hw.id, dir)}
                    onCambiarTiempo={(val) => onCambiarTiempoHerraje(p.nombrePieza, hw.id, val)}
                    onRetirar={() => onRetirarHerraje?.(instKey)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", hw.id);
                      setDraggedHerraje({ nombrePieza: p.nombrePieza, herrajeId: hw.id });
                    }}
                    onDragEnd={() => setDraggedHerraje(null)}
                  />
                  {/* Botón rápido de 1 clic para congelar */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onCongelarHerraje(p.nombrePieza, hw.id);
                    }}
                    title="Congelar: herraje ya pre-instalado en un paso anterior (viaja fijo siempre sin animación de aproximación)"
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-500 opacity-60 hover:opacity-100 transition ml-0.5 cursor-pointer"
                  >
                    <Snowflake className="w-2.5 h-2.5" />
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-[9px] text-slate-400 italic">
              {herrajesEnCongelador.length > 0 ? "Todos en el congelador" : "Sin herrajes directos"}
            </span>
          )}
        </div>

        {/* Control de Tiempo Individual por Capa */}
        {modoTiempo === "por_capa" && !esMaster && (
          <div className="flex items-center gap-1 shrink-0 ml-auto bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Timer className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-[9px] text-slate-400 font-medium">Tiempo:</span>
            <button
              type="button"
              onClick={() => onCambiarTiempoPieza(p.nombrePieza, -0.5)}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              -
            </button>
            <span className="font-mono font-bold text-[10px] min-w-[24px] text-center text-cyan-700 dark:text-cyan-300">
              {(p.tiempoAnimacionSegundos || 2.5).toFixed(1)}s
            </span>
            <button
              type="button"
              onClick={() => onCambiarTiempoPieza(p.nombrePieza, 0.5)}
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* ❄️ Fila 3: El Congelador (Herrajes Pre-instalados en pasos anteriores) */}
      {herrajesEnCongelador.length === 0 ? (
        <div
          onDragOver={(e) => {
            if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
              e.preventDefault();
              setDragOverCongeladorPieza(p.nombrePieza);
            }
          }}
          onDragLeave={() => setDragOverCongeladorPieza(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
              onCongelarHerraje(p.nombrePieza, draggedHerraje.herrajeId);
            }
            setDraggedHerraje(null);
            setDragOverCongeladorPieza(null);
          }}
          className={`mt-1 py-1 px-2.5 rounded-xl border border-dashed text-[9px] flex items-center justify-between transition-all select-none ${
            dragOverCongeladorPieza === p.nombrePieza
              ? "border-sky-500 bg-sky-100/70 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/40"
              : "border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Snowflake className="w-2.5 h-2.5 text-sky-500/80 shrink-0" />
            <span className="text-[8.5px] font-medium">
              Congelador (arrastra aquí herrajes pre-instalados en pasos anteriores)
            </span>
          </div>
          <span className="text-[8px] opacity-50 italic">Vacío</span>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
              e.preventDefault();
              setDragOverCongeladorPieza(p.nombrePieza);
            }
          }}
          onDragLeave={() => setDragOverCongeladorPieza(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedHerraje && draggedHerraje.nombrePieza === p.nombrePieza) {
              onCongelarHerraje(p.nombrePieza, draggedHerraje.herrajeId);
            }
            setDraggedHerraje(null);
            setDragOverCongeladorPieza(null);
          }}
          className={`mt-1.5 p-2 rounded-xl border flex flex-col gap-1.5 text-[9px] transition-all select-none ${
            dragOverCongeladorPieza === p.nombrePieza
              ? "border-sky-500 bg-sky-100/80 dark:bg-sky-950/80 ring-2 ring-sky-400/50 shadow-sm"
              : "border-sky-200/90 dark:border-sky-800/70 bg-sky-50/60 dark:bg-sky-950/40 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-200 font-bold text-[9.5px]">
              <Snowflake className="w-3 h-3 text-sky-500 shrink-0" />
              <span>Congelador: Herrajes Pre-instalados</span>
              <span className="px-1.5 py-0.2 rounded-full bg-sky-200/90 dark:bg-sky-900 text-sky-800 dark:text-sky-200 text-[8.5px] font-extrabold shadow-2xs">
                {herrajesEnCongelador.length}
              </span>
            </div>
            <span className="text-[8.5px] text-sky-700/70 dark:text-sky-400/70 font-medium italic">
              Viajan fijos con {p.nombrePieza} (sin animación independiente)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-sky-200/60 dark:border-sky-800/50">
            {herrajesEnCongelador.map((hw) => {
              const instKey = hw.nombresMallas[0] || hw.id.split("::")[1];
              const descEs = obtenerDescripcionEspanolHerraje(hw.label);
              const tiempos = p.tiemposAparicionHerrajes || {};
              let tiempoAparicion = 0;
              for (const [k, v] of Object.entries(tiempos)) {
                if (
                  k === hw.id ||
                  k === instKey ||
                  coincidenMismoHerraje(k, hw.id) ||
                  coincidenMismoHerraje(k, instKey)
                ) {
                  tiempoAparicion = v;
                  break;
                }
              }
              const activoEnTiempo = comprobarActivoEnTiempo(p.nombrePieza, hw.id, instKey);

              return (
                <HerrajePillItem
                  key={hw.id}
                  herraje={hw}
                  nombrePieza={p.nombrePieza}
                  estaPrendido={true}
                  esCongelado={true}
                  instKey={instKey}
                  descEs={descEs}
                  direccion="+Y"
                  tiempoAparicion={tiempoAparicion}
                  activoEnTiempo={activoEnTiempo}
                  onHover={onHoverHerrajes}
                  onCambiarDireccion={() => {}}
                  onCambiarTiempo={(val) => onCambiarTiempoHerraje(p.nombrePieza, hw.id, val)}
                  onDescongelar={() => onDescongelarHerraje(p.nombrePieza, hw.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
