"use client";

import React, { useState, useMemo } from "react";
import type { ResultadoOptimizacionGlobal } from "@/lib/optimizador/tiposOptimizador";
import { use3BFStore } from "@/lib/store";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { generarFichaTecnicaTallerPdf } from "@/lib/optimizador/exportadorPdfTaller";
import { generarYDescargarGcode, generarYDescargarTodosGcodeZip } from "@/lib/optimizador/exportadorCncGcode";
import { generarYDescargarXilog, generarYDescargarTodosXilogZip } from "@/lib/optimizador/exportadorCncXilog";
import { 
  Percent, 
  Layers, 
  Scissors, 
  Trees, 
  Clock, 
  FileText, 
  Download, 
  Cpu, 
  Printer 
} from "lucide-react";

interface Props {
  resultado: ResultadoOptimizacionGlobal | null;
}

export default function ResumenMetricasCard({ resultado }: Props) {
  const { coloresApariencia, esquemaColor, objetoActivoId, instancias } = use3BFStore();
  const { 
    configuracion, 
    origenDatos, 
    nombreArchivoExterno,
    laminaActivaIndex 
  } = useOptimizadorStore();

  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoGcode, setExportandoGcode] = useState(false);
  const [exportandoXilog, setExportandoXilog] = useState(false);

  const esOscuro = esquemaColor === "oscuro";
  const colorFondo = coloresApariencia?.fondoPaneles || (esOscuro ? "#0B0F17" : "#FFFFFF");
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");

  const nombreProyecto = useMemo(() => {
    if (origenDatos === "archivo_externo" && nombreArchivoExterno) {
      return nombreArchivoExterno.replace(/\.[^/.]+$/, "");
    }
    const instActiva = objetoActivoId ? instancias[objetoActivoId] : null;
    return instActiva?.nombreVisible || "3dBimFab_Proyecto";
  }, [origenDatos, nombreArchivoExterno, objetoActivoId, instancias]);

  if (!resultado || resultado.laminas.length === 0) {
    return (
      <div 
        style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
        className="p-3 border-t text-center text-xs text-slate-400"
      >
        Presiona <strong>"Calcular Corte"</strong> para generar el esquema de aprovechamiento de materia prima.
      </div>
    );
  }

  const metrosLinealesTotales = Number(
    resultado.laminas.reduce((acc, l) => acc + l.metrosLinealesCorte, 0).toFixed(1)
  );

  const ptNetosTotales = Number(
    resultado.laminas.reduce((acc, l) => acc + (l.piesTablaresNetos || 0), 0).toFixed(2)
  );
  const ptBrutosTotales = Number(
    resultado.laminas.reduce((acc, l) => acc + (l.piesTablaresBrutos || 0), 0).toFixed(2)
  );

  // Manejador Ficha Técnica PDF
  const handleExportarPdf = async () => {
    setExportandoPdf(true);
    try {
      await generarFichaTecnicaTallerPdf({
        nombreProyecto,
        resultado,
        config: configuracion,
      });
    } catch (err) {
      console.error("Error al exportar PDF:", err);
    } finally {
      setExportandoPdf(false);
    }
  };

  // Manejador G-Code .nc
  const handleExportarGcode = async () => {
    setExportandoGcode(true);
    try {
      if (resultado.laminas.length === 1) {
        generarYDescargarGcode({
          nombreProyecto,
          lamina: resultado.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else {
        await generarYDescargarTodosGcodeZip({
          nombreProyecto,
          laminas: resultado.laminas,
          diametroFresaMm: configuracion.diametroFresa,
        });
      }
    } catch (err) {
      console.error("Error al exportar G-Code:", err);
    } finally {
      setExportandoGcode(false);
    }
  };

  // Manejador SCM Morbidelli Xilog .xcs
  const handleExportarXilog = async () => {
    setExportandoXilog(true);
    try {
      if (resultado.laminas.length === 1) {
        generarYDescargarXilog({
          nombreProyecto,
          lamina: resultado.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else {
        await generarYDescargarTodosXilogZip({
          nombreProyecto,
          laminas: resultado.laminas,
          diametroFresaMm: configuracion.diametroFresa,
        });
      }
    } catch (err) {
      console.error("Error al exportar Morbidelli Xilog:", err);
    } finally {
      setExportandoXilog(false);
    }
  };

  return (
    <div 
      style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
      className="p-2.5 lg:p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
    >
      {/* 1. Métricas de Rendimiento */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Aprovechamiento */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-emerald-700 dark:text-emerald-300">
          <Percent className="w-3.5 h-3.5" />
          <span className="font-bold text-sm">{resultado.aprovechamientoPromedio}%</span>
          <span className="text-[10px] uppercase font-semibold">Aprovechamiento</span>
        </div>

        {/* Desperdicio */}
        <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full text-rose-700 dark:text-rose-300">
          <span className="font-bold text-xs">{(100 - resultado.aprovechamientoPromedio).toFixed(1)}%</span>
          <span className="text-[10px] font-semibold opacity-80">Merma</span>
        </div>

        {/* Total Láminas */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-200">
          <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="font-bold text-xs">{resultado.totalLaminas}</span>
          <span className="text-[10px] font-semibold opacity-80">
            {resultado.modo === "madera_maciza" ? "Tablones" : "Láminas"}
          </span>
        </div>

        {/* Metros Lineales de Corte */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-200">
          <Scissors className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold text-xs">{metrosLinealesTotales} m</span>
          <span className="text-[10px] font-semibold opacity-80">Corte</span>
        </div>

        {/* Si es Madera Maciza: Pies Tablares */}
        {resultado.modo === "madera_maciza" && ptBrutosTotales > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full text-amber-800 dark:text-amber-200">
            <Trees className="w-3.5 h-3.5" />
            <span className="font-bold text-xs">{ptNetosTotales} PT</span>
            <span className="text-[10px] font-semibold opacity-80">Neto / {ptBrutosTotales} PT Bruto</span>
          </div>
        )}
      </div>

      {/* 2. Acciones de Exportación para Taller (Cápsulas rounded-full) */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {/* Botón Ficha Técnica PDF */}
        <button
          type="button"
          onClick={handleExportarPdf}
          disabled={exportandoPdf}
          style={{ borderColor: colorBorde }}
          className="px-3 py-1 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
          title="Generar e imprimir Ficha Técnica de Taller en PDF con diagramas vectoriales a escala y QR"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>{exportandoPdf ? "Generando..." : "Ficha Técnica PDF"}</span>
        </button>

        {/* Botones CNC si el modo es Nesting CNC (o exportación universal de corte) */}
        {resultado.modo === "nesting_cnc" && (
          <>
            <button
              type="button"
              onClick={handleExportarGcode}
              disabled={exportandoGcode}
              style={{ backgroundColor: colorBotonActivo }}
              className="px-3 py-1 rounded-full text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition"
              title={`Descargar archivo G-Code .nc ${resultado.laminas.length > 1 ? "(Paquete ZIP de láminas)" : "(Lámina individual)"} con avances F6000, 18000 RPM y Onion Skin`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportandoGcode ? "Exportando..." : `G-Code CNC (.nc${resultado.laminas.length > 1 ? " zip" : ""})`}</span>
            </button>

            <button
              type="button"
              onClick={handleExportarXilog}
              disabled={exportandoXilog}
              style={{ borderColor: colorBorde }}
              className="px-3 py-1 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
              title={`Exportar programa para SCM Morbidelli X200 / Maestro Lab (.xcs${resultado.laminas.length > 1 ? " zip" : ""})`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{exportandoXilog ? "Exportando..." : `SCM Morbidelli (.xcs)`}</span>
            </button>
          </>
        )}

        {/* Tiempo de cómputo */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-1">
          <Clock className="w-3 h-3" />
          <span>{resultado.tiempoCalculoMs} ms</span>
        </div>
      </div>
    </div>
  );
}
