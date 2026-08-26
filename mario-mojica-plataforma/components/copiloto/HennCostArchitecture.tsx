"use client";

import React, { useState, useEffect } from "react";
import { Calculator, TrendingDown, Users, Laptop, Clock, ShieldCheck, Sparkles, Plus, Trash2, RotateCcw } from "lucide-react";

export interface ExtraCost {
  id: string;
  nombre: string;
  costoMensual: number;
}

export function HennCostArchitecture({
  onSummaryChange
}: {
  onSummaryChange?: (data: any) => void;
}) {
  // Variables principales de la operación de Henn (basadas en la Tabla de Validación Pág 4)
  const [lanzamientosAnuales, setLanzamientosAnuales] = useState(192); // 16 por mes
  const [salarioCLT, setSalarioCLT] = useState(6000); // R$ 6.000 / mes / persona
  const [costoLicenciaMes, setCostoLicenciaMes] = useState(350); // SketchUp + Adobe por estación
  const [ahorroPct, setAhorroPct] = useState(30); // 30% de ahorro

  // Distribución de tipos de manuales (% de la mezcla)
  const [pctPequenos, setPctPequenos] = useState(31.25); // 5 de 16 (~31%)
  const [pctMedianos, setPctMedianos] = useState(50.0);   // 8 de 16 (50%)
  const [pctGrandes, setPctGrandes] = useState(18.75);   // 3 de 16 (~19%)

  // Horas de desarrollo por tipo de manual
  const [horasPequeno, setHorasPequeno] = useState(8);   // < 10 piezas (1 día)
  const [horasMediano, setHorasMediano] = useState(12);  // 11 a 25 piezas (1.5 días)
  const [horasGrande, setHorasGrande] = useState(16);    // 26 a 40 piezas (2 días)

  // Costos extras añadibles
  const [extras, setExtras] = useState<ExtraCost[]>([]);

  // Cálculos matemáticos de la operación
  const manualesMes = lanzamientosAnuales / 12;
  const cantPequenosMes = Math.round((manualesMes * pctPequenos) / 100);
  const cantMedianosMes = Math.round((manualesMes * pctMedianos) / 100);
  const cantGrandesMes = Math.max(0, Math.round(manualesMes - cantPequenosMes - cantMedianosMes));

  const horasPequenosMes = cantPequenosMes * horasPequeno;
  const horasMedianosMes = cantMedianosMes * horasMediano;
  const horasGrandesMes = cantGrandesMes * horasGrande;
  const horasTotalesMes = horasPequenosMes + horasMedianosMes + horasGrandesMes;

  // Horas laborales estándar por mes (22 días x 8h = 176h)
  const horasLaboralesMes = 176;
  const costoHoraCLT = salarioCLT / horasLaboralesMes; // ~R$ 34,09 / hora
  const personasRequeridas = Number((horasTotalesMes / horasLaboralesMes).toFixed(1)); // Diseñadores equivalentes

  // Costos mensuales
  const costoManoObraMes = horasTotalesMes * costoHoraCLT;
  const costoLicenciasMes = Math.ceil(personasRequeridas || 1) * costoLicenciaMes;
  const costoExtrasMes = extras.reduce((acc, it) => acc + (Number(it.costoMensual) || 0), 0);

  const costoOperacionTotalMes = costoManoObraMes + costoLicenciasMes + costoExtrasMes;
  const costoOperacionTotalAnual = costoOperacionTotalMes * 12;

  // Propuesta de Mario Mojica (30% Ahorro)
  const propuestaMarioMes = costoOperacionTotalMes * ((100 - ahorroPct) / 100);
  const propuestaMarioAnual = propuestaMarioMes * 12;
  const ahorroNetoMensual = costoOperacionTotalMes - propuestaMarioMes;
  const ahorroNetoAnual = ahorroNetoMensual * 12;

  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange({
        lanzamientosAnuales,
        manualesMes,
        horasTotalesMes,
        personasRequeridas,
        costoOperacionTotalMes,
        costoOperacionTotalAnual,
        propuestaMarioMes,
        propuestaMarioAnual,
        ahorroNetoAnual,
        ahorroPct
      });
    }
  }, [
    lanzamientosAnuales,
    manualesMes,
    horasTotalesMes,
    personasRequeridas,
    costoOperacionTotalMes,
    costoOperacionTotalAnual,
    propuestaMarioMes,
    propuestaMarioAnual,
    ahorroNetoAnual,
    ahorroPct,
    onSummaryChange
  ]);

  const addExtra = () => {
    setExtras(prev => [
      ...prev,
      { id: `ext-${Date.now()}`, nombre: "Impresión / SAC / Renders", costoMensual: 400 }
    ]);
  };

  const removeExtra = (id: string) => {
    setExtras(prev => prev.filter(e => e.id !== id));
  };

  const updateExtra = (id: string, field: "nombre" | "costoMensual", val: any) => {
    setExtras(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const resetValores = () => {
    setLanzamientosAnuales(192);
    setSalarioCLT(6000);
    setCostoLicenciaMes(350);
    setAhorroPct(30);
    setHorasPequeno(8);
    setHorasMediano(12);
    setHorasGrande(16);
    setExtras([]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col gap-4 text-slate-800 text-xs h-full overflow-y-auto">
      {/* Header del Radar de Costos */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
              Tabla de Validación de Costos y Tiempos de P&D (Henn)
            </h2>
            <p className="text-[11px] text-slate-500">
              Agenda técnica con Marcos Unnass para cotizar la operación actual y calibrar el 30% de ahorro.
            </p>
          </div>
        </div>

        <button
          onClick={resetValores}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition"
          title="Restablecer valores de referencia"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Tarjetas KPI de Comparación Financiera */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500">Costo Operación Henn:</span>
          <div>
            <span className="text-base font-extrabold text-slate-900 block">
              R$ {costoOperacionTotalMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[9px] font-normal text-slate-500"> /mes</span>
            </span>
            <span className="text-[10px] text-slate-500">R$ {costoOperacionTotalAnual.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} /año</span>
          </div>
        </div>

        <div className="bg-cyan-50/70 p-2.5 rounded-lg border border-cyan-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-900">Propuesta Mario:</span>
            <span className="bg-cyan-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
              -{ahorroPct}%
            </span>
          </div>
          <div>
            <span className="text-base font-extrabold text-cyan-700 block">
              R$ {propuestaMarioMes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-[9px] font-normal text-cyan-800"> /mes</span>
            </span>
            <span className="text-[10px] text-cyan-700">R$ {propuestaMarioAnual.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} /año</span>
          </div>
        </div>

        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-800">Ahorro Neto Anual:</span>
          <div>
            <span className="text-base font-extrabold text-emerald-600 block">
              +R$ {ahorroNetoAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-700">+R$ {ahorroNetoMensual.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} cada mes</span>
          </div>
        </div>
      </div>

      {/* Pregunta Clave y Desglose de Parámetros (Exacto de la Imagen) */}
      <div className="space-y-3">
        {/* Variable 1: Volumen de Productos al Año */}
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
              🎯 1. ¿Cuántos productos / lanzamientos desarrollan al año?
            </span>
            <span className="font-extrabold text-cyan-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
              {lanzamientosAnuales} muebles/año (~{manualesMes.toFixed(1)}/mes)
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="360"
            step="12"
            value={lanzamientosAnuales}
            onChange={e => setLanzamientosAnuales(Number(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>60/año (5/mes)</span>
            <span>192/año (16/mes - Referencia Henn)</span>
            <span>360/año (30/mes)</span>
          </div>
        </div>

        {/* Tabla Detallada con las 8 Variables de la Imagen */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                <th className="p-2">Variable de Ingeniería y P&D</th>
                <th className="p-2 text-center">Valor Henn</th>
                <th className="p-2 text-center">Unidad</th>
                <th className="p-2 text-right">Impacto en Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Fila 1: Personas dedicadas a manuales */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-800">
                  Personas en P&D dedicadas a manuales
                </td>
                <td className="p-2 text-center font-bold text-slate-900 bg-slate-50/50">
                  {personasRequeridas}
                </td>
                <td className="p-2 text-center text-slate-500">Personas (eq.)</td>
                <td className="p-2 text-right text-slate-600 text-[10px]">
                  Diseñadores dedicados a modelado, isométricos y despiece.
                </td>
              </tr>

              {/* Fila 2: Software y Licencias */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-800">
                  Software en uso y costo de licencias
                </td>
                <td className="p-2 text-center">
                  <span className="bg-cyan-50 text-cyan-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                    SketchUp + InDesign + Illustrator
                  </span>
                </td>
                <td className="p-2 text-center text-slate-500">Software / Año</td>
                <td className="p-2 text-right font-bold text-slate-900">
                  R$ {costoLicenciasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /mes
                </td>
              </tr>

              {/* Fila 3: Salario CLT */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 font-medium text-slate-800">
                  Salario promedio + cargas sociales (CLT)
                </td>
                <td className="p-2 text-center">
                  <input
                    type="number"
                    step="500"
                    value={salarioCLT}
                    onChange={e => setSalarioCLT(Number(e.target.value))}
                    className="w-20 text-center font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-cyan-500"
                  />
                </td>
                <td className="p-2 text-center text-slate-500">R$ / Mes / Persona</td>
                <td className="p-2 text-right text-slate-600 text-[10px]">
                  Costo hora base: <strong>R$ {costoHoraCLT.toFixed(2)}/h</strong> (SC).
                </td>
              </tr>

              {/* Fila 4: Manual Pequeño */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 text-slate-700">
                  Tiempo por Manual Pequeño (&lt; 10 piezas)
                </td>
                <td className="p-2 text-center font-bold text-slate-900">
                  {horasPequeno} h (1 día)
                </td>
                <td className="p-2 text-center text-slate-500">Horas / Manual</td>
                <td className="p-2 text-right text-slate-700 text-[10px]">
                  {cantPequenosMes} manuales/mes = <strong>{horasPequenosMes}h en P&D</strong>
                </td>
              </tr>

              {/* Fila 5: Manual Mediano */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 text-slate-700">
                  Tiempo por Manual Mediano (11 a 25 piezas)
                </td>
                <td className="p-2 text-center font-bold text-slate-900">
                  {horasMediano} h (1.5 días)
                </td>
                <td className="p-2 text-center text-slate-500">Horas / Manual</td>
                <td className="p-2 text-right text-slate-700 text-[10px]">
                  {cantMedianosMes} manuales/mes = <strong>{horasMedianosMes}h en P&D</strong>
                </td>
              </tr>

              {/* Fila 6: Manual Grande */}
              <tr className="hover:bg-slate-50">
                <td className="p-2 text-slate-700">
                  Tiempo por Manual Grande (26 a 40 piezas)
                </td>
                <td className="p-2 text-center font-bold text-slate-900">
                  {horasGrande} h (2 días)
                </td>
                <td className="p-2 text-center text-slate-500">Horas / Manual</td>
                <td className="p-2 text-right text-slate-700 text-[10px]">
                  {cantGrandesMes} manuales/mes = <strong>{horasGrandesMes}h en P&D</strong>
                </td>
              </tr>

              {/* Fila 7: Volumen total de horas */}
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td className="p-2">Volumen total estimado de lanzamientos</td>
                <td className="p-2 text-center text-cyan-700">{manualesMes.toFixed(0)} Manuales / Mes</td>
                <td className="p-2 text-center">{horasTotalesMes} Horas / Mes</td>
                <td className="p-2 text-right text-slate-900">
                  Costo interno actual: <strong>R$ {costoManoObraMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mes</strong>
                </td>
              </tr>

              {/* Fila 8: Meta de Ahorro */}
              <tr className="bg-emerald-50/60 font-bold text-emerald-900">
                <td className="p-2">Meta de Ahorro Garantizado (Mario Mojica)</td>
                <td className="p-2 text-center bg-emerald-100 text-emerald-800 rounded font-extrabold">
                  {ahorroPct}% Ahorro Neto
                </td>
                <td className="p-2 text-center text-emerald-700">
                  +R$ {ahorroNetoAnual.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} / Año
                </td>
                <td className="p-2 text-right text-[10px] text-emerald-800">
                  Ahorro directo + reducción de llamadas SAC y garantías (-45%).
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Componentes Extras Añadibles */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700 text-[11px]">➕ Otros Componentes de Costo Añadibles:</span>
            <button
              onClick={addExtra}
              className="text-cyan-700 hover:text-cyan-800 font-bold text-[10px] flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200"
            >
              <Plus className="w-3 h-3" />
              <span>Agregar Componente</span>
            </button>
          </div>

          {extras.map(e => (
            <div key={e.id} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <input
                type="text"
                value={e.nombre}
                onChange={ev => updateExtra(e.id, "nombre", ev.target.value)}
                className="flex-1 text-[11px] font-medium bg-transparent px-1 outline-none border-b border-transparent focus:border-cyan-500"
                placeholder="Nombre del componente (ej. Impresión)"
              />
              <span className="text-[10px] text-slate-500">R$</span>
              <input
                type="number"
                value={e.costoMensual}
                onChange={ev => updateExtra(e.id, "costoMensual", Number(ev.target.value))}
                className="w-20 text-[11px] font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-cyan-500 text-right"
              />
              <span className="text-[10px] text-slate-500">/mes</span>
              <button
                onClick={() => removeExtra(e.id)}
                className="text-slate-400 hover:text-red-500 p-0.5"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Respaldo Técnico para la Conversación con Marcos */}
        <div className="bg-cyan-50/50 border border-cyan-200 rounded-xl p-2.5 text-[10px] space-y-1 text-slate-700">
          <span className="font-bold text-cyan-900 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            Estrategia de Gradualidad para Marcos:
          </span>
          <p className="text-slate-600">
            *"Marcos, no entraremos a reemplazar el 100% de la operación el día 1. Iniciamos con el piloto de 3 meses enfocado en los lanzamientos clave desde el SketchUp de Cintia, y gradualmente vamos absorbiendo volumen hasta consolidar el 30% de ahorro directo para toda la fábrica."*
          </p>
        </div>
      </div>
    </div>
  );
}
