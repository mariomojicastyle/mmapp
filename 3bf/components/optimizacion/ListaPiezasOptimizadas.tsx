"use client";

import React, { useState, useMemo } from "react";
import type { PiezaCorte } from "@/lib/optimizador/tiposOptimizador";
import { use3BFStore } from "@/lib/store";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { generarFichaTecnicaTallerPdf } from "@/lib/optimizador/exportadorPdfTaller";
import { generarYDescargarGcode, generarYDescargarTodosGcodeZip } from "@/lib/optimizador/exportadorCncGcode";
import { generarYDescargarXilog, generarYDescargarTodosXilogZip } from "@/lib/optimizador/exportadorCncXilog";
import { descargarMaxCutCsv } from "@/lib/optimizador/exportadorMaxCut";
import { 
  Compass, 
  RotateCw, 
  Layers, 
  Percent, 
  FileSpreadsheet, 
  Box, 
  Scissors, 
  Trees, 
  Printer, 
  Download, 
  Cpu 
} from "lucide-react";

interface Props {
  piezas: PiezaCorte[];
}

export default function ListaPiezasOptimizadas({ piezas }: Props) {
  const { coloresApariencia, esquemaColor, objetoActivoId, instancias } = use3BFStore();
  const { 
    configuracion, 
    resultadoOptimizacion, 
    origenDatos, 
    nombreArchivoExterno 
  } = useOptimizadorStore();

  const tamanoLote = configuracion.tamanoLote || 1;
  const [pestanaActiva, setPestanaActiva] = useState<"piezas" | "resumen">("resumen");
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoGcode, setExportandoGcode] = useState(false);
  const [exportandoXilog, setExportandoXilog] = useState(false);

  const esOscuro = esquemaColor === "oscuro";
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");

  const nombreProyecto = useMemo(() => {
    if (origenDatos === "archivo_externo" && nombreArchivoExterno) {
      return nombreArchivoExterno.replace(/\.[^/.]+$/, "");
    }
    const instActiva = objetoActivoId ? instancias[objetoActivoId] : null;
    return instActiva?.nombreVisible || "3dBimFab_Proyecto";
  }, [origenDatos, nombreArchivoExterno, objetoActivoId, instancias]);

  // 1. Resumen Consolidado Global por Tipo de Material / Lámina
  const resumenPorMaterial = useMemo(() => {
    if (!resultadoOptimizacion || !resultadoOptimizacion.laminas || resultadoOptimizacion.laminas.length === 0) return [];

    const mapa = new Map<string, {
      material: string;
      espesor: number;
      largoTotal: number;
      anchoTotal: number;
      cantidadLaminas: number;
      areaTotalMm2: number;
      areaUtilizadaMm2: number;
    }>();

    resultadoOptimizacion.laminas.forEach((lam) => {
      const clave = `${lam.material}_${lam.espesor}_${lam.largoTotal}x${lam.anchoTotal}`;
      const actual = mapa.get(clave) || {
        material: lam.material || `Tablero ${lam.espesor}mm`,
        espesor: lam.espesor,
        largoTotal: lam.largoTotal,
        anchoTotal: lam.anchoTotal,
        cantidadLaminas: 0,
        areaTotalMm2: 0,
        areaUtilizadaMm2: 0,
      };

      actual.cantidadLaminas += 1;
      actual.areaTotalMm2 += lam.areaTotalMm2;
      actual.areaUtilizadaMm2 += lam.areaUtilizadaMm2;
      mapa.set(clave, actual);
    });

    return Array.from(mapa.values()).map((g) => {
      const desperdicioMm2 = g.areaTotalMm2 - g.areaUtilizadaMm2;
      const porcentajeDesperdicio = g.areaTotalMm2 > 0
        ? Number(((desperdicioMm2 / g.areaTotalMm2) * 100).toFixed(1))
        : 0;
      return {
        ...g,
        porcentajeDesperdicio,
      };
    });
  }, [resultadoOptimizacion]);

  // Desperdicio Global Ponderado de todo el lote
  const desperdicioGlobalPonderado = useMemo(() => {
    if (!resultadoOptimizacion || !resultadoOptimizacion.laminas || resultadoOptimizacion.laminas.length === 0) return 0;
    const totalAreaBruta = resultadoOptimizacion.laminas.reduce((acc, l) => acc + l.areaTotalMm2, 0);
    const totalAreaUtil = resultadoOptimizacion.laminas.reduce((acc, l) => acc + l.areaUtilizadaMm2, 0);
    if (totalAreaBruta <= 0) return 0;
    return Number((((totalAreaBruta - totalAreaUtil) / totalAreaBruta) * 100).toFixed(1));
  }, [resultadoOptimizacion]);

  // Metros lineales de corte totales
  const metrosLinealesTotales = useMemo(() => {
    if (!resultadoOptimizacion || !resultadoOptimizacion.laminas) return 0;
    return Number(
      resultadoOptimizacion.laminas.reduce((acc, l) => acc + l.metrosLinealesCorte, 0).toFixed(1)
    );
  }, [resultadoOptimizacion]);

  // Pies talares (Madera maciza)
  const ptNetosTotales = useMemo(() => {
    if (!resultadoOptimizacion || !resultadoOptimizacion.laminas) return 0;
    return Number(
      resultadoOptimizacion.laminas.reduce((acc, l) => acc + (l.piesTablaresNetos || 0), 0).toFixed(2)
    );
  }, [resultadoOptimizacion]);

  const ptBrutosTotales = useMemo(() => {
    if (!resultadoOptimizacion || !resultadoOptimizacion.laminas) return 0;
    return Number(
      resultadoOptimizacion.laminas.reduce((acc, l) => acc + (l.piesTablaresBrutos || 0), 0).toFixed(2)
    );
  }, [resultadoOptimizacion]);

  // Manejadores de exportación
  const handleExportarMaxCut = () => {
    let listaPiezas: any[] | undefined = piezas;
    if ((!listaPiezas || listaPiezas.length === 0) && resultadoOptimizacion) {
      listaPiezas = resultadoOptimizacion.laminas.flatMap((l) =>
        l.piezas.map((p) => ({
          nombre: p.nombre,
          descripcion: p.descripcion,
          largo: p.largo,
          ancho: p.ancho,
          espesor: l.espesor,
          cantidad: 1,
          material: l.material,
          rotacionPermitida: p.rotada,
        }))
      );
    }
    if (!listaPiezas || listaPiezas.length === 0) return;

    descargarMaxCutCsv({
      nombreProyecto,
      piezas: listaPiezas,
      formato: "espanol",
    });
  };

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

  const handleExportarGcode = async () => {
    setExportandoGcode(true);
    try {
      if (resultadoOptimizacion && resultadoOptimizacion.laminas.length === 1) {
        generarYDescargarGcode({
          nombreProyecto,
          lamina: resultadoOptimizacion.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else if (resultadoOptimizacion) {
        await generarYDescargarTodosGcodeZip({
          nombreProyecto,
          laminas: resultadoOptimizacion.laminas,
          diametroFresaMm: configuracion.diametroFresa,
        });
      }
    } catch (err) {
      console.error("Error al exportar G-Code:", err);
    } finally {
      setExportandoGcode(false);
    }
  };

  const handleExportarXilog = async () => {
    setExportandoXilog(true);
    try {
      if (resultadoOptimizacion && resultadoOptimizacion.laminas.length === 1) {
        generarYDescargarXilog({
          nombreProyecto,
          lamina: resultadoOptimizacion.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else if (resultadoOptimizacion) {
        await generarYDescargarTodosXilogZip({
          nombreProyecto,
          laminas: resultadoOptimizacion.laminas,
          diametroFresaMm: configuracion.diametroFresa,
        });
      }
    } catch (err) {
      console.error("Error al exportar Morbidelli Xilog:", err);
    } finally {
      setExportandoXilog(false);
    }
  };

  if (!piezas || piezas.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No se detectaron piezas en el modelo activo.
      </div>
    );
  }

  const totalUnidades = piezas.reduce((a, b) => a + b.cantidad, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Selector de Pestañas en Cápsulas rounded-full */}
      <div className="p-2 border-b flex items-center justify-between gap-1.5 bg-slate-100/60 dark:bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-slate-200 dark:bg-slate-800 w-full shadow-inner">
          <button
            type="button"
            onClick={() => setPestanaActiva("resumen")}
            style={pestanaActiva === "resumen" ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" } : {}}
            className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              pestanaActiva === "resumen" ? "shadow-sm" : "text-slate-600 dark:text-slate-300 hover:opacity-80"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Resumen ({resumenPorMaterial.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setPestanaActiva("piezas")}
            style={pestanaActiva === "piezas" ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" } : {}}
            className={`flex-1 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              pestanaActiva === "piezas" ? "shadow-sm" : "text-slate-600 dark:text-slate-300 hover:opacity-80"
            }`}
          >
            <Box className="w-3 h-3" />
            <span>Piezas ({totalUnidades})</span>
          </button>
        </div>
      </div>

      {/* Contenido Pestaña 1: Resumen Global de Materiales, Métricas y Exportación */}
      {pestanaActiva === "resumen" && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
          {/* Tarjeta Resumen General */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Resumen Global del Pedido
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-semibold block">Total Tableros</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                  {resultadoOptimizacion?.totalLaminas || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Desperdicio (Merma)</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {desperdicioGlobalPonderado}%
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-slate-500">
                <span>Piezas Fabricadas:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {resultadoOptimizacion?.totalPiezasUbicadas || 0} de {resultadoOptimizacion?.totalPiezasProgramadas || 0}
                </span>
              </div>

              {metrosLinealesTotales > 0 && (
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-amber-500" />
                    Metros de Corte:
                  </span>
                  <span className="font-bold font-mono text-slate-700 dark:text-slate-200">
                    {metrosLinealesTotales} m
                  </span>
                </div>
              )}

              {resultadoOptimizacion?.modo === "madera_maciza" && ptBrutosTotales > 0 && (
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Trees className="w-3 h-3 text-amber-600" />
                    Pies Tablares:
                  </span>
                  <span className="font-bold font-mono text-amber-700 dark:text-amber-300">
                    {ptNetosTotales} Neto / {ptBrutosTotales} Bruto
                  </span>
                </div>
              )}

              {tamanoLote > 1 && (
                <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 font-medium pt-0.5">
                  <span>Multiplicador de Lote:</span>
                  <span className="font-bold">×{tamanoLote} muebles</span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones de Exportación para Taller (Cápsulas rounded-full) */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Exportación para Taller & CNC
            </div>
            <div className="flex flex-col gap-1.5">
              {/* Botón Ficha Técnica PDF */}
              <button
                type="button"
                onClick={handleExportarPdf}
                disabled={exportandoPdf || !resultadoOptimizacion}
                className="w-full px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-40"
                title="Generar Ficha Técnica de Taller en PDF"
              >
                <Printer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{exportandoPdf ? "Generando PDF..." : "Ficha Técnica PDF"}</span>
              </button>

              {/* Botón MaxCut CSV */}
              <button
                type="button"
                onClick={handleExportarMaxCut}
                disabled={!resultadoOptimizacion}
                className="w-full px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-40"
                title="Descargar listado CSV para MaxCut v2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>MaxCut CSV</span>
              </button>

              {/* Botones CNC si aplica */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleExportarXilog}
                  disabled={exportandoXilog || !resultadoOptimizacion}
                  className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-40"
                  title="Exportar archivo SCM Morbidelli Xilog (.xcs)"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">{exportandoXilog ? "..." : "SCM Xilog"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportarGcode}
                  disabled={exportandoGcode || !resultadoOptimizacion}
                  className="px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95 disabled:opacity-40"
                  title="Exportar código CNC G-Code (.nc)"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="truncate">{exportandoGcode ? "..." : "G-Code CNC"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desglose por Cada Material de Tablero */}
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 pt-1">
            Láminas y Desperdicio por Material
          </div>

          {resumenPorMaterial.map((m) => (
            <div
              key={`${m.material}_${m.espesor}`}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2 hover:border-cyan-400 transition-all"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate" title={m.material}>
                  {m.material}
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-bold text-[10px] shrink-0">
                  {m.espesor} mm
                </span>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Formato de Inventario:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {m.largoTotal} × {m.anchoTotal} mm
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">Cantidad Tableros:</span>
                  <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400">
                    {m.cantidadLaminas} {m.cantidadLaminas === 1 ? "tablero" : "tableros"}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-rose-500 font-bold">Desperdicio (Merma):</span>
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                    {m.porcentajeDesperdicio}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contenido Pestaña 2: Listado de Piezas Individuales */}
      {pestanaActiva === "piezas" && (
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {piezas.map((p) => (
            <div
              key={p.id}
              style={{ borderColor: colorBorde }}
              className="flex items-center justify-between p-2 rounded-xl border bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  style={{ backgroundColor: p.colorHex || "#38BDF8" }}
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                />
                <div className="truncate">
                  <div className="font-bold truncate text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{p.nombre}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      ×{p.cantidad}
                    </span>
                  </div>
                  {p.descripcion && p.descripcion !== p.nombre && (
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold truncate">
                      {p.descripcion}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 ml-2">
                <div className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {p.largo} × {p.ancho}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                  <span>{p.espesor} mm</span>
                  <span>•</span>
                  {p.rotacionPermitida ? (
                    <span className="text-amber-500" title="Rotación libre (sin veta visible)">Libre</span>
                  ) : (
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium" title="Sentido de veta estricto">Veta</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
