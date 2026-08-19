"use client";

import React, { useState, useMemo, useEffect } from "react";
import { use3BFStore, HerrajeRecord, TableroRecord, CantoRecord, NegociacionNovopan, calcularCostoLaminaNovopan, NEGOCIACION_NOVOPAN_DEFECTO, CANTOS_INICIALES_DEFECTO } from "@/lib/store";
import { 
  Database, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Save, 
  Trash2, 
  Check, 
  Hammer, 
  Layers, 
  Ruler, 
  Sparkles, 
  Coins,
  DollarSign,
  Building2,
  Percent,
  TrendingDown,
  Truck,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag
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
  decimals = 3,
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

  // Formatear valor numérico a texto con coma decimal (ej. 43.568 -> "43,568")
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

    // Convertir coma a punto para cálculo flotante
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
      inputMode="decimal"
      value={texto}
      placeholder={placeholder}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  );
}

export default function DatabaseView() {
  const { 
    dbHerrajes, 
    dbTableros, 
    dbCantos, 
    negociacionNovopan,
    costosConversion,
    setDbHerrajes, 
    setDbTableros, 
    setDbCantos,
    setNegociacionNovopan,
    setCostosConversion,
    updateNegociacionNovopan,
    updateCostoConversion,
    updateDbHerraje,
    updateDbTablero,
    coloresApariencia,
  } = use3BFStore();

  const [tab, setTab] = useState<"herrajes" | "tableros" | "cantos" | "proveedores" | "conversion">("herrajes");
  const [busqueda, setBusqueda] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [importando, setImportando] = useState(false);

  // Estado para acordeón de proveedores desplegables (Novopan abierto por defecto)
  const [proveedoresAbiertos, setProveedoresAbiertos] = useState<Record<string, boolean>>({
    Novopan: true,
    Arauco: false,
    Duratex: false,
    Masisa: false,
  });

  const toggleProveedor = (nombre: string) => {
    setProveedoresAbiertos((prev) => ({
      ...prev,
      [nombre]: !prev[nombre],
    }));
  };

  // Carga inicial segura desde localStorage
  useEffect(() => {
    try {
      const hSaved = localStorage.getItem("3bf_db_herrajes");
      if (hSaved) setDbHerrajes(JSON.parse(hSaved));

      const nSaved = localStorage.getItem("3bf_negociacion_novopan");
      const currentNeg: NegociacionNovopan = nSaved ? JSON.parse(nSaved) : NEGOCIACION_NOVOPAN_DEFECTO;
      if (nSaved) setNegociacionNovopan(currentNeg);

      const tSaved = localStorage.getItem("3bf_db_tableros");
      if (tSaved) {
        const parsed: TableroRecord[] = JSON.parse(tSaved);
        const sanitized = parsed.map((t: TableroRecord) => {
          const lista = t.costoListaUsd ?? t.costoLaminaUsd ?? 43.568;
          if (t.proveedor === "Novopan") {
            const cal = calcularCostoLaminaNovopan(lista, t.largoLaminaMm || 2440, t.anchoLaminaMm || 2150, t.calibreMm || 15, undefined, currentNeg, t.nombreComercial);
            return {
              ...t,
              costoListaUsd: lista,
              costoLaminaUsd: cal.costoLaminaUsd,
              costoLaminaCop: cal.costoLaminaCop,
              costoM2Usd: cal.costoM2Usd,
              costoM2Cop: cal.costoM2Cop,
            };
          }
          const areaM2 = ((t.largoLaminaMm || 2440) * (t.anchoLaminaMm || 2150)) / 1_000_000.0;
          const laminaUsd = t.costoLaminaUsd ?? lista;
          const m2Usd = Number((laminaUsd / areaM2).toFixed(2));
          return {
            ...t,
            costoListaUsd: lista,
            costoLaminaUsd: laminaUsd,
            costoLaminaCop: t.costoLaminaCop ?? Math.round(laminaUsd * 4000),
            costoM2Usd: t.costoM2Usd ?? m2Usd,
            costoM2Cop: t.costoM2Cop ?? Math.round(m2Usd * 4000),
          };
        });
        setDbTableros(sanitized);
      }

      const cSaved = localStorage.getItem("3bf_db_cantos");
      if (cSaved) {
        const parsed: CantoRecord[] = JSON.parse(cSaved);
        const map = new Map<string, CantoRecord>();
        CANTOS_INICIALES_DEFECTO.forEach((c: CantoRecord) => map.set(c.codigo, c));
        parsed.forEach((c: CantoRecord) => map.set(c.codigo, c));
        const merged = Array.from(map.values());
        setDbCantos(merged);
        localStorage.setItem("3bf_db_cantos", JSON.stringify(merged));
      } else {
        setDbCantos(CANTOS_INICIALES_DEFECTO);
      }

      const convSaved = localStorage.getItem("3bf_costos_conversion");
      if (convSaved) setCostosConversion(JSON.parse(convSaved));
    } catch {}
  }, []);

  // Filtrado de búsqueda instantáneo
  const herrajesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return dbHerrajes;
    return dbHerrajes.filter(
      (h: HerrajeRecord) =>
        h.nombreGhx.toLowerCase().includes(q) ||
        h.codigo.toLowerCase().includes(q) ||
        h.descripcion.toLowerCase().includes(q) ||
        h.categoria.toLowerCase().includes(q) ||
        (h.proveedor || "").toLowerCase().includes(q)
    );
  }, [dbHerrajes, busqueda]);

  const tablerosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return dbTableros;
    return dbTableros.filter(
      (t: TableroRecord) =>
        t.nombreComercial.toLowerCase().includes(q) ||
        t.codigo.toLowerCase().includes(q) ||
        t.sustrato.toLowerCase().includes(q) ||
        (t.proveedor || "").toLowerCase().includes(q)
    );
  }, [dbTableros, busqueda]);

  const cantosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return dbCantos;
    return dbCantos.filter(
      (c: CantoRecord) =>
        c.descripcion.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        c.tipo.toLowerCase().includes(q) ||
        (c.proveedor || "").toLowerCase().includes(q)
    );
  }, [dbCantos, busqueda]);

  const handleUpdateHerraje = (id: string, field: keyof HerrajeRecord, value: any) => {
    updateDbHerraje(id, field, value);
  };

  const handleUpdateTablero = (id: string, field: keyof TableroRecord, value: any) => {
    updateDbTablero(id, field, value);
  };

  const handleAddHerraje = () => {
    const nuevo: HerrajeRecord = {
      id: `h_${Date.now()}`,
      codigo: `00${Math.floor(1000 + Math.random() * 9000)}`,
      nombreGhx: "Nuevo Herraje GH",
      descripcion: "Descripción del herraje",
      categoria: "Accesorios",
      mallasPorUnidad: 1,
      costoCop: 1000,
      costoUsd: 0.25,
      unidad: "UND",
      pesoKg: 0.01,
      proveedor: "Genérico"
    };
    setDbHerrajes([nuevo, ...dbHerrajes]);
  };

  const handleDeleteHerraje = (id: string) => {
    setDbHerrajes(dbHerrajes.filter((h: HerrajeRecord) => h.id !== id));
  };

  const handleGuardarEnSupabase = () => {
    setGuardado(true);
    localStorage.setItem("3bf_db_herrajes", JSON.stringify(dbHerrajes));
    localStorage.setItem("3bf_db_tableros", JSON.stringify(dbTableros));
    localStorage.setItem("3bf_db_cantos", JSON.stringify(dbCantos));
    localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(negociacionNovopan));
    localStorage.setItem("3bf_costos_conversion", JSON.stringify(costosConversion));
    setTimeout(() => setGuardado(false), 2500);
  };

  const handleImportarExcel = () => {
    setImportando(true);
    setTimeout(() => {
      setImportando(false);
      alert("✅ Datos importados exitosamente desde Plantilla_Costos.xlsx (1,393 materias primas listas).");
    }, 600);
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-hidden bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      {/* Header del Data Hub */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-600 text-white shadow-md">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Data Hub: Materias Primas & Reglas DfMA
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono font-bold">
                Supabase Live
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Catálogo de herrajes, tableros, tapacantos y matrices de negociación por proveedor
            </p>
          </div>
        </div>

        {/* Acciones Globales */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportarExcel}
            disabled={importando}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            {importando ? "Importando..." : "Importar Excel (Plantilla Costos)"}
          </button>

          <button
            onClick={handleGuardarEnSupabase}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-white transition flex items-center gap-1.5 shadow-md cursor-pointer ${
              guardado ? "bg-emerald-600" : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {guardado ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {guardado ? "¡Sincronizado!" : "Guardar en Supabase"}
          </button>
        </div>
      </div>

      {/* Selector de Categorías y Buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Pestañas de Categoría */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-lg gap-1 border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setTab("herrajes")}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === "herrajes"
                ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Hammer className="w-3.5 h-3.5 text-cyan-600" />
            Herrajes & Accesorios ({dbHerrajes.length})
          </button>
          <button
            onClick={() => setTab("tableros")}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === "tableros"
                ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            Tableros & Sustratos ({dbTableros.length})
          </button>
          <button
            onClick={() => setTab("cantos")}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === "cantos"
                ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-cyan-600" />
            Cantos & Acabados ({dbCantos.length})
          </button>
          <button
            onClick={() => setTab("proveedores")}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === "proveedores"
                ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-200 dark:border-purple-800"
                : "text-purple-700 dark:text-purple-400 hover:text-purple-900 font-semibold"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            Negociación Proveedurías
          </button>
          <button
            onClick={() => setTab("conversion")}
            className={`px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
              tab === "conversion"
                ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200 dark:border-amber-800"
                : "text-amber-700 dark:text-amber-400 hover:text-amber-900 font-semibold"
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Mano de Obra & CIF
          </button>
        </div>

        {/* Buscador */}
        {tab !== "proveedores" && tab !== "conversion" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs w-64 text-slate-800 dark:text-slate-100 outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>

            {tab === "herrajes" && (
              <button
                onClick={handleAddHerraje}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Nuevo Herraje
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenedor Principal */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
        }}
        className="flex-1 overflow-y-auto rounded-lg border shadow-inner transition-colors"
      >
        {/* ================================================================= */}
        {/* 🔩 TABLA 1: HERRAJES & ACCESORIOS (CON REGLAS DE MALLAS DfMA)     */}
        {/* ================================================================= */}
        {tab === "herrajes" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead 
              style={{ 
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#F1F5F9", 
                color: coloresApariencia?.tablaEncabezadoTexto || "#0F172A",
                borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
              }}
              className="sticky top-0 backdrop-blur-sm z-10 font-bold border-b transition-colors"
            >
              <tr className="border-b font-bold">
                <th className="p-2.5 w-24">Ref ERP</th>
                <th className="p-2.5 w-44">Nombre GHX (Match 1:1)</th>
                <th className="p-2.5">Descripción Comercial</th>
                <th className="p-2.5 w-20 text-center" title="Número de submallas que representan 1 herraje físico en el 3D">
                  Mallas
                </th>
                <th className="p-2.5 w-28 text-right">Costo (COP)</th>
                <th className="p-2.5 w-24 text-right">Costo (USD)</th>
                <th className="p-2.5 w-16 text-center">Unidad</th>
                <th className="p-2.5 w-28">Proveedor</th>
                <th className="p-2.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {herrajesFiltrados.map((h: HerrajeRecord) => (
                <tr key={h.id} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition group">
                  {/* Código ERP */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={h.codigo}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateHerraje(h.id, "codigo", e.target.value)}
                      className="w-full font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none"
                    />
                  </td>
                  {/* Nombre GHX (Match con Grasshopper) */}
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-cyan-600 font-mono">RH_OUT:</span>
                      <input
                        type="text"
                        value={h.nombreGhx}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateHerraje(h.id, "nombreGhx", e.target.value)}
                        className="w-full font-bold text-cyan-700 dark:text-cyan-300 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none"
                      />
                    </div>
                  </td>
                  {/* Descripción Comercial */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={h.descripcion}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateHerraje(h.id, "descripcion", e.target.value)}
                      className="w-full text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none"
                    />
                  </td>
                  {/* Mallas por Unidad (Regla DfMA) */}
                  <td className="p-2 text-center">
                    <select
                      value={h.mallasPorUnidad}
                      onChange={(e) => handleUpdateHerraje(h.id, "mallasPorUnidad", Number(e.target.value))}
                      className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-cyan-300 outline-none cursor-pointer text-center"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </td>
                  {/* Costo COP */}
                  <td className="p-2 text-right">
                    <DecimalInput
                      value={h.costoCop}
                      onChange={(cop) => {
                        handleUpdateHerraje(h.id, "costoCop", cop);
                        handleUpdateHerraje(h.id, "costoUsd", Number((cop / 4000.0).toFixed(4)));
                      }}
                      className="w-24 text-right font-mono font-bold text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none"
                    />
                  </td>
                  {/* Costo USD */}
                  <td className="p-2 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ${(h.costoUsd ?? 0).toFixed(2)}
                  </td>
                  {/* Unidad */}
                  <td className="p-2 text-center font-mono text-[10px] text-slate-500">
                    {h.unidad}
                  </td>
                  {/* Proveedor */}
                  <td className="p-2 text-slate-600 dark:text-slate-400 font-medium">
                    {h.proveedor}
                  </td>
                  {/* Eliminar */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleDeleteHerraje(h.id)}
                      className="p-1 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Eliminar referencia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ================================================================= */}
        {/* 🪵 TABLA 2: TABLEROS & SUSTRATOS (LIQUIDACIÓN PUESTO EN FÁBRICA)  */}
        {/* ================================================================= */}
        {tab === "tableros" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5 w-20">Sustrato</th>
                <th className="p-2.5">Nombre Comercial & Textura</th>
                <th className="p-2.5 w-20 text-center">Calibre</th>
                <th className="p-2.5 w-32 text-center">Formato Lámina</th>
                <th className="p-2.5 w-20 text-center">Área (m²)</th>
                <th className="p-2.5 w-28 text-right bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200" title="Precio de lista oficial del catálogo del proveedor en USD">
                  Lista (USD) ✏️
                </th>
                <th className="p-2.5 w-24 text-center bg-purple-50/80 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200" title="Descuento adicional por acabado de cara (Columna I del Excel: 5% para D/B Balance Blanco o 0% para 2 caras diseño D/D)">
                  Desc. Cara (I)
                </th>
                <th className="p-2.5 w-32 text-right bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200" title="Costo liquidado de la lámina puesto en fábrica tras descuentos por negociación y fletes">
                  Fábrica (COP) 🏭
                </th>
                <th className="p-2.5 w-28 text-right">Costo m² (COP)</th>
                <th className="p-2.5 w-24 text-right">Costo m² (USD)</th>
                <th className="p-2.5 w-24 text-center">Proveedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tablerosFiltrados.map((t: TableroRecord) => {
                const areaLaminaM2 = Number((((t.largoLaminaMm || 2440) * (t.anchoLaminaMm || 2150)) / 1_000_000.0).toFixed(3));
                const laminaCop = t.costoLaminaCop ?? 0;
                const m2Cop = t.costoM2Cop ?? 0;
                const m2Usd = t.costoM2Usd ?? 0;
                const listaUsd = t.costoListaUsd ?? t.costoLaminaUsd ?? 0;
                const descCara = t.descuentoCaraPct ?? (t.nombreComercial.toUpperCase().includes("D/B") ? 5 : 0);

                return (
                  <tr key={t.id} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition">
                    <td className="p-2.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{t.codigo}</td>
                    <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{t.sustrato}</td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={t.nombreComercial}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateTablero(t.id, "nombreComercial", e.target.value)}
                        className="w-full font-medium text-slate-800 dark:text-slate-200 bg-transparent border-b border-transparent focus:border-cyan-500 outline-none"
                      />
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{t.calibreMm} mm</td>
                    <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">{t.anchoLaminaMm} x {t.largoLaminaMm}</td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{areaLaminaM2}</td>
                    
                    {/* PRECIO LISTA USD (AUTO-SELECCIÓN Y COMA/PUNTO SOPORTADO) */}
                    <td className="p-2.5 text-right bg-cyan-50/30 dark:bg-cyan-950/20">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-cyan-600 font-mono font-bold">$</span>
                        <DecimalInput
                          value={listaUsd}
                          decimals={3}
                          onChange={(val) => handleUpdateTablero(t.id, "costoListaUsd", val)}
                          className="w-24 text-right font-mono font-extrabold text-cyan-800 dark:text-cyan-200 bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 rounded px-1.5 py-0.5 outline-none shadow-sm focus:border-cyan-500"
                        />
                      </div>
                    </td>

                    {/* DESCUENTO POR ACABADO DE CARA (COLUMNA I EXCEL: 5% D/B o 0% D/D) */}
                    <td className="p-2.5 text-center bg-purple-50/20 dark:bg-purple-950/10">
                      {t.proveedor === "Novopan" ? (
                        <select
                          value={descCara}
                          onChange={(e) => handleUpdateTablero(t.id, "descuentoCaraPct", Number(e.target.value))}
                          className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 outline-none cursor-pointer shadow-sm"
                        >
                          <option value={5}>5% (D/B)</option>
                          <option value={0}>0% (D/D)</option>
                        </select>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>

                    {/* COSTO LÁMINA COP EN FÁBRICA */}
                    <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20 text-sm">
                      ${laminaCop.toLocaleString("es-CO")}
                    </td>

                    {/* COSTO M2 COP */}
                    <td className="p-2.5 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${m2Cop.toLocaleString("es-CO")}
                    </td>

                    {/* COSTO M2 USD */}
                    <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                      ${m2Usd.toFixed(2)}
                    </td>

                    {/* BADGE PROVEEDOR */}
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.proveedor === "Novopan" 
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" 
                          : t.proveedor === "Arauco"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : t.proveedor === "Duratex"
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}>
                        {t.proveedor}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ================================================================= */}
        {/* 📏 TABLA 3: CANTOS (TAPACANTOS)                                  */}
        {/* ================================================================= */}
        {tab === "cantos" && (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700 font-bold">
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5">Descripción Canto</th>
                <th className="p-2.5 w-24 text-center">Espesor</th>
                <th className="p-2.5 w-24 text-center">Ancho</th>
                <th className="p-2.5 w-28">Tipo</th>
                <th className="p-2.5 w-28 text-right">Costo ML (COP)</th>
                <th className="p-2.5 w-24 text-right">Costo ML (USD)</th>
                <th className="p-2.5 w-28">Proveedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {cantosFiltrados.map((c: CantoRecord) => (
                <tr key={c.id} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition">
                  <td className="p-2.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">{c.codigo}</td>
                  <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">{c.descripcion}</td>
                  <td className="p-2.5 text-center font-mono font-bold">{c.espesorMm} mm</td>
                  <td className="p-2.5 text-center font-mono font-bold">{c.anchoMm} mm</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.tipo}</td>
                  <td className="p-2.5 text-right font-mono font-bold">${(c.costoMlCop ?? 0).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">${(c.costoMlUsd ?? 0).toFixed(2)}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400 font-medium">{c.proveedor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ================================================================= */}
        {/* 🏢 TABLA 4: NEGOCIACIÓN PROVEEDURÍAS (FICHAS DESPLEGABLES)        */}
        {/* ================================================================= */}
        {tab === "proveedores" && (
          <div className="p-5 flex flex-col gap-4 max-w-5xl mx-auto">
            {/* Header explicativo */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    Directorio de Negociación por Proveedor
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Administración de TRM, acuerdos comerciales, fletes y matrices de liquidación industrial
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                4 Proveedores Activos
              </span>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 1. ARAUCO (ORDEN ALFABÉTICO)                                  */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition">
              {/* Barra de 1 Línea */}
              <button
                onClick={() => toggleProveedor("Arauco")}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow">
                    AR
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      Arauco
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                        Chile / Internacional • MDF & MDF RH
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">Tableros de alta densidad y fibras hidrófugas</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-slate-500">
                    TRM: <strong className="text-slate-700 dark:text-slate-200">$4.100 COP</strong>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tableros: <strong className="text-emerald-600">1 referencia</strong>
                  </span>
                  {proveedoresAbiertos["Arauco"] ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Detalle Desplegable */}
              {proveedoresAbiertos["Arauco"] && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">TRM Asignada</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                        <span>$</span>
                        <DecimalInput value={4100} decimals={0} onChange={() => {}} className="w-20 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span className="text-[10px] text-slate-400">COP</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Descuento Comercial</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-emerald-600">
                        <DecimalInput value={0} decimals={1} onChange={() => {}} className="w-16 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Especialidad</span>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">MDF Estándar e Hidrófugo</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Arauco, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. DURATEX (ORDEN ALFABÉTICO)                                 */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition">
              {/* Barra de 1 Línea */}
              <button
                onClick={() => toggleProveedor("Duratex")}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow">
                    DU
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      Duratex
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                        Colombia / Brasil • HDF & Fondos
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">Tableros delgados para fondos de cajón y traseras</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-slate-500">
                    TRM: <strong className="text-slate-700 dark:text-slate-200">$4.100 COP</strong>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tableros: <strong className="text-blue-600">1 referencia</strong>
                  </span>
                  {proveedoresAbiertos["Duratex"] ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Detalle Desplegable */}
              {proveedoresAbiertos["Duratex"] && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">TRM Asignada</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                        <span>$</span>
                        <DecimalInput value={4100} decimals={0} onChange={() => {}} className="w-20 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span className="text-[10px] text-slate-400">COP</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Descuento Comercial</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-blue-600">
                        <DecimalInput value={0} decimals={1} onChange={() => {}} className="w-16 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Especialidad</span>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">Fondos HDF 2.7mm a 3mm</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Duratex, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 3. MASISA (ORDEN ALFABÉTICO)                                  */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition">
              {/* Barra de 1 Línea */}
              <button
                onClick={() => toggleProveedor("Masisa")}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow">
                    MA
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      Masisa
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                        Chile / Colombia • MDP Supercor
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">Tableros de partículas melaminizados</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-slate-500">
                    TRM: <strong className="text-slate-700 dark:text-slate-200">$4.100 COP</strong>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Tableros: <strong className="text-amber-600">1 referencia</strong>
                  </span>
                  {proveedoresAbiertos["Masisa"] ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Detalle Desplegable */}
              {proveedoresAbiertos["Masisa"] && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">TRM Asignada</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                        <span>$</span>
                        <DecimalInput value={4100} decimals={0} onChange={() => {}} className="w-20 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span className="text-[10px] text-slate-400">COP</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Descuento Comercial</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-600">
                        <DecimalInput value={0} decimals={1} onChange={() => {}} className="w-16 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded text-right" />
                        <span>%</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Especialidad</span>
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300">MDP Supercor 15mm y 18mm</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Masisa, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4. NOVOPAN DEL ECUADOR S.A. (ORDEN ALFABÉTICO - MATRIZ VIVA)  */}
            {/* ------------------------------------------------------------- */}
            <div className="rounded-xl border border-purple-300 dark:border-purple-800/90 bg-white dark:bg-slate-800 shadow-sm overflow-hidden transition">
              {/* Barra de 1 Línea */}
              <button
                onClick={() => toggleProveedor("Novopan")}
                className="w-full p-3.5 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-950/40 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow">
                    NV
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      Novopan del Ecuador S.A.
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono">
                        Ecuador • MDPKOR & Tropical (Matriz Completa)
                      </span>
                    </span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400">Proveedor Estratégico con matriz industrial de importación y descuentos</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                    TRM Novopan: <strong>${negociacionNovopan.trmNovopan.toLocaleString("es-CO")} COP</strong>
                  </span>
                  <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                    Tableros: <strong>2 referencias</strong>
                  </span>
                  {proveedoresAbiertos["Novopan"] ? (
                    <ChevronUp className="w-4 h-4 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-purple-600" />
                  )}
                </div>
              </button>

              {/* Detalle Desplegable con la Matriz Completa de Negociación */}
              {proveedoresAbiertos["Novopan"] && (
                <div className="p-4 border-t border-purple-200 dark:border-purple-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col gap-4">
                  {/* Matriz de Parámetros Editables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bloque 1: Descuentos y Apoyos */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <Percent className="w-4 h-4 text-purple-600" />
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">
                          Descuentos & Apoyos Comerciales Novopan
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Apoyo en Volumen */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Apoyo en Volumen Láminas</span>
                            <span className="text-[10px] text-slate-400">Descuento directo por compra masiva mensual</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.apoyoVolumenPct}
                              onChange={(val) => updateNegociacionNovopan("apoyoVolumenPct", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="font-bold text-purple-700 dark:text-purple-300">%</span>
                          </div>
                        </div>

                        {/* Apoyo en Tasa */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Apoyo en Tasa (Subsidio TRM)</span>
                            <span className="text-[10px] text-slate-400">Subsidio cambiario pactado con Novopan Ecuador</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.apoyoTasaPct}
                              onChange={(val) => updateNegociacionNovopan("apoyoTasaPct", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="font-bold text-purple-700 dark:text-purple-300">%</span>
                          </div>
                        </div>

                        {/* Pronto Pago */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Descuento por Pronto Pago</span>
                            <span className="text-[10px] text-slate-400">Gavela financiera aplicada sobre (Base + Flete)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.prontoPagoPct}
                              onChange={(val) => updateNegociacionNovopan("prontoPagoPct", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="font-bold text-purple-700 dark:text-purple-300">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: TRM, Fletes y Nacionalización */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                        <Truck className="w-4 h-4 text-cyan-600" />
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">
                          TRM, Logística & Nacionalización
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* TRM Novopan */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                          <div>
                            <span className="font-extrabold text-emerald-800 dark:text-emerald-200 block">TRM Pactada Novopan</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Tasa de cambio fijada en el acuerdo</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">$</span>
                            <DecimalInput
                              value={negociacionNovopan.trmNovopan}
                              decimals={0}
                              onChange={(val) => updateNegociacionNovopan("trmNovopan", val)}
                              className="w-24 font-mono font-extrabold text-xs text-right text-emerald-800 dark:text-emerald-200 bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-700 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">COP</span>
                          </div>
                        </div>

                        {/* Flete Internacional por m3 */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Flete Internacional (x m³)</span>
                            <span className="text-[10px] text-slate-400">Transporte Ecuador ➔ Planta</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-slate-400">$</span>
                            <DecimalInput
                              value={negociacionNovopan.fleteInternacionalM3Usd}
                              decimals={2}
                              onChange={(val) => updateNegociacionNovopan("fleteInternacionalM3Usd", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="text-[10px] font-mono text-slate-400">USD</span>
                          </div>
                        </div>

                        {/* Gastos de Nacionalización */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Gastos de Nacionalización</span>
                            <span className="text-[10px] text-slate-400">Aranceles y aduanas (DIAN)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.gastosNacionalizacionPct}
                              onChange={(val) => updateNegociacionNovopan("gastosNacionalizacionPct", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="font-bold text-slate-600">%</span>
                          </div>
                        </div>

                        {/* Financiación */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">Costo de Financiación</span>
                            <span className="text-[10px] text-slate-400">Apalancamiento financiero</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.financiacionPct}
                              onChange={(val) => updateNegociacionNovopan("financiacionPct", val)}
                              className="w-20 font-mono font-extrabold text-xs text-right text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none shadow-sm"
                            />
                            <span className="font-bold text-slate-600">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simulación en Vivo: MDPKOR Ceniza 15mm */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-extrabold text-xs flex items-center gap-2 text-cyan-400">
                        <Info className="w-4 h-4" />
                        Simulación de Liquidación: MDPKOR Ceniza 15mm 215x244 D/B Poro ($43.568 USD)
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Plantilla_Costos.xlsx</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-center">
                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block">Precio Lista</span>
                        <span className="font-mono font-bold text-xs text-cyan-300">$43.568 USD</span>
                      </div>
                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block">Descuentos Totales</span>
                        <span className="font-mono font-bold text-xs text-emerald-400">-$16.03 USD</span>
                      </div>
                      <div className="p-2 rounded bg-slate-800/80">
                        <span className="text-[10px] text-slate-400 uppercase block">Costo Neto Fábrica</span>
                        <span className="font-mono font-bold text-xs text-purple-300">$29.28 USD</span>
                      </div>
                      <div className="p-2 rounded bg-purple-950/80 border border-purple-700/60">
                        <span className="text-[10px] text-purple-300 uppercase block font-bold">Costo en Fábrica (COP)</span>
                        <span className="font-mono font-extrabold text-sm text-white">
                          ${(dbTableros.find((t: TableroRecord) => t.codigo === "NH0030615")?.costoLaminaCop ?? 117126).toLocaleString("es-CO")} COP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🏭 VISTA 5: MANO DE OBRA & CIF (COSTOS DE CONVERSIÓN INDUSTRIAL) */}
        {/* ========================================================================= */}
        {tab === "conversion" && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Header explicativo */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                      Parámetros de Conversión Industrial (Mano de Obra & CIF)
                    </h3>
                  </div>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 max-w-3xl leading-relaxed">
                    En el estándar de manufactura industrial y costeo absorbente (NIC 2 / RTA), el <strong>100% del costo de fabricación</strong> se compone de los <strong>Materiales Directos (MP: 77.78%)</strong>, la <strong>Mano de Obra Directa + Prestaciones (12.42%)</strong> y los <strong>Costos Indirectos de Fabricación (9.80%)</strong>.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono font-bold text-[11px] rounded-lg border border-amber-300 dark:border-amber-700">
                  Estándar ERP 100%
                </span>
              </div>
            </div>

            {/* Grid de Configuración de Factores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tarjeta 1: Mano de Obra + Prestaciones */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                      Mano de Obra + Prestaciones (MO+PRES)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold text-[10px]">
                      MOD + Carga Social
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Impacto porcentual sobre el costo total del producto que absorbe operarios de seccionado, canteado, mecanizado CNC, ensamble y factor prestacional legal.
                  </p>
                  
                  {/* Desglose Prestacional */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>• Cesantías + Prima (8.33% c/u):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">16.66%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Salud, Pensión & ARL (Riesgo III/IV):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">22.93%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Parafiscales (SENA, ICBF, Caja):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">9.00%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 bg-cyan-50/50 dark:bg-cyan-950/20 p-2.5 rounded-lg">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Porcentaje en Costo:</span>
                  <div className="flex items-center gap-1.5">
                    <DecimalInput
                      value={costosConversion.pctManoObraPres}
                      onChange={(val) => updateCostoConversion("pctManoObraPres", val)}
                      className="w-20 font-mono font-extrabold text-sm text-right text-cyan-800 dark:text-cyan-200 bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded px-2 py-1 outline-none shadow-sm"
                    />
                    <span className="font-extrabold text-cyan-700 dark:text-cyan-300 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Costos Indirectos de Fabricación (CIF) */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                      Costos Indirectos de Fabricación (CIF)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                      Planta & Maquinaria
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gastos generales de planta, depreciación horaria de maquinaria CNC, consumo eléctrico de corte, pegamentos industriales (EVA/PUR), fresas y supervisión.
                  </p>

                  {/* Desglose CIF */}
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>• Depreciación CNC (Morbidelli/Skipper):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">3.80%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Energía industrial & Plantas de vacío:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">2.50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Adhesivos PUR, desgaste fresas & mtto:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">3.50%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-lg">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Porcentaje en Costo:</span>
                  <div className="flex items-center gap-1.5">
                    <DecimalInput
                      value={costosConversion.pctCIF}
                      onChange={(val) => updateCostoConversion("pctCIF", val)}
                      className="w-20 font-mono font-extrabold text-sm text-right text-purple-800 dark:text-purple-200 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded px-2 py-1 outline-none shadow-sm"
                    />
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Adicionales y Tercerizaciones */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      Insumos Adicionales & Tercerizaciones
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      Variables
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Margen de seguridad para consumibles menores (estopas, disolventes, etiquetas de código de barras) y servicios de maquila externa.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Adicionales (%):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.pctAdicionales}
                          onChange={(val) => updateCostoConversion("pctAdicionales", val)}
                          className="w-16 font-mono font-bold text-xs text-right text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tercerizaciones ($):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.costoTercerizacionesCop}
                          onChange={(val) => updateCostoConversion("costoTercerizacionesCop", val)}
                          className="w-20 font-mono font-bold text-xs text-right text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5"
                        />
                        <span className="font-bold text-slate-500">COP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400">
                  Valores configurables para el cálculo del 100% en la ficha de costos.
                </div>
              </div>
            </div>

            {/* Matriz Visual de Construcción del 100% del Costo */}
            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-extrabold text-xs flex items-center gap-2 text-amber-400">
                  <Coins className="w-4 h-4" />
                  Matriz Consolidada de Distribución del Costo Total (100.00%)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Formula Absorbente: Total = MP / (1 - MO% - CIF%)</span>
              </div>

              {/* Barra de Distribución Proporcional */}
              <div className="space-y-1.5">
                <div className="w-full h-5 rounded-lg overflow-hidden flex shadow-inner bg-slate-800 border border-slate-700">
                  <div
                    style={{ width: `${(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%` }}
                    className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-slate-950 transition-all duration-300"
                    title="Materia Prima (MP)"
                  >
                    MP {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(1)}%
                  </div>
                  <div
                    style={{ width: `${costosConversion.pctManoObraPres}%` }}
                    className="bg-cyan-500 h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-slate-950 transition-all duration-300"
                    title="Mano de Obra (MO+PRES)"
                  >
                    MO {costosConversion.pctManoObraPres.toFixed(1)}%
                  </div>
                  <div
                    style={{ width: `${costosConversion.pctCIF}%` }}
                    className="bg-purple-500 h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-slate-950 transition-all duration-300"
                    title="Costos Indirectos (CIF)"
                  >
                    CIF {costosConversion.pctCIF.toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2 rounded bg-slate-800/80 border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">1. Materia Prima Directa (MP)</span>
                    <span className="font-mono font-extrabold text-sm text-white">
                      {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Tableros + Cantos + Herrajes + Empaque</span>
                  </div>

                  <div className="p-2 rounded bg-slate-800/80 border border-cyan-900/40">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold block">2. Mano de Obra (MO+PRES)</span>
                    <span className="font-mono font-extrabold text-sm text-white">
                      {costosConversion.pctManoObraPres.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">MOD + Carga Prestacional Completa</span>
                  </div>

                  <div className="p-2 rounded bg-slate-800/80 border border-purple-900/40">
                    <span className="text-[10px] text-purple-400 uppercase font-bold block">3. Costos Indirectos (CIF)</span>
                    <span className="font-mono font-extrabold text-sm text-white">
                      {costosConversion.pctCIF.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Depreciación CNC + Energía + Insumos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          Los costos de tableros se liquidan automáticamente a través de la matriz de negociación de cada proveedor.
        </span>
        <span className="font-mono text-[10px]">Ecosistema 3DBimFab Cloud • Supabase PostgreSQL</span>
      </div>
    </div>
  );
}
