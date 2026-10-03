"use client";

import React, { useState, useMemo } from "react";
import type { ResultadoOptimizacionGlobal, PiezaCorte } from "@/lib/optimizador/tiposOptimizador";
import { use3BFStore } from "@/lib/store";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { generarFichaTecnicaTallerPdf } from "@/lib/optimizador/exportadorPdfTaller";
import { generarYDescargarGcode, generarYDescargarTodosGcodeZip } from "@/lib/optimizador/exportadorCncGcode";
import { generarYDescargarXilog, generarYDescargarTodosXilogZip } from "@/lib/optimizador/exportadorCncXilog";
import { descargarMaxCutCsv } from "@/lib/optimizador/exportadorMaxCut";
import { 
  Percent, 
  Layers, 
  Scissors, 
  Trees, 
  Clock, 
  FileText, 
  Download, 
  Cpu, 
  Printer,
  FileSpreadsheet
} from "lucide-react";

interface Props {
  resultado: ResultadoOptimizacionGlobal | null;
  piezas?: PiezaCorte[];
}

export default function ResumenMetricasCard({ resultado, piezas }: Props) {
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

  // 1. Resumen Consolidado Global por Tipo de Material / Lámina
  const resumenPorMaterial = useMemo(() => {
    if (!resultado || !resultado.laminas || resultado.laminas.length === 0) return [];

    const mapa = new Map<string, {
      material: string;
      espesor: number;
      largoTotal: number;
      anchoTotal: number;
      cantidadLaminas: number;
      areaTotalMm2: number;
      areaUtilizadaMm2: number;
    }>();

    resultado.laminas.forEach((lam) => {
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
  }, [resultado]);

  // Desperdicio Global Ponderado de todo el lote
  const desperdicioGlobalPonderado = useMemo(() => {
    if (!resultado || !resultado.laminas || resultado.laminas.length === 0) return 0;
    const totalAreaBruta = resultado.laminas.reduce((acc, l) => acc + l.areaTotalMm2, 0);
    const totalAreaUtil = resultado.laminas.reduce((acc, l) => acc + l.areaUtilizadaMm2, 0);
    if (totalAreaBruta <= 0) return 0;
    return Number((((totalAreaBruta - totalAreaUtil) / totalAreaBruta) * 100).toFixed(1));
  }, [resultado]);

  const handleExportarMaxCut = () => {
    let listaPiezas: any[] | undefined = piezas;
    if ((!listaPiezas || listaPiezas.length === 0) && resultado) {
      listaPiezas = resultado.laminas.flatMap((l) =>
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

  // Manejador Ficha Técnica PDF
  const handleExportarPdf = async () => {
    if (!resultado) return;
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
      if (resultado && resultado.laminas.length === 1) {
        generarYDescargarGcode({
          nombreProyecto,
          lamina: resultado.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else if (resultado) {
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
      if (resultado && resultado.laminas.length === 1) {
        generarYDescargarXilog({
          nombreProyecto,
          lamina: resultado.laminas[0],
          diametroFresaMm: configuracion.diametroFresa,
        });
      } else if (resultado) {
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

  // Estado vacío: si aún no hay cálculo generado
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

  return (
    <div 
      style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
      className="p-2.5 lg:p-3 border-t flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-inner"
    >
      {/* 1. Métricas de Rendimiento con Foco en Desperdicio Global y Láminas Totales */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Total Tableros Totales */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-800 dark:text-slate-100 shadow-sm">
          <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-bold text-sm">{resultado.totalLaminas}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {resultado.modo === "madera_maciza" ? "Tablones" : "Tableros Totales"}
          </span>
        </div>

        {/* Desperdicio Global Ponderado (Merma) */}
        <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-full text-rose-700 dark:text-rose-300 shadow-sm">
          <Percent className="w-4 h-4" />
          <span className="font-bold text-sm">{desperdicioGlobalPonderado}%</span>
          <span className="text-[11px] uppercase font-bold tracking-wider">Desperdicio Global</span>
        </div>

        {/* Desglose de Desperdicio y Láminas por Tipo de Material */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {resumenPorMaterial.map((m) => (
            <div 
              key={`${m.material}_${m.espesor}`}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full shadow-sm text-xs"
              title={`${m.material}: ${m.cantidadLaminas} tableros (${m.largoTotal}×${m.anchoTotal}mm) con ${m.porcentajeDesperdicio}% de merma`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
              <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px] lg:max-w-[180px]">
                {m.material}:
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">
                {m.cantidadLaminas} {m.cantidadLaminas === 1 ? "tablero" : "tableros"}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {m.porcentajeDesperdicio}% merma
              </span>
            </div>
          ))}
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

        {/* Botón MaxCut CSV */}
        <button
          type="button"
          onClick={handleExportarMaxCut}
          style={{ borderColor: colorBorde }}
          className="px-3 py-1 rounded-full border bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
          title="Descargar lista de corte en formato CSV para importar y calibrar en MaxCut"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>MaxCut (CSV)</span>
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
