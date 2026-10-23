"use client";

import React from "react";
import ModoPasoSelector from "./ModoPasoSelector";
import { use3BFStore } from "@/lib/store";
import { Trash2 } from "lucide-react";
import ShowcaseConfigSection from "./ShowcaseConfigSection";
import InsercionCajonesConfigSection from "./InsercionCajonesConfigSection";
import FunctionalBlocksVisibilityCard from "./FunctionalBlocksVisibilityCard";
import BloqueEstandarConfigSection from "./BloqueEstandarConfigSection";
import BloqueEstandarEditorForm from "./BloqueEstandarEditorForm";
import MultiplePlusSection from "./multiplePlus/MultiplePlusSection";
export { obtenerColorSubbloque } from "./SubbloquesManagerSection";

export default function StepManagerPanel() {
  const [gruposCinematicosColapsados, setGruposCinematicosColapsados] = React.useState<Record<string, boolean>>({});

  const {
    pasosManual,
    pasoActivoManualId,
    eliminarPasoManual,
    actualizarPasoManual,
    coloresApariencia,
  } = use3BFStore();

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";
  const pasoActivo = (pasosManual || []).find((p) => p.id === pasoActivoManualId) || pasosManual?.[0];

  if (!pasoActivo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 🎛️ SELECTOR OFICIAL DE LOS 4 MODOS DEFINITIVOS DE ARMADO (Versioned Driver v1.0) */}
      <ModoPasoSelector
        pasoId={pasoActivo.id}
        tipoActual={pasoActivo.tipo}
        versionMotor={pasoActivo.versionMotor || "v1.0"}
      />

      {/* 2. Tarjeta de Configuración del Paso Seleccionado */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3">
        {/* Encabezado del Paso Activo (Para Showcase e Inserción de Cajones) */}
        {(pasoActivo.tipo === "showcase" || pasoActivo.tipo === "insercion_cajones") && (
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
                placeholder={`Paso ${pasoActivo.id}`}
              />
            </div>

            {pasosManual.length > 1 && (
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
        ) : pasoActivo.tipo === "insercion_cajones" || Boolean(pasoActivo.insercionCajones) ? (
          /* ── MODO INCORPORACIÓN / INSERCIÓN DE CAJONES (P06+) ─────── */
          <InsercionCajonesConfigSection
            pasoActivo={pasoActivo}
            botonActivoColor={botonActivoColor}
          />
        ) : pasoActivo.tipo === "bloque_estandar" ? (
          /* ── MODO BLOQUE ESTÁNDAR REUTILIZABLE ─────────────────────── */
          <BloqueEstandarConfigSection
            pasoActivo={pasoActivo}
            botonActivoColor={botonActivoColor}
          />
        ) : (
          /* ── MODO MÚLTIPLE PLUS (POR CAPAS INDEPENDIENTES) ───────── */
          <div className="flex flex-col gap-3">
            <MultiplePlusSection
              pasoActivo={pasoActivo}
              botonActivoColor={botonActivoColor}
            />

            {/* 🗄️ CONTROL DE VISIBILIDAD DE BLOQUES FUNCIONALES (P00) EN PASO MÚLTIPLE PLUS */}
            <FunctionalBlocksVisibilityCard />
          </div>
        )}
      </div>

      {/* 📦 FORMULARIO INFERIOR: EDITAR BLOQUE ESTÁNDAR (.3bb.json) */}
      <BloqueEstandarEditorForm botonActivoColor={botonActivoColor} />
    </div>
  );
}
