"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { FileText, Hammer, DollarSign, Download, Check } from "lucide-react";

export default function DespieceView() {
  const { resultado, parametros } = use3BFStore();
  const [descargando, setDescargando] = useState(false);

  if (!resultado) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        Calculando despiece DfMA...
      </div>
    );
  }

  const descargarDXF = async () => {
    setDescargando(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: "M00001", parameters: parametros }),
      });
      const data = await res.json();
      if (data.dxf_content) {
        const blob = new Blob([data.dxf_content], { type: "application/dxf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "mueble_3bf.dxf";
        a.click();
      }
    } catch (e) {
      console.error("Error al exportar DXF:", e);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Resumen Superior */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-center">
          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Superficie</span>
          <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
            {resultado.summary.area_madera_m2} m²
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Piezas</span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {resultado.summary.piezas_totales} u
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center">
          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Costo Est.</span>
          <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
            ${resultado.summary.costo_estimado_usd} USD
          </span>
        </div>
      </div>

      {/* Lista de Tableros / Madera */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
          <FileText className="w-4 h-4 text-cyan-600" /> Lista de Corte de Tableros (BOM)
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <th className="p-2 font-medium">Pieza</th>
                <th className="p-2 font-medium">Medidas (mm)</th>
                <th className="p-2 font-medium text-center">Cant.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {resultado.despiece.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="p-2 font-medium">{p.nombre}</td>
                  <td className="p-2 font-mono text-[11px] text-gray-500">{p.largo} x {p.ancho} x {p.espesor}</td>
                  <td className="p-2 text-center font-bold">{p.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de Herrajes */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
          <Hammer className="w-4 h-4 text-cyan-600" /> Inventario de Herrajes
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {resultado.herrajes.map((h, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <span className="font-medium text-gray-600 dark:text-gray-300">{h.nombre}</span>
              <span className="font-bold font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200">
                {h.cantidad}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Botón de Exportación CNC DXF */}
      <div className="pt-2">
        <button
          onClick={descargarDXF}
          disabled={descargando}
          className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-medium text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {descargando ? "Generando DXF..." : "Exportar DXF para Seccionadora CNC"}
        </button>
      </div>
    </div>
  );
}
