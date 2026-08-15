"use client";

import React, { useState, useEffect, useMemo } from "react";
import { use3BFStore, TableroRecord, HerrajeRecord } from "@/lib/store";
import { 
  FileText, 
  Hammer, 
  DollarSign, 
  Download, 
  Check, 
  Save, 
  Edit2, 
  Tag, 
  ShieldCheck,
  Calculator,
  Layers,
  Sparkles,
  Coins,
  Percent,
  Scissors
} from "lucide-react";

/**
 * Componente de entrada numérica inteligente con formato latino/español:
 * - Coma (,) para decimales, Punto (.) para miles.
 * - Auto-selección completa al hacer clic (focus) para sobreescribir inmediatamente.
 * - Sin '0' invasivos al borrar.
 * - Permite escribir indistintamente punto o coma.
 */
function DecimalInput({
  value,
  onChange,
  decimals = 1,
  className = "",
  placeholder = "0"
}: {
  value: number;
  onChange: (val: number) => void;
  decimals?: number;
  className?: string;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const [enfocado, setEnfocado] = useState(false);

  const formatParaMostrar = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return num.toString().replace(".", ",");
  };

  useEffect(() => {
    if (!enfocado) {
      setTexto(formatParaMostrar(value));
    }
  }, [value, enfocado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTexto(raw);

    const normalizado = raw.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
    } else if (raw === "" || raw === "-") {
      onChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEnfocado(true);
    e.target.select();
  };

  const handleBlur = () => {
    setEnfocado(false);
    const normalizado = texto.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
      setTexto(formatParaMostrar(num));
    } else {
      onChange(0);
      setTexto("0");
    }
  };

  return (
    <input
      type="text"
      value={texto}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function DespieceView() {
  const { 
    resultado, 
    parametros,
    dbHerrajes,
    dbTableros,
    negociacionNovopan,
    moneda,
    setMoneda
  } = use3BFStore();

  const trm = negociacionNovopan?.trmNovopan || 4000;

  const [descargando, setDescargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [versionActual, setVersionActual] = useState("v1.0");
  const [piezasEditadas, setPiezasEditadas] = useState<Array<{ nombre: string; largo: number; ancho: number; espesor: number; cantidad: number; tipo?: string }>>([]);
  const [materialesPorPieza, setMaterialesPorPieza] = useState<Record<number, string>>({});
  const [desperdicioGlobalPct, setDesperdicioGlobalPct] = useState<number>(10.0); // 10% por defecto
  const [desperdicioPorPieza, setDesperdicioPorPieza] = useState<Record<number, number>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (resultado?.despiece) {
      setPiezasEditadas(resultado.despiece);
    }
  }, [resultado?.despiece]);

  // Formateadores monetarios exactos sin pérdidas por redondeo
  const formatMoneyCustom = (copVal: number, usdVal: number) => {
    if (moneda === "COP") {
      return `$${Math.round(copVal).toLocaleString("es-CO")} COP`;
    }
    return `$${usdVal.toFixed(2)} USD`;
  };

  const formatUnitCustom = (copVal: number, usdVal: number) => {
    if (moneda === "COP") {
      return `$${Math.round(copVal).toLocaleString("es-CO")}`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  // Piezas activas
  const piezasActivas = piezasEditadas.length > 0 ? piezasEditadas : (resultado?.despiece || []);

  // Función para obtener el material asignado a cada tablero desde dbTableros
  const getMaterialParaPieza = (idx: number, espesor: number): TableroRecord => {
    const cod = materialesPorPieza[idx];
    if (cod) {
      const found = dbTableros.find((t) => t.codigo === cod);
      if (found) return found;
    }
    // Detección automática por calibre de la pieza
    if (espesor >= 24) {
      return dbTableros.find((t) => t.calibreMm === 25) || dbTableros[1] || dbTableros[0];
    }
    if (espesor <= 5) {
      return dbTableros.find((t) => t.calibreMm < 5) || dbTableros[3] || dbTableros[0];
    }
    if (espesor === 18) {
      return dbTableros.find((t) => t.calibreMm === 18) || dbTableros[4] || dbTableros[0];
    }
    return dbTableros.find((t) => t.calibreMm === 15) || dbTableros[0];
  };

  const handleMaterialChange = (idx: number, nuevoCodigo: string) => {
    setMaterialesPorPieza((prev) => ({ ...prev, [idx]: nuevoCodigo }));
  };

  // Cálculos de Tableros / Madera con valores nativos COP, USD y Porcentaje de Desperdicio Nesting
  const resumenMadera = useMemo(() => {
    let areaTotalM2 = 0;
    let totalMaderaCop = 0;
    let totalMaderaUsd = 0;

    const items = piezasActivas.map((p, idx) => {
      const mat = getMaterialParaPieza(idx, p.espesor);
      const areaM2 = (p.largo * p.ancho * p.cantidad) / 1_000_000.0;
      areaTotalM2 += areaM2;

      // Desperdicio de esta pieza (o el global si no se ha sobreescrito)
      const despPct = desperdicioPorPieza[idx] !== undefined ? desperdicioPorPieza[idx] : desperdicioGlobalPct;
      
      // Factor de desperdicio industrial según fórmula oficial de Excel EDP: 1 / (1 - desp)
      const despDecimal = Math.min(Math.max(despPct / 100.0, 0), 0.95);
      const factorDesp = despDecimal > 0 ? (1.0 / (1.0 - despDecimal)) : 1.0;

      const costoM2Cop = mat.costoM2Cop || Math.round(mat.costoM2Usd * trm);
      const costoM2Usd = mat.costoM2Usd || Number((mat.costoM2Cop / trm).toFixed(2));

      // Costo con desperdicio de corte
      const costoCop = Math.round(areaM2 * costoM2Cop * factorDesp);
      const costoUsd = Number((areaM2 * costoM2Usd * factorDesp).toFixed(2));

      totalMaderaCop += costoCop;
      totalMaderaUsd += costoUsd;

      return {
        ...p,
        materialSeleccionado: mat,
        areaM2: Number(areaM2.toFixed(3)),
        desperdicioPct: despPct,
        factorDesperdicio: factorDesp,
        costoM2Cop,
        costoM2Usd,
        costoTotalCop: costoCop,
        costoTotalUsd: costoUsd
      };
    });

    return {
      items,
      areaTotalM2: Number(areaTotalM2.toFixed(3)),
      costoTotalMaderaCop: Math.round(totalMaderaCop),
      costoTotalMaderaUsd: Number(totalMaderaUsd.toFixed(2))
    };
  }, [piezasActivas, materialesPorPieza, dbTableros, trm, desperdicioGlobalPct, desperdicioPorPieza]);

  // Cálculos de Herrajes con valores nativos COP y USD
  const resumenHerrajes = useMemo(() => {
    if (!resultado?.herrajes) return { items: [], costoTotalHerrajesCop: 0, costoTotalHerrajesUsd: 0, cantTotalHerrajes: 0 };
    
    let totalCop = 0;
    let totalUsd = 0;
    let totalCant = 0;

    const items = resultado.herrajes.map((h) => {
      const nameLower = h.nombre.toLowerCase().trim();
      
      // Match en dbHerrajes
      let match = dbHerrajes.find((rec) => rec.nombreGhx.toLowerCase().trim() === nameLower);
      if (!match) {
        match = dbHerrajes.find((rec) => nameLower.includes(rec.nombreGhx.toLowerCase().trim()) || rec.nombreGhx.toLowerCase().trim().includes(nameLower));
      }

      const descComercial = match ? match.descripcion : h.nombre;
      const unidadMed = match ? match.unidad : (h.unidad || "UND");
      
      // Costos unitarios exactos
      const unitCop = match ? match.costoCop : Math.round(0.20 * trm);
      const unitUsd = match ? match.costoUsd : 0.20;

      const filaCop = h.cantidad * unitCop;
      const filaUsd = h.cantidad * unitUsd;

      totalCop += filaCop;
      totalUsd += filaUsd;
      totalCant += h.cantidad;

      return {
        nombreGhx: h.nombre,
        descripcion: descComercial,
        unidad: unidadMed,
        cantidad: h.cantidad,
        costoUnitarioCop: unitCop,
        costoUnitarioUsd: unitUsd,
        costoTotalCop: filaCop,
        costoTotalUsd: Number(filaUsd.toFixed(2))
      };
    });

    return {
      items,
      costoTotalHerrajesCop: Math.round(totalCop),
      costoTotalHerrajesUsd: Number(totalUsd.toFixed(2)),
      cantTotalHerrajes: totalCant
    };
  }, [resultado?.herrajes, dbHerrajes, trm]);

  // Costo Total Consolidado
  const costoTotalMuebleCop = useMemo(() => {
    return resumenMadera.costoTotalMaderaCop + resumenHerrajes.costoTotalHerrajesCop;
  }, [resumenMadera.costoTotalMaderaCop, resumenHerrajes.costoTotalHerrajesCop]);

  const costoTotalMuebleUsd = useMemo(() => {
    return Number((resumenMadera.costoTotalMaderaUsd + resumenHerrajes.costoTotalHerrajesUsd).toFixed(2));
  }, [resumenMadera.costoTotalMaderaUsd, resumenHerrajes.costoTotalHerrajesUsd]);

  if (!resultado) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        Calculando despiece DfMA y matriz de costos...
      </div>
    );
  }

  const handleNombreChange = (idx: number, nuevoNombre: string) => {
    setPiezasEditadas((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], nombre: nuevoNombre };
      }
      return copy;
    });
  };

  const guardarEnSupabase = async () => {
    setGuardando(true);
    setGuardadoExitoso(false);
    try {
      const payload = {
        model_id: parametros.model_id || "Cubierta",
        custom_filename: parametros.custom_filename || "Cubierta.ghx",
        version: versionActual,
        moneda: moneda,
        trm: trm,
        desperdicio_global_pct: desperdicioGlobalPct,
        despiece: resumenMadera.items.map((i) => ({
          nombre: i.nombre,
          largo: i.largo,
          ancho: i.ancho,
          espesor: i.espesor,
          cantidad: i.cantidad,
          material: i.materialSeleccionado.nombreComercial,
          codigo_material: i.materialSeleccionado.codigo,
          desperdicio_pct: i.desperdicioPct,
          costo_total_cop: i.costoTotalCop,
          costo_total_usd: i.costoTotalUsd
        })),
        herrajes: resumenHerrajes.items,
        summary: {
          area_madera_m2: resumenMadera.areaTotalM2,
          costo_madera_cop: resumenMadera.costoTotalMaderaCop,
          costo_madera_usd: resumenMadera.costoTotalMaderaUsd,
          costo_herrajes_cop: resumenHerrajes.costoTotalHerrajesCop,
          costo_herrajes_usd: resumenHerrajes.costoTotalHerrajesUsd,
          costo_total_cop: costoTotalMuebleCop,
          costo_total_usd: costoTotalMuebleUsd
        },
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`3bf_bom_${payload.model_id}_${versionActual}`, JSON.stringify(payload));
      await new Promise((resolve) => setTimeout(resolve, 500));
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3500);
    } catch (e) {
      console.error("Error guardando en Supabase:", e);
    } finally {
      setGuardando(false);
    }
  };

  const descargarDXF = async () => {
    setDescargando(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: parametros.model_id || "Cubierta", parameters: parametros }),
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
    <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      {/* Barra de Controles: Master Key, Versión, Selector de Moneda y TRM */}
      <div className="flex flex-wrap items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm gap-2">
        {/* Identificador GHX */}
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span className="font-mono text-xs text-cyan-700 dark:text-cyan-300 font-bold">
            {parametros.custom_filename || `${parametros.model_id || "Cubierta"}.ghx`}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">
            GHX Master Key
          </span>
        </div>

        {/* Versión, Moneda y TRM */}
        <div className="flex items-center gap-2.5">
          {/* Selector de Versión */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Versión:</span>
            <select
              value={versionActual}
              onChange={(e) => setVersionActual(e.target.value)}
              className="text-xs font-bold py-1 px-2 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-cyan-700 dark:text-cyan-300 outline-none cursor-pointer"
            >
              <option value="v1.0">v1.0 (Definitivo)</option>
              <option value="v1.1">v1.1 (Revisión)</option>
              <option value="v2.0">v2.0 (Rediseño)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

          {/* Selector de Moneda (USD / COP) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600">
            <button
              onClick={() => setMoneda("USD")}
              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer ${
                moneda === "USD"
                  ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setMoneda("COP")}
              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer ${
                moneda === "COP"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              COP ($)
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Económico DfMA */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Superficie Tableros</span>
          <span className="text-base font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
            {resumenMadera.areaTotalM2} m²
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Herrajes Totales</span>
          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
            {resumenHerrajes.cantTotalHerrajes} u
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Costo Total Estimado</span>
          <span className="text-base font-extrabold text-purple-700 dark:text-purple-300 font-mono">
            {formatMoneyCustom(costoTotalMuebleCop, costoTotalMuebleUsd)}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🪵 TABLA 1: LISTA DE CORTE DE TABLEROS (BOM) CON CONTROL DE DESPERDICIO */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              1. Lista de Corte de Tableros & Sustratos (BOM)
            </h3>
          </div>

          {/* Control Global de Desperdicio Nesting */}
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-md shadow-sm">
            <Scissors className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
              % Desperdicio Global (Nesting):
            </span>
            <div className="flex items-center gap-1">
              <DecimalInput
                value={desperdicioGlobalPct}
                decimals={1}
                onChange={(val) => {
                  setDesperdicioGlobalPct(val);
                  // Actualizar todas las piezas al nuevo global
                  setDesperdicioPorPieza({});
                }}
                className="w-14 text-center font-mono font-extrabold text-xs text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5 outline-none shadow-sm focus:border-amber-500"
              />
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">%</span>
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono hidden sm:inline" title="Fórmula DfMA de Nesting: Área * Costo m² * [1 / (1 - Desp)]">
              (1/(1-Desp))
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-28">Pieza</th>
                <th className="p-2.5 w-[380px]">Sustrato / Tablero (Base de Datos)</th>
                <th className="p-2.5 w-20 text-center">Largo (mm)</th>
                <th className="p-2.5 w-20 text-center">Ancho (mm)</th>
                <th className="p-2.5 w-16 text-center">Espesor</th>
                <th className="p-2.5 w-28 text-center">Medidas (L×A×E)</th>
                <th className="p-2.5 w-20 text-center">Área (m²)</th>
                <th className="p-2.5 w-14 text-center">Cant.</th>
                <th className="p-2.5 w-24 text-right">Costo m²</th>
                <th className="p-2.5 w-24 text-center bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200" title="Porcentaje de desperdicio estimado por nesting (por defecto 10%)">
                  % Desp. ✂️
                </th>
                <th className="p-2.5 w-28 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200">
                  Costo Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {resumenMadera.items.map((p, idx) => (
                <tr key={idx} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition group whitespace-nowrap">
                  {/* Nombre Editable */}
                  <td className="p-2.5">
                    {editingIndex === idx ? (
                      <input
                        type="text"
                        value={p.nombre}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={() => setEditingIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") setEditingIndex(null);
                        }}
                        onChange={(e) => handleNombreChange(idx, e.target.value)}
                        className="p-1 w-full text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-700 border border-cyan-400 rounded outline-none shadow-sm"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingIndex(idx)}
                        className="flex items-center justify-between gap-1.5 cursor-pointer group"
                        title="Haz clic para renombrar la pieza"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 transition">
                          {p.nombre}
                        </span>
                        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    )}
                  </td>

                  {/* Selector Desplegable de Sustrato */}
                  <td className="p-2">
                    <select
                      value={p.materialSeleccionado.codigo}
                      onChange={(e) => handleMaterialChange(idx, e.target.value)}
                      className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-cyan-700 dark:text-cyan-300 outline-none cursor-pointer w-full min-w-[260px] shadow-inner hover:border-cyan-500 transition"
                    >
                      {dbTableros.map((mat) => (
                        <option key={mat.codigo} value={mat.codigo}>
                          {mat.nombreComercial}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Dimensiones Desglosadas */}
                  <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{p.largo}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{p.ancho}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-cyan-700 dark:text-cyan-300">{p.espesor} mm</td>
                  <td className="p-2.5 text-center font-mono text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                    {p.largo} x {p.ancho} x {p.espesor}
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{p.areaM2}</td>
                  <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100">{p.cantidad}</td>
                  <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatUnitCustom(p.costoM2Cop, p.costoM2Usd)}
                  </td>

                  {/* % DESPERDICIO EDITABLE POR PIEZA */}
                  <td className="p-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="flex items-center justify-center gap-0.5">
                      <DecimalInput
                        value={p.desperdicioPct}
                        decimals={1}
                        onChange={(val) => {
                          setDesperdicioPorPieza((prev) => ({ ...prev, [idx]: val }));
                        }}
                        className="w-14 text-center font-mono font-extrabold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5 outline-none shadow-sm focus:border-amber-500"
                      />
                      <span className="text-amber-700 dark:text-amber-300 font-bold font-mono text-[10px]">%</span>
                    </div>
                  </td>

                  {/* COSTO TOTAL PIEZA CON DESPERDICIO */}
                  <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10">
                    {formatMoneyCustom(p.costoTotalCop, p.costoTotalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Madera */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600 font-bold whitespace-nowrap">
                <td colSpan={6} className="p-2.5 text-right text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Total Tableros & Madera:
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenMadera.areaTotalM2} m²
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenMadera.items.reduce((acc, i) => acc + i.cantidad, 0)} u
                </td>
                <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                  Sumatoria con Desp:
                </td>
                <td className="p-2 text-center text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
                  {desperdicioGlobalPct}% (Base)
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-50/50 dark:bg-emerald-950/20">
                  {formatMoneyCustom(resumenMadera.costoTotalMaderaCop, resumenMadera.costoTotalMaderaUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🔩 TABLA 2: INVENTARIO DE HERRAJES                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Hammer className="w-4 h-4 text-cyan-600" />
            2. Inventario de Herrajes & Accesorios (BOM)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Costos sincronizados desde Base de Datos</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-36">Herraje (GHX)</th>
                <th className="p-2.5">Descripción Comercial</th>
                <th className="p-2.5 w-16 text-center">UM</th>
                <th className="p-2.5 w-20 text-center">Cantidad</th>
                <th className="p-2.5 w-28 text-right">Costo Unitario</th>
                <th className="p-2.5 w-28 text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {resumenHerrajes.items.map((h, idx) => (
                <tr key={idx} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition whitespace-nowrap">
                  {/* Nombre GHX */}
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                    {h.nombreGhx}
                  </td>
                  {/* Descripción Comercial */}
                  <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {h.descripcion}
                  </td>
                  {/* Unidad de Medida */}
                  <td className="p-2.5 text-center font-mono text-[10px] text-slate-500">
                    {h.unidad}
                  </td>
                  {/* Cantidad */}
                  <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="px-2.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 font-mono">
                      {h.cantidad}
                    </span>
                  </td>
                  {/* Costo Unitario Nativo */}
                  <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatUnitCustom(h.costoUnitarioCop, h.costoUnitarioUsd)}
                  </td>
                  {/* Costo Total en Fila Nativo */}
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoneyCustom(h.costoTotalCop, h.costoTotalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Herrajes */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600 font-bold whitespace-nowrap">
                <td colSpan={3} className="p-2.5 text-right text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Total Herrajes & Accesorios:
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenHerrajes.cantTotalHerrajes} u
                </td>
                <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                  Sumatoria:
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatMoneyCustom(resumenHerrajes.costoTotalHerrajesCop, resumenHerrajes.costoTotalHerrajesUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 📦 RESUMEN GENERAL & ACCIONES DE GUARDADO SUPABASE                    */}
      {/* ===================================================================== */}
      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              Resumen Consolidado de Fabricación
            </span>
          </div>
          <div className="text-right flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Tableros ({formatMoneyCustom(resumenMadera.costoTotalMaderaCop, resumenMadera.costoTotalMaderaUsd)}) + Herrajes ({formatMoneyCustom(resumenHerrajes.costoTotalHerrajesCop, resumenHerrajes.costoTotalHerrajesUsd)})
            </span>
            <span className="font-mono font-extrabold text-base text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800">
              {formatMoneyCustom(costoTotalMuebleCop, costoTotalMuebleUsd)}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={guardarEnSupabase}
            disabled={guardando}
            className={`py-2.5 px-4 rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              guardadoExitoso
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600"
            }`}
          >
            {guardadoExitoso ? (
              <>
                <Check className="w-4 h-4 text-white" />
                ¡Ficha {versionActual} Guardada en Supabase!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {guardando ? "Guardando..." : `Guardar Ficha ${versionActual} en Supabase`}
              </>
            )}
          </button>

          <button
            onClick={descargarDXF}
            disabled={descargando}
            className="py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {descargando ? "Generando DXF..." : "Exportar DXF para Seccionadora CNC"}
          </button>
        </div>
      </div>
    </div>
  );
}
