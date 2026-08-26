"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calculator, TrendingDown, DollarSign, Sparkles, Check, RefreshCw } from "lucide-react";

export interface CostItem {
  id: string;
  categoria: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  frecuencia: "mensual" | "anual" | "por_mueble";
}

const DEFAULT_COST_ITEMS: CostItem[] = [
  {
    id: "item-1",
    categoria: "Mano de Obra P&D",
    descripcion: "Diseñador Técnico P&D (Salario CLT + Cargas Sociales)",
    cantidad: 1.1,
    unidad: "diseñadores",
    costoUnitario: 5700,
    frecuencia: "mensual"
  },
  {
    id: "item-2",
    categoria: "Licencias de Software",
    descripcion: "SketchUp Pro + Adobe Creative Cloud (InDesign/Illustrator)",
    cantidad: 2,
    unidad: "licencias",
    costoUnitario: 350,
    frecuencia: "mensual"
  },
  {
    id: "item-3",
    categoria: "Desarrollo de Manuales",
    descripcion: "Horas hombre dedicadas a manuales nuevos (16 lanzamientos/mes @ 11.5h)",
    cantidad: 184,
    unidad: "horas/mes",
    costoUnitario: 34.09,
    frecuencia: "mensual"
  },
  {
    id: "item-4",
    categoria: "Garantías y SAC",
    descripcion: "Horas de soporte técnico y llamadas de asistencia por dudas de montaje",
    cantidad: 25,
    unidad: "horas/mes",
    costoUnitario: 34.09,
    frecuencia: "mensual"
  }
];

export function InteractiveCostSheet({
  onSummaryChange
}: {
  onSummaryChange?: (summary: { costoHennMes: number; propuestaMarioMes: number; ahorroAnual: number; items: CostItem[] }) => void;
}) {
  const [items, setItems] = useState<CostItem[]>(DEFAULT_COST_ITEMS);
  const [porcentajeAhorro, setPorcentajeAhorro] = useState(30);

  // Cálculos automáticos
  const totalCostoHennMensual = items.reduce((acc, item) => {
    let mensual = 0;
    if (item.frecuencia === "mensual") {
      mensual = item.cantidad * item.costoUnitario;
    } else if (item.frecuencia === "anual") {
      mensual = (item.cantidad * item.costoUnitario) / 12;
    } else if (item.frecuencia === "por_mueble") {
      mensual = item.cantidad * item.costoUnitario * 16; // 16 muebles al mes
    }
    return acc + mensual;
  }, 0);

  const propuestaMarioMensual = totalCostoHennMensual * ((100 - porcentajeAhorro) / 100);
  const ahorroMensual = totalCostoHennMensual - propuestaMarioMensual;
  const ahorroAnual = ahorroMensual * 12;

  // Notificar cambio
  React.useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange({
        costoHennMes: totalCostoHennMensual,
        propuestaMarioMes: propuestaMarioMensual,
        ahorroAnual,
        items
      });
    }
  }, [items, porcentajeAhorro, totalCostoHennMensual, propuestaMarioMensual, ahorroAnual, onSummaryChange]);

  const updateItem = (id: string, field: keyof CostItem, value: any) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    const newItem: CostItem = {
      id: `item-${Date.now()}`,
      categoria: "Nuevo Costo",
      descripcion: "Descripción del componente (ej. Impresión, Render, etc.)",
      cantidad: 1,
      unidad: "unid",
      costoUnitario: 500,
      frecuencia: "mensual"
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const resetDefault = () => {
    setItems(DEFAULT_COST_ITEMS);
    setPorcentajeAhorro(30);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col gap-4 text-slate-800">
      {/* Encabezado con Indicadores KPI Principales */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg font-bold">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-lg text-slate-900">
              Matriz de Calibración de Costos P&D | Móveis Henn
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hoja de cálculo en vivo para validar componentes de costo con Marcos y estructurar el 30% de ahorro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetDefault}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
            title="Restablecer valores originales de la reunión"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            onClick={addItem}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Componente</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Comparación en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Costo Actual Henn */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500">Costo Actual Interno Henn:</span>
          <div className="mt-1">
            <span className="text-xl md:text-2xl font-black text-slate-900">
              R$ {totalCostoHennMensual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500 block">/ mes (R$ {(totalCostoHennMensual * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / año)</span>
          </div>
        </div>

        {/* Propuesta Mario Mojica */}
        <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-900">Propuesta Mario Mojica:</span>
            <span className="bg-cyan-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              -{porcentajeAhorro}% Ahorro
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xl md:text-2xl font-black text-cyan-700">
              R$ {propuestaMarioMensual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-cyan-800 block">/ mes (R$ {(propuestaMarioMensual * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / año)</span>
          </div>
        </div>

        {/* Ahorro Neto Anual */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Ahorro Neto Anual para Henn:</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <span className="text-xl md:text-2xl font-black text-emerald-600">
              +R$ {ahorroAnual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-emerald-700 block">+R$ {ahorroMensual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} cada mes liberados</span>
          </div>
        </div>
      </div>

      {/* Tabla Tipo Excel Editable */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
              <th className="p-3">Categoría / Concepto</th>
              <th className="p-3">Detalle / Descripción</th>
              <th className="p-3 text-center">Cantidad</th>
              <th className="p-3 text-center">Unidad</th>
              <th className="p-3 text-right">Costo Unitario (R$)</th>
              <th className="p-3 text-right">Subtotal / Mes (R$)</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {items.map((item, idx) => {
              const subtotal = item.cantidad * item.costoUnitario;
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  {/* Categoría */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={item.categoria}
                      onChange={e => updateItem(item.id, "categoria", e.target.value)}
                      className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 focus:bg-white px-1 py-0.5 rounded outline-none"
                    />
                  </td>

                  {/* Descripción */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={e => updateItem(item.id, "descripcion", e.target.value)}
                      className="w-full text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 focus:bg-white px-1 py-0.5 rounded outline-none"
                    />
                  </td>

                  {/* Cantidad */}
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      value={item.cantidad}
                      onChange={e => updateItem(item.id, "cantidad", parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:bg-white px-1.5 py-0.5 rounded outline-none"
                    />
                  </td>

                  {/* Unidad */}
                  <td className="p-2.5 text-center">
                    <input
                      type="text"
                      value={item.unidad}
                      onChange={e => updateItem(item.id, "unidad", e.target.value)}
                      className="w-24 text-center text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 px-1 py-0.5 rounded outline-none"
                    />
                  </td>

                  {/* Costo Unitario */}
                  <td className="p-2.5 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={item.costoUnitario}
                      onChange={e => updateItem(item.id, "costoUnitario", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:bg-white px-2 py-0.5 rounded outline-none"
                    />
                  </td>

                  {/* Subtotal Mensual */}
                  <td className="p-2.5 text-right font-extrabold text-slate-900">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Eliminar */}
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <td colSpan={5} className="p-3 text-right">TOTAL MENSUAL P&D HENN:</td>
              <td className="p-3 text-right text-cyan-700 text-sm">
                R$ {totalCostoHennMensual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Barra de Control del % de Ahorro */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Porcentaje de Ahorro Garantizado:</span>
          <div className="flex items-center gap-1.5">
            {[20, 25, 30, 35, 40].map(pct => (
              <button
                key={pct}
                onClick={() => setPorcentajeAhorro(pct)}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  porcentajeAhorro === pct
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="text-slate-500 italic text-[11px]">
          * Garantía de 30% acordada en la reunión del 26 de agosto para la propuesta ante la Junta Directiva.
        </div>
      </div>
    </div>
  );
}
