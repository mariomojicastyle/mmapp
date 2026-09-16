"use client";

import React, { useMemo } from "react";
import { use3BFStore, sanitizarPasosManuales } from "@/lib/store";
import { Plus, Trash2, Boxes, GripVertical } from "lucide-react";
import { esHerrajeNombre } from "@/lib/piezaMadreUtils";
import ShowcaseConfigSection from "./ShowcaseConfigSection";
import SubbloquesManagerSection, { obtenerColorSubbloque, COLORES_SUBBLOQUES } from "./SubbloquesManagerSection";
export { obtenerColorSubbloque, COLORES_SUBBLOQUES };
import AssemblyBlockControls from "./AssemblyBlockControls";
import AssemblyPiecesSection from "./AssemblyPiecesSection";
import FunctionalBlocksVisibilityCard from "./FunctionalBlocksVisibilityCard";
import BloqueEstandarConfigSection from "./BloqueEstandarConfigSection";
import BloqueEstandarEditorForm from "./BloqueEstandarEditorForm";

export default function StepManagerPanel() {
  const [mostrarMenuAnadirBloque, setMostrarMenuAnadirBloque] = React.useState(false);
  const [seccionPiezasColapsada, setSeccionPiezasColapsada] = React.useState(false);
  const [subbloquesColapsados, setSubbloquesColapsados] = React.useState<Record<string, boolean>>({});
  const [gruposCinematicosColapsados, setGruposCinematicosColapsados] = React.useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [guardandoBloque, setGuardandoBloque] = React.useState(false);
  const [mensajeBloque, setMensajeBloque] = React.useState<string | null>(null);

  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
    crearPasoManual,
    eliminarPasoManual,
    actualizarPasoManual,
    reordenarPasosManual,
    coloresApariencia,
  } = use3BFStore();

  // 🛡️ Blindaje y Autocuración: Garantizar que P00 siempre esté presente y sincronizar versión de Drive si está vacío
  React.useEffect(() => {
    if (!pasosManual || pasosManual.length === 0 || !pasosManual.some((p) => p.id === "P00" || p.tipo === "showcase")) {
      const curados = sanitizarPasosManuales(pasosManual || []);
      use3BFStore.getState().setPasosManual(curados);
      return;
    }

    // Si P00 no tiene grupos cinemáticos asignados, consultar Drive para recuperar versión guardada con animaciones
    const p00 = pasosManual.find((p) => p.id === "P00");
    if (!p00?.showcase?.gruposCinematicos || p00.showcase.gruposCinematicos.length === 0) {
      use3BFStore.getState().cargarManualesDesdeDrive();
    }
  }, [pasosManual]);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";


  // 🪵 Tableros asignados exclusivamente a este paso (excluyendo cualquier herraje)
  const tablerosPasoActivo = useMemo(() => {
    if (!pasoActivo || pasoActivo.tipo === "showcase") return [];
    return (pasoActivo.piezasAsignadas || []).filter((p) => !esHerrajeNombre(p));
  }, [pasoActivo]);

  // Sincronización automática de Pieza Master si la actual no pertenece a las asignadas del paso
  React.useEffect(() => {
    if (pasoActivo && pasoActivo.tipo !== "showcase" && tablerosPasoActivo.length > 0) {
      if (!pasoActivo.piezaMaster || !tablerosPasoActivo.includes(pasoActivo.piezaMaster)) {
        actualizarPasoManual(pasoActivo.id, { piezaMaster: tablerosPasoActivo[0] });
      }
    }
  }, [pasoActivo?.id, pasoActivo?.tipo, tablerosPasoActivo, pasoActivo?.piezaMaster, actualizarPasoManual]);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Selector de Pasos (Cápsulas Horizontales) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
            Línea de Pasos del Manual
          </span>
          <button
            type="button"
            onClick={() => crearPasoManual("ensamble")}
            style={{ borderColor: botonActivoColor, color: botonActivoColor }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border hover:bg-cyan-500/10 transition font-bold text-[10px]"
          >
            <Plus className="w-3 h-3" /> + Nuevo Paso
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {pasosManual.map((paso, index) => {
            const esActivo = paso.id === pasoActivoManualId;
            const esP00 = paso.id === "P00" || paso.tipo === "showcase";
            const esDragOver = dragOverIndex === index;

            return (
              <button
                key={`${paso.id}_${index}`}
                type="button"
                draggable={!esP00}
                onDragStart={(e) => {
                  if (esP00) return;
                  setDraggedIndex(index);
                  e.dataTransfer.setData("text/plain", index.toString());
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (esP00) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverIndex !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIndex === index) {
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(e) => {
                  if (esP00) return;
                  e.preventDefault();
                  setDragOverIndex(null);
                  setDraggedIndex(null);
                  const origenIdxStr = e.dataTransfer.getData("text/plain");
                  const origenIdx = parseInt(origenIdxStr, 10);
                  if (!isNaN(origenIdx) && origenIdx !== index && origenIdx > 0 && index > 0) {
                    reordenarPasosManual(origenIdx, index);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onClick={() => seleccionarPasoManualActivo(paso.id)}
                style={
                  esActivo
                    ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                    : {}
                }
                title={esP00 ? "Paso 00 Showcase (Fijo)" : `Arrastra para reordenar paso ${paso.id}`}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 select-none ${
                  esP00
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing hover:border-cyan-400"
                } ${
                  esDragOver ? "ring-2 ring-cyan-500 scale-105" : ""
                } ${
                  esActivo
                    ? "shadow-sm"
                    : "border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {!esP00 && <GripVertical className="w-2.5 h-2.5 opacity-40 hover:opacity-100 shrink-0" />}
                <span>{paso.id}</span>
                {paso.tipo === "showcase" ? null : paso.tipo === "bloque_estandar" ? (
                  <Boxes className="w-3 h-3 text-cyan-400 shrink-0" />
                ) : (
                  <span className="opacity-70 font-normal text-[10px]">
                    ({(paso.piezasAsignadas || []).length + (paso.herrajesAsignados || []).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Tarjeta de Configuración del Paso Seleccionado */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3">
        {/* Encabezado del Paso Activo (Solo para Showcase) */}
        {pasoActivo.tipo === "showcase" && (
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                style={{ backgroundColor: botonActivoColor }}
                className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {pasoActivo.id}
              </span>
              <input
                type="text"
                value={pasoActivo.titulo}
                onChange={(e) => actualizarPasoManual(pasoActivo.id, { titulo: e.target.value })}
                className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 outline-none truncate"
              />
            </div>

            {pasosManual.length > 1 && pasoActivo.id !== "P00" && (
              <button
                type="button"
                onClick={() => eliminarPasoManual(pasoActivo.id)}
                title="Eliminar este paso"
                className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ── MODO SHOWCASE (PASO 00): CINEMÁTICA DE COMPONENTES ─────────────────── */}
        {pasoActivo.tipo === "showcase" ? (
          <ShowcaseConfigSection
            pasoActivo={pasoActivo}
            gruposCinematicosColapsados={gruposCinematicosColapsados}
            setGruposCinematicosColapsados={setGruposCinematicosColapsados}
            botonActivoColor={botonActivoColor}
          />
        ) : pasoActivo.tipo === "bloque_estandar" ? (
          /* ── MODO BLOQUE ESTÁNDAR REUTILIZABLE ─────────────────────── */
          <BloqueEstandarConfigSection
            pasoActivo={pasoActivo}
            botonActivoColor={botonActivoColor}
          />
        ) : (
          /* ── MODO ENSAMBLE (PASO 01+) ─────────────────────────────────── */
          <div className="flex flex-col gap-3">
            {/* 🎯 TARJETA DE PIEZAS CONFIGURADAS DEL PASO (Inspirado en la lógica de Bloques Funcionales de P00) */}
            <div className="flex flex-col gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
                            <AssemblyPiecesSection
                pasoActivo={pasoActivo}
                botonActivoColor={botonActivoColor}
                tablerosPasoActivo={tablerosPasoActivo}
              />

              {/* 🪚 CONTROLES DE MANIPULACIÓN DEL BLOQUE DE ARMADO (PIEZA MASTER, ORIENTACIÓN Y D-PAD) */}
              <AssemblyBlockControls
                pasoActivo={pasoActivo}
                tablerosPasoActivo={tablerosPasoActivo}
              />

              {/* 🧩 SECCIÓN DE SUBBLOQUES DE ARMADO */}
              <SubbloquesManagerSection
                pasoActivo={pasoActivo}
                botonActivoColor={botonActivoColor}
              />
            </div>

            {/* 🗄️ CONTROL DE VISIBILIDAD DE BLOQUES FUNCIONALES (P00) EN PASO DE ENSAMBLE */}
            <FunctionalBlocksVisibilityCard />

          </div>
        )}
      </div>

      {/* 📦 FORMULARIO INFERIOR: EDITAR BLOQUE ESTÁNDAR (.3bb.json) */}
      <BloqueEstandarEditorForm botonActivoColor={botonActivoColor} />
    </div>
  );
}
