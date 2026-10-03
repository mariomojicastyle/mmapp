"use client";

import React, { useState, useMemo } from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import type { ModoOptimizacion, PiezaCorte } from "@/lib/optimizador/tiposOptimizador";
import { generarFichaTecnicaTallerPdf } from "@/lib/optimizador/exportadorPdfTaller";
import { descargarMaxCutCsv } from "@/lib/optimizador/exportadorMaxCut";
import { descargarDeepnestDxf, descargarDeepnestSvg } from "@/lib/optimizador/exportadorDeepnest";
import { guardarPlanLocal, descargarPlanJson } from "@/lib/optimizador/persistenciaOptimizacion";
import { Scissors, Cpu, Trees, Play, Layers, Upload, FileText, CheckCircle2, Printer, FileSpreadsheet, Save, Download, Shapes } from "lucide-react";

interface Props {
  espesoresDisponibles: number[];
  onEjecutarCalculo: () => void;
  totalPiezas: number;
  onAbrirImportador: () => void;
  piezas?: PiezaCorte[];
}

export default function OptimizadorHeader({
  espesoresDisponibles,
  onEjecutarCalculo,
  totalPiezas,
  onAbrirImportador,
  piezas,
}: Props) {
  const { 
    modoActivo, 
    setModoActivo, 
    espesorActivo, 
    setEspesorActivo, 
    calculando,
    origenDatos, 
    setOrigenDatos,
    piezasExternas,
    nombreArchivoExterno,
    resultadoOptimizacion,
    configuracion
  } = useOptimizadorStore();
  const { coloresApariencia, esquemaColor, objetoActivoId, instancias } = use3BFStore();
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const esOscuro = esquemaColor === "oscuro";
  // Colores canónicos: Tech Ethos (#0088AA) en Light, Obsidian (#1368AA mate) en Dark
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");
  const colorBotonInactivo = coloresApariencia?.botonInactivo || (esOscuro ? "#1E293B" : "#F1F5F9");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");

  const nombreProyecto = useMemo(() => {
    if (origenDatos === "archivo_externo" && nombreArchivoExterno) {
      return nombreArchivoExterno.replace(/\.[^/.]+$/, "");
    }
    const instActiva = objetoActivoId ? instancias[objetoActivoId] : null;
    return instActiva?.nombreVisible || "3dBimFab_Proyecto";
  }, [origenDatos, nombreArchivoExterno, objetoActivoId, instancias]);

  const handleExportarPdf = async () => {
    if (!resultadoOptimizacion) return;
    setExportandoPdf(true);
    try {
      await generarFichaTecnicaTallerPdf({
        nombreProyecto,
        resultado: resultadoOptimizacion,
        config: configuracion,
      });
    } catch (err) {
      console.error("Error al exportar PDF:", err);
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleExportarMaxCut = () => {
    if (!piezas || piezas.length === 0) return;
    descargarMaxCutCsv({
      nombreProyecto,
      piezas,
      formato: "espanol",
    });
  };

  const handleExportarDeepnest = () => {
    if (!piezas || piezas.length === 0) return;
    // Deepnest procesa SVG de forma nativa sin depender del servidor externo de conversión DXF (evita el error ERR-...)
    descargarDeepnestSvg({
      nombreProyecto,
      piezas,
      configuracion,
      incluirLoteCompleto: true,
    });
  };

  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleGuardarPlan = () => {
    if (!resultadoOptimizacion) return;
    setGuardando(true);
    try {
      guardarPlanLocal(nombreProyecto, modoActivo, configuracion, resultadoOptimizacion);
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3000);
    } catch (err) {
      console.error("Error al guardar plan de corte:", err);
    } finally {
      setGuardando(false);
    }
  };

  const handleDescargarJson = () => {
    if (!resultadoOptimizacion) return;
    descargarPlanJson(nombreProyecto, modoActivo, configuracion, resultadoOptimizacion);
  };

  const MODOS: Array<{ id: ModoOptimizacion; label: string; icon: React.ReactNode; tooltip: string }> = [
    {
      id: "seccionadora",
      label: "Seccionadora (Guillotina)",
      icon: <Scissors className="w-3.5 h-3.5" />,
      tooltip: "Corte continuo de lado a lado para sierras horizontales (Biesse Selco / Homag / RTA)",
    },
    {
      id: "nesting_cnc",
      label: "Celda Nesting CNC",
      icon: <Cpu className="w-3.5 h-3.5" />,
      tooltip: "Mesa de vacío Morbidelli X200 / Rover B FT. Fresado continuo 2D sin restricción de guillotina",
    },
    {
      id: "madera_maciza",
      label: "Madera Maciza (Ebanistería)",
      icon: <Trees className="w-3.5 h-3.5" />,
      tooltip: "Aserrado de tablones naturales (CILA Jamar): Rip-first vs Crosscut-first y Pies Tablares (PT)",
    },
  ];

  return (
    <header 
      style={{ 
        backgroundColor: coloresApariencia?.fondoPaneles || (esOscuro ? "#0B0F17" : "#FFFFFF"),
        borderColor: colorBorde 
      }}
      className="p-2 lg:p-3 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm"
    >
      {/* 1. Selector de la Tríada de Modos de Corte en Cápsulas rounded-full */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mr-1 hidden sm:inline">
          Modo:
        </span>
        <div 
          style={{ borderColor: colorBorde, backgroundColor: esOscuro ? "#131B2E" : "#E2E8F0" }}
          className="flex items-center p-0.5 rounded-full border gap-1 shadow-inner"
        >
          {MODOS.map((m) => {
            const activo = modoActivo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setModoActivo(m.id)}
                title={m.tooltip}
                style={
                  activo
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF", borderColor: colorBotonActivo }
                    : { backgroundColor: colorBotonInactivo, color: colorTexto, borderColor: "transparent" }
                }
                className={`px-2.5 lg:px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activo ? "shadow-md" : "hover:opacity-80"
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selector de Origen de Datos (Modelo 3dBimFab vs Archivo Externo) */}
        {piezasExternas.length > 0 && (
          <div 
            style={{ borderColor: colorBorde, backgroundColor: esOscuro ? "#131B2E" : "#E2E8F0" }}
            className="flex items-center p-0.5 rounded-full border gap-1 shadow-inner"
          >
            <button
              type="button"
              onClick={() => setOrigenDatos("modelo_3bf")}
              style={
                origenDatos === "modelo_3bf"
                  ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                  : { backgroundColor: colorBotonInactivo, color: colorTexto }
              }
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Modelo 3D
            </button>
            <button
              type="button"
              onClick={() => setOrigenDatos("archivo_externo")}
              style={
                origenDatos === "archivo_externo"
                  ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                  : { backgroundColor: colorBotonInactivo, color: colorTexto }
              }
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              title={nombreArchivoExterno || "Archivo importado"}
            >
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[90px]">{nombreArchivoExterno || "Externo"}</span>
            </button>
          </div>
        )}

        {/* Botón Importar CSV / DXF en Cápsula */}
        <button
          type="button"
          onClick={onAbrirImportador}
          style={{ borderColor: colorBorde }}
          className="px-3 py-1 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          title="Importar lista de corte CSV o siluetas DXF"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Importar CSV / DXF</span>
        </button>
      </div>

      {/* 2. Filtro por Espesor de Tablero en Cápsulas rounded-full */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mr-0.5 hidden md:inline">
          Espesor:
        </span>
        <div 
          style={{ borderColor: colorBorde, backgroundColor: esOscuro ? "#131B2E" : "#E2E8F0" }}
          className="flex items-center p-0.5 rounded-full border gap-1 shadow-inner"
        >
          <button
            type="button"
            onClick={() => setEspesorActivo(null)}
            style={
              espesorActivo === null
                ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                : { backgroundColor: colorBotonInactivo, color: colorTexto }
            }
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
              espesorActivo === null ? "shadow-sm" : "hover:opacity-80"
            }`}
          >
            Todos ({totalPiezas})
          </button>
          {espesoresDisponibles.map((esp) => {
            const activo = espesorActivo === esp;
            return (
              <button
                key={esp}
                type="button"
                onClick={() => setEspesorActivo(esp)}
                style={
                  activo
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                    : { backgroundColor: colorBotonInactivo, color: colorTexto }
                }
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                  activo ? "shadow-sm" : "hover:opacity-80"
                }`}
              >
                {esp} mm
              </button>
            );
          })}
        </div>

        {/* 3. Botón de Acción Principal en Cápsula rounded-full */}
        <button
          type="button"
          onClick={onEjecutarCalculo}
          disabled={calculando}
          style={{ backgroundColor: colorBotonActivo }}
          className="px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer ml-1"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${calculando ? "animate-spin" : ""}`} />
          <span>{calculando ? "Optimizando..." : "Calcular Corte"}</span>
        </button>

        {/* 4. Botón Guardar Plan de Optimización */}
        {resultadoOptimizacion && resultadoOptimizacion.laminas.length > 0 && (
          <button
            type="button"
            onClick={handleGuardarPlan}
            disabled={guardando}
            style={
              guardadoExitoso
                ? { borderColor: "#10B981", backgroundColor: esOscuro ? "#064E3B" : "#ECFDF5" }
                : { borderColor: colorBorde }
            }
            className={`px-3 py-1.5 rounded-full border transition font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ml-1 ${
              guardadoExitoso
                ? "text-emerald-600 dark:text-emerald-300"
                : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
            }`}
            title="Guardar este plan de corte (parámetros de lote, disco, láminas y desperdicio) en el proyecto"
          >
            {guardadoExitoso ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Guardar Plan</span>
              </>
            )}
          </button>
        )}

        {/* 5. Botón Rápido Ficha Técnica PDF */}
        {resultadoOptimizacion && resultadoOptimizacion.laminas.length > 0 && (
          <button
            type="button"
            onClick={handleExportarPdf}
            disabled={exportandoPdf}
            style={{ borderColor: colorBorde }}
            className="px-3 py-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95 ml-1"
            title="Generar e imprimir Ficha Técnica de Taller en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">{exportandoPdf ? "Generando..." : "Ficha PDF"}</span>
          </button>
        )}

        {/* 6. Botón Exportar a MaxCut CSV */}
        {piezas && piezas.length > 0 && (
          <button
            type="button"
            onClick={handleExportarMaxCut}
            style={{ borderColor: colorBorde }}
            className="px-3 py-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95 ml-1"
            title="Exportar lista de corte a archivo CSV formateado para MaxCut"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">MaxCut (CSV)</span>
          </button>
        )}

        {/* 7. Botón Exportar a Deepnest SVG */}
        {piezas && piezas.length > 0 && (
          <button
            type="button"
            onClick={handleExportarDeepnest}
            style={{ borderColor: colorBorde }}
            className="px-3 py-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95 ml-1"
            title="Exportar archivo vectorial SVG nativo para Deepnest (sin errores de servidor de conversión)"
          >
            <Shapes className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Deepnest (SVG)</span>
          </button>
        )}

        {/* 8. Botón Descargar Archivo JSON de Nesting */}
        {resultadoOptimizacion && resultadoOptimizacion.laminas.length > 0 && (
          <button
            type="button"
            onClick={handleDescargarJson}
            style={{ borderColor: colorBorde }}
            className="px-2.5 py-1.5 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm transition active:scale-95 ml-1"
            title="Descargar archivo JSON de manufactura para archivo o intercambio"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400" />
            <span className="hidden lg:inline text-[11px]">JSON</span>
          </button>
        )}
      </div>
    </header>
  );
}
