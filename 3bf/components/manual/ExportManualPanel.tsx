"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Download, Package, Loader2, CheckCircle2, FileCode, Film, Globe } from "lucide-react";
import { exportarGlbPasoManual, descargarBufferComoArchivo, exportarPaqueteCompletoManualZip } from "@/lib/exportManualGlb";
import * as THREE from "three";

export default function ExportManualPanel() {
  const { pasosManual, pasoActivoManualId, parametros, muebleActivoGuardado, coloresApariencia } = use3BFStore();
  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];

  const [exportandoPaso, setExportandoPaso] = useState(false);
  const [exportandoZip, setExportandoZip] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";
  const nombreMueble = muebleActivoGuardado?.nombre || parametros?.model_id || "Mueble_3dBimFab";

  const exportarPasoActual = async () => {
    try {
      setExportandoPaso(true);
      setMensajeExito(null);

      // 1. Pausar y llevar el timeline estrictamente a t = 0 para garantizar mallas 100% cerradas
      const prevTime = use3BFStore.getState().timelineCurrentTime;
      const prevPlaying = use3BFStore.getState().isTimelinePlaying;
      use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

      // Esperar brevemente para que Three.js y React apliquen la posición de reposo absoluto
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Obtener la escena 3D global montada en el visor
      const scene = (window as any).__threeScene3BF || new THREE.Scene();
      const { buffer, filename, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);

      descargarBufferComoArchivo(buffer, filename);
      setMensajeExito(`¡${filename} (${sizeMb} MB) exportado con éxito con animación glTF 2.0 universal!`);
      setTimeout(() => setMensajeExito(null), 4000);

      // Restaurar el tiempo previo del scrubber
      use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
    } catch (err: any) {
      console.error("[ExportManualPanel] Error:", err);
      alert(`Error al exportar paso: ${err.message}`);
    } finally {
      setExportandoPaso(false);
    }
  };

  const exportarPaqueteCompleto = async () => {
    try {
      setExportandoZip(true);
      setMensajeExito(null);

      const prevTime = use3BFStore.getState().timelineCurrentTime;
      const prevPlaying = use3BFStore.getState().isTimelinePlaying;
      use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

      await new Promise((resolve) => setTimeout(resolve, 80));

      const scene = (window as any).__threeScene3BF || new THREE.Scene();
      await exportarPaqueteCompletoManualZip(scene, pasosManual, nombreMueble);

      setMensajeExito("¡Paquete completo de manual (ZIP) generado y descargado con éxito!");
      setTimeout(() => setMensajeExito(null), 4000);

      use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
    } catch (err: any) {
      console.error("[ExportManualPanel] Error:", err);
      alert(`Error al exportar paquete: ${err.message}`);
    } finally {
      setExportandoZip(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Resumen del Manual */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2.5">
        <span className="font-bold tracking-wide uppercase opacity-70 text-[10px] flex items-center gap-1">
          <Film className="w-3 h-3 text-cyan-600" /> Resumen del Proyecto de Manual
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
            <span className="opacity-60 text-[10px]">Pasos Configurados:</span>
            <span className="font-bold font-mono text-sm">{pasosManual.length} pasos</span>
          </div>

          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
            <span className="opacity-60 text-[10px]">Paso Seleccionado:</span>
            <span className="font-bold font-mono text-sm" style={{ color: botonActivoColor }}>
              {pasoActivo.id} ({pasoActivo.duracionTotal}s)
            </span>
          </div>
        </div>

        {/* Estado de Idiomas */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px]">
          <span className="font-semibold flex items-center gap-1">
            <Globe className="w-3 h-3 text-cyan-600" /> Idiomas Disponibles:
          </span>
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <span className={pasoActivo.audioUrlEs ? "text-emerald-500" : "opacity-40"}>ES</span>
            <span>•</span>
            <span className={pasoActivo.audioUrlPt ? "text-emerald-500" : "opacity-40"}>PT</span>
            <span>•</span>
            <span className={pasoActivo.audioUrlEn ? "text-emerald-500" : "opacity-40"}>EN</span>
          </div>
        </div>
      </div>

      {/* Botones de Descarga en Cápsula Pura */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={exportandoPaso || exportandoZip}
          onClick={exportarPasoActual}
          style={{ backgroundColor: botonActivoColor }}
          className="w-full py-2.5 rounded-full text-white font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 transition"
        >
          {exportandoPaso ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Exportando {pasoActivo.id}.glb...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Descargar GLB Animado ({pasoActivo.id}.glb)
            </>
          )}
        </button>

        <button
          type="button"
          disabled={exportandoPaso || exportandoZip}
          onClick={exportarPaqueteCompleto}
          className="w-full py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 font-bold flex items-center justify-center gap-2 transition"
        >
          {exportandoZip ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Empaquetando ZIP...
            </>
          ) : (
            <>
              <Package className="w-4 h-4 text-cyan-600" /> Descargar Paquete Completo (ZIP)
            </>
          )}
        </button>
      </div>

      {/* Notificación de Éxito */}
      {mensajeExito && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-[11px] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Explicación de Compatibilidad */}
      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5 text-[10px] leading-relaxed opacity-75">
        <strong>💡 100% Compatible Universal:</strong> Los archivos exportados son modelos estándar glTF 2.0 optimizados con mallas indexadas, pistas de animación cinemática embebidas y texturas compartidas, compatibles nativamente con Visor 3D de Windows, Babylon.js Sandbox, Blender, PowerPoint y la plataforma de manuales interactivos de Mario Mojica sin necesidad de decodificadores externos.
      </div>
    </div>
  );
}
