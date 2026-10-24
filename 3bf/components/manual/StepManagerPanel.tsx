"use client";

import React from "react";
import CabeceraPasoActivo from "./CabeceraPasoActivo";
import { use3BFStore } from "@/lib/store";
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
    <div className="flex flex-col gap-3 text-xs">
      {/* 🏷️ CABECERA OFICIAL DE IDENTIDAD DE PASO Y CONTROL DE ELIMINACIÓN SEGURA */}
      <CabeceraPasoActivo
        pasoActivo={pasoActivo}
        cantidadPasos={pasosManual?.length || 0}
        botonActivoColor={botonActivoColor}
        coloresApariencia={coloresApariencia}
        onActualizarTitulo={(nuevoTitulo) =>
          actualizarPasoManual(pasoActivo.id, { titulo: nuevoTitulo })
        }
        onEliminarPaso={() => eliminarPasoManual(pasoActivo.id)}
      />

      {/* 2. Tarjeta de Configuración del Paso Seleccionado */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-3">
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
