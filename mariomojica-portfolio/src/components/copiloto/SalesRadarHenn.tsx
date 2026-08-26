"use client";

import React, { useState } from "react";
import { Calculator, DollarSign, Clock, ShieldCheck, FileSpreadsheet, ChevronRight, CheckCircle2 } from "lucide-react";

export function SalesRadarHenn() {
  const [salarioCLT, setSalarioCLT] = useState(6000);
  const [manualesMes, setManualesMes] = useState(16);
  const [horasPromedio, setHorasPromedio] = useState(11.5); // Promedio ponderado

  const costoHora = salarioCLT / 176;
  const horasTotales = Math.round(manualesMes * horasPromedio);
  const costoInternoHenn = horasTotales * costoHora;
  const propuestaMario = costoInternoHenn * 0.70; // 30% ahorro
  const ahorroMensual = costoInternoHenn - propuestaMario;
  const ahorroAnual = ahorroMensual * 12;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4 text-slate-800 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Radar de Costos Móveis Henn (Pág 4)</span>
        </div>
        <span className="bg-cyan-50 text-cyan-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-cyan-200">
          30% Ahorro Garantizado
        </span>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold block">Costo Actual Henn (P&D):</span>
          <span className="text-sm font-extrabold text-slate-900">
            R$ {costoInternoHenn.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[9px] font-normal text-slate-400"> /mes</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] text-cyan-700 font-bold block">Ahorro Neto Anual:</span>
          <span className="text-sm font-extrabold text-cyan-600">
            R$ {ahorroAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[9px] font-normal text-cyan-500"> /año</span>
          </span>
        </div>
      </div>

      {/* Variables Calibrables */}
      <div className="space-y-2 border-t border-slate-100 pt-2">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-600">Salario Promedio CLT + Encargos:</span>
          <span className="font-bold text-slate-900">R$ {salarioCLT.toLocaleString()} /mes</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-600">Horas Totales Invertidas en P&D:</span>
          <span className="font-bold text-slate-900">{horasTotales} h /mes (1.1 diseñadores)</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-600">Tarifa Sugerida Mario Mojica:</span>
          <span className="font-bold text-cyan-700">R$ {propuestaMario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /mes</span>
        </div>
      </div>

      {/* Notas Rápidas para la Llamada con Marcos */}
      <div className="bg-cyan-50/70 border border-cyan-100 rounded-lg p-2.5 text-[11px] space-y-1.5 text-slate-700">
        <span className="font-bold text-cyan-900 flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
          Puntos Clave para Recordarle a Marcos:
        </span>
        <ul className="space-y-1 text-[10px] text-slate-600 list-disc list-inside">
          <li><strong>Etapa 1 (Manuales):</strong> Usamos directo el SketchUp de Cintia. Cero Grasshopper.</li>
          <li><strong>Manual Impreso 1 Pág:</strong> Asegura el escaneo del QR y evita el desinterés.</li>
          <li><strong>Multi-idioma:</strong> Portugués, Español e Inglés incluidos desde el día 1.</li>
          <li><strong>Cero Postprocesadores:</strong> Los DXF de 3dBimFab van directo a CNCs sin costo.</li>
        </ul>
      </div>
    </div>
  );
}
