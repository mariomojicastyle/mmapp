"use client";

import React, { useState, useRef } from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import { parsearArchivoCSV, generarPlantillaCSV } from "@/lib/optimizador/csvParser";
import { parsearArchivoDXF } from "@/lib/optimizador/dxfParser2D";
import type { PiezaCorte } from "@/lib/optimizador/tiposOptimizador";
import { 
  Upload, 
  FileText, 
  FileCode2, 
  Download, 
  X, 
  Check, 
  AlertCircle, 
  Layers,
  ArrowRight
} from "lucide-react";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function ModalImportarCorte({ abierto, onCerrar }: Props) {
  const { setPiezasExternas, setOrigenDatos, setNombreArchivoExterno } = useOptimizadorStore();
  const { coloresApariencia, esquemaColor } = use3BFStore();

  const [formatoActivo, setFormatoActivo] = useState<"csv" | "dxf">("csv");
  const [piezasPreview, setPiezasPreview] = useState<PiezaCorte[]>([]);
  const [errores, setErrores] = useState<string[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string>("");
  const [arrastrando, setArrastrando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const esOscuro = esquemaColor === "oscuro";
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");
  const colorFondo = esOscuro ? "#131B2E" : "#FFFFFF";
  const colorBorde = esOscuro ? "#334155" : "#E2E8F0";

  if (!abierto) return null;

  const procesarArchivo = (file: File) => {
    setNombreArchivo(file.name);
    setErrores([]);
    setPiezasPreview([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const contenido = e.target?.result as string;
      if (!contenido) return;

      if (file.name.toLowerCase().endsWith(".dxf") || formatoActivo === "dxf") {
        const { piezas, errores: errs } = parsearArchivoDXF(contenido);
        if (errs.length > 0) setErrores(errs);
        setPiezasPreview(piezas);
      } else {
        const { piezas, errores: errs } = parsearArchivoCSV(contenido);
        if (errs.length > 0) setErrores(errs);
        setPiezasPreview(piezas);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleDescargarPlantilla = () => {
    const csvContent = generarPlantillaCSV();
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Plantilla_Corte_3dBimFab.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmarImportacion = () => {
    if (piezasPreview.length === 0) return;
    setPiezasExternas(piezasPreview);
    setNombreArchivoExterno(nombreArchivo);
    setOrigenDatos("archivo_externo");
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Cabecera del Modal */}
        <div className="p-3.5 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div 
              style={{ backgroundColor: colorBotonActivo }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
            >
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Importar Listado de Corte Externo</h3>
              <p className="text-[11px] text-slate-400">
                Carga muebles desde Excel, Cutlist, MaxCut o siluetas vectoriales DXF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Formato (CSV vs DXF) y Descarga de Plantilla en Cápsulas */}
        <div className="px-3.5 py-2 border-b bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 p-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
            <button
              type="button"
              onClick={() => { setFormatoActivo("csv"); setPiezasPreview([]); setErrores([]); }}
              style={
                formatoActivo === "csv"
                  ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                  : {}
              }
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition cursor-pointer ${
                formatoActivo === "csv" ? "shadow-sm" : "text-slate-600 dark:text-slate-300 hover:opacity-80"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Archivo CSV / Excel</span>
            </button>
            <button
              type="button"
              onClick={() => { setFormatoActivo("dxf"); setPiezasPreview([]); setErrores([]); }}
              style={
                formatoActivo === "dxf"
                  ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                  : {}
              }
              className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 transition cursor-pointer ${
                formatoActivo === "dxf" ? "shadow-sm" : "text-slate-600 dark:text-slate-300 hover:opacity-80"
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Vectorial DXF 2D</span>
            </button>
          </div>

          {formatoActivo === "csv" && (
            <button
              type="button"
              onClick={handleDescargarPlantilla}
              className="px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Descargar Plantilla CSV</span>
            </button>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3">
          {/* Zona Drag & Drop */}
          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              arrastrando
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-300 dark:border-slate-700 hover:border-cyan-500/50 bg-slate-50/50 dark:bg-slate-900/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={formatoActivo === "csv" ? ".csv,.txt" : ".dxf"}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  procesarArchivo(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <Upload className="w-8 h-8 text-cyan-600 dark:text-cyan-400 opacity-80" />
              <p className="font-bold text-xs">
                Arrastra tu archivo {formatoActivo.toUpperCase()} aquí o haz clic para seleccionarlo
              </p>
              <p className="text-[10px] text-slate-400">
                {formatoActivo === "csv" 
                  ? "Soporta columnas: Nombre, Largo, Ancho, Espesor, Cantidad, Veta, Material"
                  : "Soporta polilíneas 2D cerradas (LWPOLYLINE) generadas en AutoCAD o Rhino"}
              </p>
            </div>
          </div>

          {/* Errores */}
          {errores.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Atención con el archivo:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {errores.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vista Previa de Piezas Detectadas */}
          {piezasPreview.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Piezas Detectadas ({piezasPreview.length} tipos, {piezasPreview.reduce((a, b) => a + b.cantidad, 0)} unidades):</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Archivo Válido
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold sticky top-0">
                    <tr>
                      <th className="p-2">Pieza</th>
                      <th className="p-2">Medidas (L×A)</th>
                      <th className="p-2">Espesor</th>
                      <th className="p-2 text-center">Cant.</th>
                      <th className="p-2 text-center">Veta</th>
                      <th className="p-2">Material</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {piezasPreview.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-2 font-sans font-semibold text-slate-800 dark:text-slate-100">{p.nombre}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{p.largo} × {p.ancho} mm</td>
                        <td className="p-2 text-slate-600 dark:text-slate-300">{p.espesor} mm</td>
                        <td className="p-2 text-center font-bold text-cyan-600">{p.cantidad}</td>
                        <td className="p-2 text-center font-sans">
                          {p.rotacionPermitida ? (
                            <span className="text-amber-500 text-[10px]">Libre</span>
                          ) : (
                            <span className="text-cyan-600 font-medium text-[10px]">Veta</span>
                          )}
                        </td>
                        <td className="p-2 font-sans text-slate-400 text-[10px] truncate max-w-[120px]">{p.material}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-3 border-t bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmarImportacion}
            disabled={piezasPreview.length === 0}
            style={{ backgroundColor: colorBotonActivo }}
            className="px-5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <span>Cargar al Optimizador</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
