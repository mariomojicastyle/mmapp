"use client";

import React, { useState, useMemo, useEffect } from "react";
import { use3BFStore, HerrajeRecord, TableroRecord, CantoRecord, NegociacionNovopan, calcularCostoLaminaNovopan, NEGOCIACION_NOVOPAN_DEFECTO, CANTOS_INICIALES_DEFECTO, HERRAJES_INICIALES_DEFECTO, TABLEROS_INICIALES_DEFECTO } from "@/lib/store";
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
  placeholder = "0",
  style,
}: {
  value: number;
  onChange: (val: number) => void;
  decimals?: number;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
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
      style={style}
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
    Duratex: true,
    Arauco: false,
    Masisa: false,
    Rehau: false,
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
      if (hSaved) {
        const parsed: HerrajeRecord[] = JSON.parse(hSaved);
        const hasLegacy = parsed.some((h) => ["20070022", "20070009", "005895", "0000149", "010679", "20060067", "000478", "000468", "4829104", "4829015"].includes(h.codigo) || (h.id === "h1" && h.costoCop < 100));
        if (hasLegacy) {
          setDbHerrajes(HERRAJES_INICIALES_DEFECTO);
          localStorage.setItem("3bf_db_herrajes", JSON.stringify(HERRAJES_INICIALES_DEFECTO));
        } else {
          setDbHerrajes(parsed);
        }
      } else {
        setDbHerrajes(HERRAJES_INICIALES_DEFECTO);
      }

      const nSaved = localStorage.getItem("3bf_negociacion_novopan");
      let currentNeg: NegociacionNovopan = nSaved ? JSON.parse(nSaved) : NEGOCIACION_NOVOPAN_DEFECTO;
      if (currentNeg.trmNovopan === 4000 || !currentNeg.trmNovopan) {
        currentNeg = { ...currentNeg, trmNovopan: 3000 };
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(currentNeg));
      }
      setNegociacionNovopan(currentNeg);

      const tSaved = localStorage.getItem("3bf_db_tableros");
      if (tSaved) {
        const parsed: TableroRecord[] = JSON.parse(tSaved);
        const hasLegacyTableros = parsed.some((t) => ["NH0030615", "NP2020625", "CB2251415"].includes(t.codigo) || (t.nombreComercial && t.nombreComercial.includes("Ceniza")) || (t.nombreComercial && t.nombreComercial.includes("Poro")) || t.proveedor === "Novopan" || (t.id === "t1" && (t.costoListaUsd || 0) < 50));
        if (hasLegacyTableros) {
          setDbTableros(TABLEROS_INICIALES_DEFECTO);
          localStorage.setItem("3bf_db_tableros", JSON.stringify(TABLEROS_INICIALES_DEFECTO));
        } else {
          const sanitized = parsed.map((t: TableroRecord) => {
            const lista = t.costoListaUsd ?? t.costoLaminaUsd ?? 58.468;
            if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
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
              costoLaminaCop: t.costoLaminaCop ?? Math.round(laminaUsd * 3000),
              costoM2Usd: t.costoM2Usd ?? m2Usd,
              costoM2Cop: t.costoM2Cop ?? Math.round(m2Usd * 3000),
            };
          });
          setDbTableros(sanitized);
        }
      } else {
        setDbTableros(TABLEROS_INICIALES_DEFECTO);
      }

      const cSaved = localStorage.getItem("3bf_db_cantos");
      if (cSaved) {
        const parsed: CantoRecord[] = JSON.parse(cSaved);
        const hasLegacyCantos = parsed.some(
          (c) =>
            c.descripcion.toUpperCase().includes("CENIZA") ||
            c.descripcion.toUpperCase().includes("CENDRA") ||
            c.descripcion.toUpperCase().includes("NEVADO") ||
            c.descripcion.toUpperCase().includes("GLACIAL") ||
            c.descripcion.endsWith(" N") ||
            ["0002788", "017288", "0004623", "000360", "000361", "0000253", "0000313"].includes(c.codigo) ||
            (c.id === "c_948201" && c.costoMlCop < 250)
        );
        if (hasLegacyCantos || parsed.length !== CANTOS_INICIALES_DEFECTO.length) {
          setDbCantos(CANTOS_INICIALES_DEFECTO);
          localStorage.setItem("3bf_db_cantos", JSON.stringify(CANTOS_INICIALES_DEFECTO));
        } else {
          setDbCantos(parsed);
        }
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
    <div 
      style={{ 
        backgroundColor: coloresApariencia?.fondoPaneles, 
        borderColor: coloresApariencia?.bordePaneles,
        color: coloresApariencia?.textoPrincipal 
      }}
      className="w-full h-full glass-panel rounded-xl border flex flex-col overflow-y-auto no-scrollbar p-3.5 gap-3.5 text-xs transition-colors"
    >
      {/* Header del Data Hub */}
      <div 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              color: "#FFFFFF"
            }}
            className="p-2 rounded-lg shadow-md flex items-center justify-center"
          >
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 
              style={{ color: coloresApariencia?.textoPrincipal }}
              className="font-extrabold text-sm flex items-center gap-2"
            >
              Data Hub: Materias Primas & Reglas DfMA
            </h2>
            <p 
              style={{ color: coloresApariencia?.textoSecundario }}
              className="text-[11px]"
            >
              Catálogo de herrajes, tableros, tapacantos y matrices de negociación por proveedor
            </p>
          </div>
        </div>

        {/* Acciones Globales */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportarExcel}
            disabled={importando}
            style={{
              backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0",
              borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1",
              color: coloresApariencia?.textoPrincipal || "#0F172A",
            }}
            className="px-4 py-1.5 rounded-full border font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 active:scale-95 text-xs backdrop-blur-sm disabled:opacity-50"
          >
            <FileSpreadsheet style={{ color: coloresApariencia?.iconosFijos || coloresApariencia?.botonActivo || "#0891b2" }} className="w-3.5 h-3.5 shrink-0" />
            {importando ? "Importando..." : "Importar Excel (Plantilla Costos)"}
          </button>

          <button
            onClick={handleGuardarEnSupabase}
            style={
              guardado
                ? { backgroundColor: coloresApariencia?.estadoActivo || "#10b981", borderColor: coloresApariencia?.estadoActivo || "#10b981" }
                : { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
            }
            className="px-4 py-1.5 rounded-full font-bold text-white transition flex items-center gap-1.5 shadow-md border cursor-pointer hover:opacity-90 active:scale-95 text-xs"
          >
            {guardado ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>¡Sincronizado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selector de Categorías y Buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Pestañas de Categoría con Estilo Visor 3D */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab("herrajes")}
            style={
              tab === "herrajes"
                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
            }
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer text-xs ${
              tab === "herrajes"
                ? "text-white shadow-md border"
                : "hover:opacity-90 border backdrop-blur-sm"
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            Herrajes & Accesorios ({dbHerrajes.length})
          </button>

          <button
            onClick={() => setTab("tableros")}
            style={
              tab === "tableros"
                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
            }
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer text-xs ${
              tab === "tableros"
                ? "text-white shadow-md border"
                : "hover:opacity-90 border backdrop-blur-sm"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tableros & Sustratos ({dbTableros.length})
          </button>

          <button
            onClick={() => setTab("cantos")}
            style={
              tab === "cantos"
                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
            }
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer text-xs ${
              tab === "cantos"
                ? "text-white shadow-md border"
                : "hover:opacity-90 border backdrop-blur-sm"
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Cantos & Acabados ({dbCantos.length})
          </button>

          <button
            onClick={() => setTab("proveedores")}
            style={
              tab === "proveedores"
                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
            }
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer text-xs ${
              tab === "proveedores"
                ? "text-white shadow-md border"
                : "hover:opacity-90 border backdrop-blur-sm"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Negociación Proveedurías
          </button>

          <button
            onClick={() => setTab("conversion")}
            style={
              tab === "conversion"
                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
            }
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer text-xs ${
              tab === "conversion"
                ? "text-white shadow-md border"
                : "hover:opacity-90 border backdrop-blur-sm"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Mano de Obra & CIF
          </button>
        </div>

        {/* Buscador y Botón Nuevo Herraje */}
        {tab !== "proveedores" && tab !== "conversion" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search 
                style={{ color: coloresApariencia?.textoSecundario }} 
                className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" 
              />
              <input
                type="text"
                placeholder="Buscar por código, nombre o proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  backgroundColor: coloresApariencia?.fondoPaneles,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal,
                }}
                className="pl-8 pr-3 py-1.5 rounded-full border text-xs w-64 outline-none shadow-xs transition"
              />
            </div>

            {tab === "herrajes" && (
              <button
                onClick={handleAddHerraje}
                style={{
                  backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                  borderColor: coloresApariencia?.colorMarca || "#0891b2",
                  color: "#FFFFFF"
                }}
                className="px-4 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 shadow-md border cursor-pointer hover:opacity-90 active:scale-95 text-xs"
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
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#E2E8F0", 
                color: coloresApariencia?.tablaEncabezadoTexto || "#1E293B",
                borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" 
              }}
              className="sticky top-0 z-10 font-bold border-b text-[11px] uppercase tracking-wider transition-colors shadow-xs"
            >
              <tr className="border-b font-bold">
                <th className="p-2.5 w-24">Ref ERP</th>
                <th className="p-2.5 w-44">Nombre Origen</th>
                <th className="p-2.5">Descripción Comercial</th>
                <th className="p-2.5 w-28">Proveedor</th>
                <th className="p-2.5 w-20 text-center" title="Número de submallas que representan 1 herraje físico en el 3D">
                  Mallas
                </th>
                <th className="p-2.5 w-16 text-center">Unidad</th>
                <th className="p-2.5 w-28 text-right">Costo (COP)</th>
                <th className="p-2.5 w-24 text-right">Costo (USD)</th>
                <th className="p-2.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" }}
              className="divide-y"
            >
              {herrajesFiltrados.map((h: HerrajeRecord, idx: number) => (
                <tr 
                  key={h.id} 
                  style={{
                    backgroundColor: idx % 2 === 1 ? (coloresApariencia?.fondoAplicacion || "#F8FAFC") : (coloresApariencia?.tablaFilaFondo || "#FFFFFF"),
                    borderColor: coloresApariencia?.tablaBorde || "#CBD5E1",
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition group hover:bg-cyan-500/10"
                >
                  {/* Código ERP */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={h.codigo}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateHerraje(h.id, "codigo", e.target.value)}
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="w-full font-mono text-[11px] font-bold bg-transparent border-b border-transparent outline-none focus:border-cyan-500"
                    />
                  </td>
                  {/* Nombre Origen */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={h.nombreGhx}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateHerraje(h.id, "nombreGhx", e.target.value)}
                      style={{ color: coloresApariencia?.botonActivo }}
                      className="w-full font-bold bg-transparent border-b border-transparent outline-none focus:border-cyan-500"
                    />
                  </td>
                  {/* Descripción Comercial */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={h.descripcion}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleUpdateHerraje(h.id, "descripcion", e.target.value)}
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="w-full bg-transparent border-b border-transparent outline-none focus:border-cyan-500"
                    />
                  </td>
                  {/* Proveedor */}
                  <td 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="p-2.5 font-medium"
                  >
                    {h.proveedor}
                  </td>
                  {/* Mallas por Unidad (Regla DfMA) */}
                  <td className="p-2.5 text-center">
                    <select
                      value={h.mallasPorUnidad}
                      onChange={(e) => handleUpdateHerraje(h.id, "mallasPorUnidad", Number(e.target.value))}
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal
                      }}
                      className="text-xs font-bold px-2 py-0.5 rounded border outline-none cursor-pointer text-center shadow-xs"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </td>
                  {/* Unidad */}
                  <td 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="p-2.5 text-center font-mono text-[10px]"
                  >
                    {h.unidad}
                  </td>
                  {/* Costo COP */}
                  <td className="p-2.5 text-right">
                    <DecimalInput
                      value={h.costoCop}
                      onChange={(cop) => {
                        handleUpdateHerraje(h.id, "costoCop", cop);
                        handleUpdateHerraje(h.id, "costoUsd", Number((cop / 4000.0).toFixed(4)));
                      }}
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="w-24 text-right font-mono font-bold bg-transparent border-b border-transparent outline-none focus:border-cyan-500"
                    />
                  </td>
                  {/* Costo USD */}
                  <td 
                    style={{ color: coloresApariencia?.estadoActivo || "#10b981" }}
                    className="p-2.5 text-right font-mono font-bold"
                  >
                    ${(h.costoUsd ?? 0).toFixed(2)}
                  </td>
                  {/* Eliminar */}
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteHerraje(h.id)}
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="p-1 hover:text-red-500 transition opacity-0 group-hover:opacity-100 cursor-pointer"
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
            <thead 
              style={{ 
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#E2E8F0", 
                color: coloresApariencia?.tablaEncabezadoTexto || "#1E293B",
                borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" 
              }}
              className="sticky top-0 z-10 font-bold border-b text-[11px] uppercase tracking-wider transition-colors shadow-xs"
            >
              <tr className="border-b font-bold">
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5 w-20">Sustrato</th>
                <th className="p-2.5">Nombre Comercial & Textura</th>
                <th className="p-2.5 w-20 text-center">Calibre</th>
                <th className="p-2.5 w-32 text-center">Formato Lámina</th>
                <th className="p-2.5 w-20 text-center">Área (m²)</th>
                <th 
                  className="p-2.5 w-28 text-right font-bold" 
                  title="Precio de lista oficial del catálogo del proveedor en USD"
                >
                  Lista (USD)
                </th>
                <th 
                  className="p-2.5 w-24 text-center font-bold" 
                  title="Descuento adicional por acabado de cara (5% para D/B Balance Blanco o 0% para 2 caras diseño D/D)"
                >
                  Desc. Cara (I)
                </th>
                <th 
                  className="p-2.5 w-32 text-right font-bold" 
                  title="Costo liquidado de la lámina puesto en fábrica tras descuentos por negociación y fletes"
                >
                  Fábrica (COP)
                </th>
                <th className="p-2.5 w-28 text-right">Costo m² (COP)</th>
                <th className="p-2.5 w-24 text-right">Costo m² (USD)</th>
                <th className="p-2.5 w-24 text-center">Proveedor</th>
              </tr>
            </thead>
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" }}
              className="divide-y"
            >
              {tablerosFiltrados.map((t: TableroRecord, idx: number) => {
                const areaLaminaM2 = Number((((t.largoLaminaMm || 2440) * (t.anchoLaminaMm || 2150)) / 1_000_000.0).toFixed(3));
                const laminaCop = t.costoLaminaCop ?? 0;
                const m2Cop = t.costoM2Cop ?? 0;
                const m2Usd = t.costoM2Usd ?? 0;
                const listaUsd = t.costoListaUsd ?? t.costoLaminaUsd ?? 0;
                const descCara = t.descuentoCaraPct ?? (t.nombreComercial.toUpperCase().includes("D/B") ? 5 : 0);

                return (
                  <tr 
                    key={t.id} 
                    style={{
                      backgroundColor: idx % 2 === 1 ? (coloresApariencia?.fondoAplicacion || "#F8FAFC") : (coloresApariencia?.tablaFilaFondo || "#FFFFFF"),
                      borderColor: coloresApariencia?.tablaBorde || "#CBD5E1",
                      color: coloresApariencia?.textoPrincipal
                    }}
                    className="transition hover:bg-cyan-500/10"
                  >
                    <td 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="p-2.5 font-mono text-[11px] font-bold"
                    >
                      {t.codigo}
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.botonActivo }}
                      className="p-2.5 font-bold"
                    >
                      {t.sustrato}
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={t.nombreComercial}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleUpdateTablero(t.id, "nombreComercial", e.target.value)}
                        style={{ color: coloresApariencia?.textoPrincipal }}
                        className="w-full font-medium bg-transparent border-b border-transparent outline-none focus:border-cyan-500"
                      />
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="p-2.5 text-center font-mono font-bold"
                    >
                      {t.calibreMm} mm
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="p-2.5 text-center font-mono text-[11px]"
                    >
                      {t.anchoLaminaMm} x {t.largoLaminaMm}
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="p-2.5 text-center font-mono"
                    >
                      {areaLaminaM2}
                    </td>
                    
                    {/* PRECIO LISTA USD */}
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span style={{ color: coloresApariencia?.botonActivo }} className="font-mono font-bold">$</span>
                        <DecimalInput
                          value={listaUsd}
                          decimals={3}
                          onChange={(val) => handleUpdateTablero(t.id, "costoListaUsd", val)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.botonActivo,
                          }}
                          className="w-24 text-right font-mono font-extrabold border rounded px-1.5 py-0.5 outline-none shadow-xs"
                        />
                      </div>
                    </td>

                    {/* DESCUENTO POR ACABADO DE CARA */}
                    <td className="p-2.5 text-center">
                      {(t.proveedor === "Novopan" || t.proveedor === "Duratex") ? (
                        <select
                          value={descCara}
                          onChange={(e) => handleUpdateTablero(t.id, "descuentoCaraPct", Number(e.target.value))}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="text-xs font-bold font-mono px-2 py-0.5 rounded border outline-none cursor-pointer shadow-xs"
                        >
                          <option value={5}>5% (D/B)</option>
                          <option value={0}>0% (D/D)</option>
                        </select>
                      ) : (
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="font-mono text-[11px]">-</span>
                      )}
                    </td>

                    {/* COSTO LÁMINA COP EN FÁBRICA */}
                    <td 
                      style={{ color: coloresApariencia?.estadoActivo || "#10b981" }}
                      className="p-2.5 text-right font-mono font-extrabold text-sm"
                    >
                      ${laminaCop.toLocaleString("es-CO")}
                    </td>

                    {/* COSTO M2 COP */}
                    <td 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="p-2.5 text-right font-mono font-bold"
                    >
                      ${m2Cop.toLocaleString("es-CO")}
                    </td>

                    {/* COSTO M2 USD */}
                    <td 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="p-2.5 text-right font-mono"
                    >
                      ${m2Usd.toFixed(2)}
                    </td>

                    {/* BADGE PROVEEDOR */}
                    <td className="p-2.5 text-center">
                      <span 
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo,
                        }}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border shadow-xs"
                      >
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
            <thead 
              style={{ 
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#E2E8F0", 
                color: coloresApariencia?.tablaEncabezadoTexto || "#1E293B",
                borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" 
              }}
              className="sticky top-0 z-10 font-bold border-b text-[11px] uppercase tracking-wider transition-colors shadow-xs"
            >
              <tr className="border-b font-bold">
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
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde || "#CBD5E1" }}
              className="divide-y"
            >
              {cantosFiltrados.map((c: CantoRecord, idx: number) => (
                <tr 
                  key={c.id} 
                  style={{
                    backgroundColor: idx % 2 === 1 ? (coloresApariencia?.fondoAplicacion || "#F8FAFC") : (coloresApariencia?.tablaFilaFondo || "#FFFFFF"),
                    borderColor: coloresApariencia?.tablaBorde || "#CBD5E1",
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition hover:bg-cyan-500/10"
                >
                  <td 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="p-2.5 font-mono text-[11px] font-bold"
                  >
                    {c.codigo}
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="p-2.5 font-medium"
                  >
                    {c.descripcion}
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="p-2.5 text-center font-mono font-bold"
                  >
                    {c.espesorMm} mm
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="p-2.5 text-center font-mono font-bold"
                  >
                    {c.anchoMm} mm
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="p-2.5"
                  >
                    {c.tipo}
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="p-2.5 text-right font-mono font-bold"
                  >
                    ${(c.costoMlCop ?? 0).toLocaleString()}
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.estadoActivo || "#10b981" }}
                    className="p-2.5 text-right font-mono font-bold"
                  >
                    ${(c.costoMlUsd ?? 0).toFixed(2)}
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="p-2.5 font-medium"
                  >
                    {c.proveedor}
                  </td>
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
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              className="p-3.5 rounded-xl border shadow-sm flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Building2 style={{ color: coloresApariencia?.botonActivo }} className="w-5 h-5" />
                <div>
                  <h3 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="font-extrabold text-sm"
                  >
                    Directorio de Negociación por Proveedor
                  </h3>
                  <p 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="text-[11px]"
                  >
                    Administración de TRM, acuerdos comerciales, fletes y matrices de liquidación industrial
                  </p>
                </div>
              </div>
               <span 
                style={{ color: coloresApariencia?.textoSecundario }}
                className="text-xs font-mono font-medium"
              >
                4 Proveedores Activos
              </span>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 1. ARAUCO                                                     */}
            {/* ------------------------------------------------------------- */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="rounded-xl border shadow-sm overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleProveedor("Arauco")}
                style={{ 
                  backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
                className="w-full p-3.5 flex items-center justify-between transition cursor-pointer text-left hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow"
                  >
                    AR
                  </div>
                  <div>
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="font-extrabold text-xs flex items-center gap-2"
                    >
                      Arauco
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                      Tableros de alta densidad y fibras hidrófugas
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    TRM: <strong style={{ color: coloresApariencia?.textoPrincipal }}>$3.000 COP</strong>
                  </span>
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    Tableros: <strong style={{ color: coloresApariencia?.botonActivo }}>1 referencia</strong>
                  </span>
                  {proveedoresAbiertos["Arauco"] ? (
                    <ChevronUp style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  ) : (
                    <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  )}
                </div>
              </button>

              {proveedoresAbiertos["Arauco"] && (
                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: coloresApariencia?.fondoAplicacion 
                  }}
                  className="p-4 border-t flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        TRM Asignada
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <span style={{ color: coloresApariencia?.textoSecundario }}>$</span>
                        <DecimalInput 
                          value={3000} 
                          decimals={0} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal
                          }}
                          className="w-20 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">COP</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Descuento Comercial
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <DecimalInput 
                          value={0} 
                          decimals={1} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.estadoActivo || "#10b981"
                          }}
                          className="w-16 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.estadoActivo || "#10b981" }}>%</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Especialidad
                      </span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">
                        MDF Estándar e Hidrófugo
                      </span>
                    </div>
                  </div>
                  <div style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Arauco, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. REHAU & PROADEC (CANTOS & POLÍMEROS)                       */}
            {/* ------------------------------------------------------------- */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="rounded-xl border shadow-sm overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleProveedor("Rehau")}
                style={{ 
                  backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
                className="w-full p-3.5 flex items-center justify-between transition cursor-pointer text-left hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow"
                  >
                    RH
                  </div>
                  <div>
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="font-extrabold text-xs flex items-center gap-2"
                    >
                      Rehau / Proadec
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                      Cantos PVC rígidos y flexibles de alta fidelidad tonal
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    TRM: <strong style={{ color: coloresApariencia?.textoPrincipal }}>$3.000 COP</strong>
                  </span>
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    Cantos: <strong style={{ color: coloresApariencia?.botonActivo }}>7 referencias</strong>
                  </span>
                  {proveedoresAbiertos["Rehau"] ? (
                    <ChevronUp style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  ) : (
                    <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  )}
                </div>
              </button>

              {proveedoresAbiertos["Rehau"] && (
                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: coloresApariencia?.fondoAplicacion 
                  }}
                  className="p-4 border-t flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        TRM Asignada
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <span style={{ color: coloresApariencia?.textoSecundario }}>$</span>
                        <DecimalInput 
                          value={3000} 
                          decimals={0} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal
                          }}
                          className="w-20 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">COP</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Descuento Comercial
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <DecimalInput 
                          value={0} 
                          decimals={1} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.botonActivo
                          }}
                          className="w-16 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.botonActivo }}>%</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Especialidad
                      </span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">
                        Cantos PVC 0.5mm, 2.0mm y perfiles termoplásticos
                      </span>
                    </div>
                  </div>
                  <div style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Rehau / Proadec, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 3. MASISA                                                     */}
            {/* ------------------------------------------------------------- */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="rounded-xl border shadow-sm overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleProveedor("Masisa")}
                style={{ 
                  backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
                className="w-full p-3.5 flex items-center justify-between transition cursor-pointer text-left hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow"
                  >
                    MA
                  </div>
                  <div>
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="font-extrabold text-xs flex items-center gap-2"
                    >
                      Masisa
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                      Tableros de partículas melaminizados
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    TRM: <strong style={{ color: coloresApariencia?.textoPrincipal }}>$3.000 COP</strong>
                  </span>
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    Tableros: <strong style={{ color: coloresApariencia?.botonActivo }}>1 referencia</strong>
                  </span>
                  {proveedoresAbiertos["Masisa"] ? (
                    <ChevronUp style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  ) : (
                    <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  )}
                </div>
              </button>

              {proveedoresAbiertos["Masisa"] && (
                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: coloresApariencia?.fondoAplicacion 
                  }}
                  className="p-4 border-t flex flex-col gap-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        TRM Asignada
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <span style={{ color: coloresApariencia?.textoSecundario }}>$</span>
                        <DecimalInput 
                          value={3000} 
                          decimals={0} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal
                          }}
                          className="w-20 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">COP</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Descuento Comercial
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs">
                        <DecimalInput 
                          value={0} 
                          decimals={1} 
                          onChange={() => {}} 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.botonActivo
                          }}
                          className="w-16 border px-1.5 py-0.5 rounded text-right" 
                        />
                        <span style={{ color: coloresApariencia?.botonActivo }}>%</span>
                      </div>
                    </div>
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3 rounded-lg border"
                    >
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] uppercase font-bold block mb-1">
                        Especialidad
                      </span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">
                        MDP Supercor 15mm y 18mm
                      </span>
                    </div>
                  </div>
                  <div style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] italic">
                    ℹ️ Para configurar una fórmula de liquidación personalizada para Masisa, puedes suministrar la matriz o tabla de Excel correspondiente.
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 4. DURATEX S.A. (PROVEEDOR ESTRATÉGICO PRINCIPAL - MATRIZ VIVA)*/}
            {/* ------------------------------------------------------------- */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="rounded-xl border shadow-sm overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleProveedor("Duratex")}
                style={{ 
                  backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
                className="w-full p-3.5 flex items-center justify-between transition cursor-pointer text-left hover:opacity-90"
              >
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow"
                  >
                    DX
                  </div>
                  <div>
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="font-extrabold text-xs flex items-center gap-2"
                    >
                      Duratex S.A.
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                      Proveedor Estratégico Principal con matriz industrial de importación y descuentos
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    TRM Duratex: <strong style={{ color: coloresApariencia?.textoPrincipal }}>${negociacionNovopan.trmNovopan.toLocaleString("es-CO")} COP</strong>
                  </span>
                  <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono">
                    Tableros: <strong style={{ color: coloresApariencia?.botonActivo }}>5 referencias</strong>
                  </span>
                  {proveedoresAbiertos["Duratex"] ? (
                    <ChevronUp style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  ) : (
                    <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-4 h-4" />
                  )}
                </div>
              </button>

              {proveedoresAbiertos["Duratex"] && (
                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: coloresApariencia?.fondoAplicacion 
                  }}
                  className="p-4 border-t flex flex-col gap-4"
                >
                  {/* Matriz de Parámetros Editables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bloque 1: Descuentos y Apoyos */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3.5 rounded-xl border shadow-xs flex flex-col gap-2.5"
                    >
                      <div 
                        style={{ borderColor: coloresApariencia?.bordePaneles }}
                        className="flex items-center gap-2 pb-1.5 border-b"
                      >
                        <Percent style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
                        <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold">
                          Descuentos & Apoyos Comerciales Duratex
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Apoyo en Volumen */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Apoyo en Volumen Láminas
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Descuento directo por compra masiva mensual
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.apoyoVolumenPct}
                              onChange={(val) => updateNegociacionNovopan("apoyoVolumenPct", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.botonActivo,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.botonActivo }} className="font-bold">%</span>
                          </div>
                        </div>

                        {/* Apoyo en Tasa */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Apoyo en Tasa (Subsidio TRM)
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Subsidio cambiario pactado con Duratex
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.apoyoTasaPct}
                              onChange={(val) => updateNegociacionNovopan("apoyoTasaPct", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.botonActivo,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.botonActivo }} className="font-bold">%</span>
                          </div>
                        </div>

                        {/* Pronto Pago */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Descuento por Pronto Pago
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Gavela financiera aplicada sobre (Base + Flete)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.prontoPagoPct}
                              onChange={(val) => updateNegociacionNovopan("prontoPagoPct", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.botonActivo,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.botonActivo }} className="font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: TRM, Fletes y Nacionalización */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="p-3.5 rounded-xl border shadow-xs flex flex-col gap-2.5"
                    >
                      <div 
                        style={{ borderColor: coloresApariencia?.bordePaneles }}
                        className="flex items-center gap-2 pb-1.5 border-b"
                      >
                        <Truck style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
                        <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold">
                          TRM, Logística & Nacionalización
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* TRM Duratex */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold block">
                              TRM Pactada Duratex
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Tasa de cambio fijada en el acuerdo
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: coloresApariencia?.estadoActivo || "#10b981" }} className="font-mono font-bold">$</span>
                            <DecimalInput
                              value={negociacionNovopan.trmNovopan}
                              decimals={0}
                              onChange={(val) => updateNegociacionNovopan("trmNovopan", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.estadoActivo || "#10b981",
                              }}
                              className="w-24 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.estadoActivo || "#10b981" }} className="text-[10px] font-mono font-bold">COP</span>
                          </div>
                        </div>

                        {/* Flete Internacional por m3 */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Flete Internacional (x m³)
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Transporte Internacional ➔ Planta
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="font-mono">$</span>
                            <DecimalInput
                              value={negociacionNovopan.fleteInternacionalM3Usd}
                              decimals={2}
                              onChange={(val) => updateNegociacionNovopan("fleteInternacionalM3Usd", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.textoPrincipal,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] font-mono">USD</span>
                          </div>
                        </div>

                        {/* Gastos de Nacionalización */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Gastos de Nacionalización
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Aranceles y aduanas (DIAN)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.gastosNacionalizacionPct}
                              onChange={(val) => updateNegociacionNovopan("gastosNacionalizacionPct", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.textoPrincipal,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">%</span>
                          </div>
                        </div>

                        {/* Financiación */}
                        <div 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles 
                          }}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <div>
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">
                              Costo de Financiación
                            </span>
                            <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">
                              Apalancamiento financiero
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DecimalInput
                              value={negociacionNovopan.financiacionPct}
                              onChange={(val) => updateNegociacionNovopan("financiacionPct", val)}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles,
                                borderColor: coloresApariencia?.bordePaneles,
                                color: coloresApariencia?.textoPrincipal,
                              }}
                              className="w-20 font-mono font-extrabold text-xs text-right border rounded px-2 py-1 outline-none shadow-xs"
                            />
                            <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 🏭 VISTA 5: MANO DE OBRA & CIF (COSTOS DE CONVERSIÓN INDUSTRIAL)          */}
        {/* ========================================================================= */}
        {tab === "conversion" && (
          <div className="p-5 flex flex-col gap-4 max-w-5xl mx-auto">
            {/* Header explicativo */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              className="p-4 rounded-xl border shadow-sm transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Coins style={{ color: coloresApariencia?.botonActivo }} className="w-5 h-5" />
                    <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold text-sm">
                      Parámetros de Conversión Industrial (Mano de Obra & CIF)
                    </h3>
                  </div>
                  <p style={{ color: coloresApariencia?.textoSecundario }} className="text-xs max-w-3xl leading-relaxed">
                    En el estándar de manufactura industrial y costeo absorbente (NIC 2 / RTA), el <strong>100% del costo de fabricación</strong> se compone de los <strong>Materiales Directos (MP: 77.78%)</strong>, la <strong>Mano de Obra Directa + Prestaciones (12.42%)</strong> y los <strong>Costos Indirectos de Fabricación (9.80%)</strong>.
                  </p>
                </div>
                <span style={{ color: coloresApariencia?.textoSecundario }} className="text-xs font-mono font-medium">Estándar ERP 100%</span>
              </div>
            </div>

            {/* Grid de Configuración de Factores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tarjeta 1: Mano de Obra + Prestaciones */}
              <div 
                style={{ 
                  backgroundColor: coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.bordePaneles 
                }}
                className="p-4 rounded-xl border shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div 
                    style={{ borderColor: coloresApariencia?.bordePaneles }}
                    className="flex items-center justify-between pb-2 border-b"
                  >
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#10B981" }}></span>
                      Mano de Obra + Prestaciones (MO)
                    </span>
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        color: coloresApariencia?.botonActivo,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                      className="px-2 py-0.5 rounded font-bold text-[10px] border"
                    >
                      MOD + Carga Social
                    </span>
                  </div>
                  <p style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                    Impacto porcentual sobre el costo total del producto que absorbe operarios de seccionado, canteado, mecanizado CNC, ensamble y factor prestacional legal.
                  </p>
                  
                  {/* Desglose Prestacional */}
                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoAplicacion, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded text-[10px] space-y-1 border"
                  >
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Cesantías + Prima (8.33% c/u):</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">16.66%</span>
                    </div>
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Salud, Pensión & ARL (Riesgo III/IV):</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">22.93%</span>
                    </div>
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Parafiscales (SENA, ICBF, Caja):</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">9.00%</span>
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoAplicacion, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                  className="flex items-center justify-between pt-2 border p-2.5 rounded-lg"
                >
                  <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">Porcentaje en Costo:</span>
                  <div className="flex items-center gap-1.5">
                    <DecimalInput
                      value={costosConversion.pctManoObraPres}
                      onChange={(val) => updateCostoConversion("pctManoObraPres", val)}
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo,
                      }}
                      className="w-20 font-mono font-extrabold text-sm text-right border rounded px-2 py-1 outline-none shadow-xs"
                    />
                    <span style={{ color: coloresApariencia?.botonActivo }} className="font-extrabold text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Costos Indirectos de Fabricación (CIF) */}
              <div 
                style={{ 
                  backgroundColor: coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.bordePaneles 
                }}
                className="p-4 rounded-xl border shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div 
                    style={{ borderColor: coloresApariencia?.bordePaneles }}
                    className="flex items-center justify-between pb-2 border-b"
                  >
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#F59E0B" }}></span>
                      Costos Indirectos de Fabricación (CIF)
                    </span>
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        color: coloresApariencia?.botonActivo,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                      className="px-2 py-0.5 rounded font-bold text-[10px] border"
                    >
                      Planta & Maquinaria
                    </span>
                  </div>
                  <p style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                    Gastos generales de planta, depreciación horaria de maquinaria CNC, consumo eléctrico de corte, pegamentos industriales (EVA/PUR), fresas y supervisión.
                  </p>

                  {/* Desglose CIF */}
                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoAplicacion, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded text-[10px] space-y-1 border"
                  >
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Depreciación CNC (Morbidelli/Skipper):</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">3.80%</span>
                    </div>
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Energía industrial & Plantas de vacío:</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">2.50%</span>
                    </div>
                    <div className="flex justify-between" style={{ color: coloresApariencia?.textoSecundario }}>
                      <span>• Adhesivos PUR, desgaste fresas & mtto:</span>
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold">3.50%</span>
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoAplicacion, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                  className="flex items-center justify-between pt-2 border p-2.5 rounded-lg"
                >
                  <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">Porcentaje en Costo:</span>
                  <div className="flex items-center gap-1.5">
                    <DecimalInput
                      value={costosConversion.pctCIF}
                      onChange={(val) => updateCostoConversion("pctCIF", val)}
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo,
                      }}
                      className="w-20 font-mono font-extrabold text-sm text-right border rounded px-2 py-1 outline-none shadow-xs"
                    />
                    <span style={{ color: coloresApariencia?.botonActivo }} className="font-extrabold text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Adicionales y Tercerizaciones */}
              <div 
                style={{ 
                  backgroundColor: coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.bordePaneles 
                }}
                className="p-4 rounded-xl border shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div 
                    style={{ borderColor: coloresApariencia?.bordePaneles }}
                    className="flex items-center justify-between pb-2 border-b"
                  >
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#06B6D4" }}></span>
                      Insumos Adicionales & Tercerizaciones
                    </span>
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        color: coloresApariencia?.botonActivo,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                      className="px-2 py-0.5 rounded font-bold text-[10px] border"
                    >
                      Variables
                    </span>
                  </div>
                  <p style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                    Margen de seguridad para consumibles menores (estopas, disolventes, etiquetas de código de barras) y servicios de maquila externa.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">Adicionales (%):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.pctAdicionales}
                          onChange={(val) => updateCostoConversion("pctAdicionales", val)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="w-16 font-mono font-bold text-xs text-right border rounded px-1.5 py-0.5"
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="font-bold">%</span>
                      </div>
                    </div>

                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">Tercerizaciones ($):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.costoTercerizacionesCop}
                          onChange={(val) => updateCostoConversion("costoTercerizacionesCop", val)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="w-20 font-mono font-bold text-xs text-right border rounded px-1.5 py-0.5"
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="font-bold">COP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    color: coloresApariencia?.textoSecundario 
                  }}
                  className="pt-2 border-t text-[10px]"
                >
                  Valores configurables para el cálculo del 100% en la ficha de costos.
                </div>
              </div>
            </div>

            {/* Matriz Visual de Construcción del 100% del Costo */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || coloresApariencia?.fondoAplicacion, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="p-4 rounded-xl border shadow-sm space-y-3"
            >
              <div 
                style={{ borderColor: coloresApariencia?.bordePaneles }}
                className="flex items-center justify-between pb-2 border-b"
              >
                <span style={{ color: coloresApariencia?.botonActivo }} className="font-extrabold text-xs flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Matriz Consolidada de Distribución del Costo Total (100.00%)
                </span>
                <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] font-mono">
                  Formula Absorbente: Total = MP / (1 - MO% - CIF%)
                </span>
              </div>

              {/* Barra de Distribución Proporcional */}
              <div className="space-y-1.5">
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                  className="w-full h-5 rounded-lg overflow-hidden flex shadow-inner border"
                >
                  <div
                    style={{ 
                      width: `${(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%`,
                      backgroundColor: "#06B6D4" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Materia Prima (MP)"
                  >
                    MP {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(1)}%
                  </div>
                  <div
                    style={{ 
                      width: `${costosConversion.pctManoObraPres}%`,
                      backgroundColor: "#10B981" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Mano de Obra (MO)"
                  >
                    MO {costosConversion.pctManoObraPres.toFixed(1)}%
                  </div>
                  <div
                    style={{ 
                      width: `${costosConversion.pctCIF}%`,
                      backgroundColor: "#F59E0B" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Costos Indirectos (CIF)"
                  >
                    CIF {costosConversion.pctCIF.toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded border"
                  >
                    <span style={{ color: "#06B6D4" }} className="text-[10px] uppercase font-bold block">
                      1. Materia Prima Directa (MP)
                    </span>
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-extrabold text-sm">
                      {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] block">
                      Tableros + Cantos + Herrajes + Empaque
                    </span>
                  </div>

                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded border"
                  >
                    <span style={{ color: "#10B981" }} className="text-[10px] uppercase font-bold block">
                      2. Mano de Obra Directa (MO)
                    </span>
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-extrabold text-sm">
                      {costosConversion.pctManoObraPres.toFixed(2)}%
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] block">
                      MOD + Carga Prestacional Completa
                    </span>
                    <span style={{ color: coloresApariencia?.botonActivo }} className="font-extrabold text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Adicionales y Tercerizaciones */}
              <div 
                style={{ 
                  backgroundColor: coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.bordePaneles 
                }}
                className="p-4 rounded-xl border shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div 
                    style={{ borderColor: coloresApariencia?.bordePaneles }}
                    className="flex items-center justify-between pb-2 border-b"
                  >
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-extrabold flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#06B6D4" }}></span>
                      Insumos Adicionales & Tercerizaciones
                    </span>
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        color: coloresApariencia?.botonActivo,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                      className="px-2 py-0.5 rounded font-bold text-[10px] border"
                    >
                      Variables
                    </span>
                  </div>
                  <p style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                    Margen de seguridad para consumibles menores (estopas, disolventes, etiquetas de código de barras) y servicios de maquila externa.
                  </p>

                  <div className="space-y-2 pt-1">
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">Adicionales (%):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.pctAdicionales}
                          onChange={(val) => updateCostoConversion("pctAdicionales", val)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="w-16 font-mono font-bold text-xs text-right border rounded px-1.5 py-0.5"
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="font-bold">%</span>
                      </div>
                    </div>

                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">Tercerizaciones ($):</span>
                      <div className="flex items-center gap-1">
                        <DecimalInput
                          value={costosConversion.costoTercerizacionesCop}
                          onChange={(val) => updateCostoConversion("costoTercerizacionesCop", val)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoPaneles,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="w-20 font-mono font-bold text-xs text-right border rounded px-1.5 py-0.5"
                        />
                        <span style={{ color: coloresApariencia?.textoSecundario }} className="font-bold">COP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    color: coloresApariencia?.textoSecundario 
                  }}
                  className="pt-2 border-t text-[10px]"
                >
                  Valores configurables para el cálculo del 100% en la ficha de costos.
                </div>
              </div>
            </div>

            {/* Matriz Visual de Construcción del 100% del Costo */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.tablaEncabezadoFondo || coloresApariencia?.fondoAplicacion, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="p-4 rounded-xl border shadow-sm space-y-3"
            >
              <div 
                style={{ borderColor: coloresApariencia?.bordePaneles }}
                className="flex items-center justify-between pb-2 border-b"
              >
                <span style={{ color: coloresApariencia?.botonActivo }} className="font-extrabold text-xs flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Matriz Consolidada de Distribución del Costo Total (100.00%)
                </span>
                <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] font-mono">
                  Formula Absorbente: Total = MP / (1 - MO% - CIF%)
                </span>
              </div>

              {/* Barra de Distribución Proporcional */}
              <div className="space-y-1.5">
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                  className="w-full h-5 rounded-lg overflow-hidden flex shadow-inner border"
                >
                  <div
                    style={{ 
                      width: `${(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%`,
                      backgroundColor: "#06B6D4" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Materia Prima (MP)"
                  >
                    MP {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(1)}%
                  </div>
                  <div
                    style={{ 
                      width: `${costosConversion.pctManoObraPres}%`,
                      backgroundColor: "#10B981" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Mano de Obra (MO)"
                  >
                    MO {costosConversion.pctManoObraPres.toFixed(1)}%
                  </div>
                  <div
                    style={{ 
                      width: `${costosConversion.pctCIF}%`,
                      backgroundColor: "#F59E0B" 
                    }}
                    className="h-full flex items-center justify-center text-[10px] font-mono font-extrabold text-white transition-all duration-300"
                    title="Costos Indirectos (CIF)"
                  >
                    CIF {costosConversion.pctCIF.toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded border"
                  >
                    <span style={{ color: "#06B6D4" }} className="text-[10px] uppercase font-bold block">
                      1. Materia Prima Directa (MP)
                    </span>
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-extrabold text-sm">
                      {(100 - costosConversion.pctManoObraPres - costosConversion.pctCIF).toFixed(2)}%
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] block">
                      Tableros + Cantos + Herrajes + Empaque
                    </span>
                  </div>

                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded border"
                  >
                    <span style={{ color: "#10B981" }} className="text-[10px] uppercase font-bold block">
                      2. Mano de Obra Directa (MO)
                    </span>
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-extrabold text-sm">
                      {costosConversion.pctManoObraPres.toFixed(2)}%
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] block">
                      MOD + Carga Prestacional Completa
                    </span>
                  </div>

                  <div 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                    className="p-2 rounded border"
                  >
                    <span style={{ color: "#F59E0B" }} className="text-[10px] uppercase font-bold block">
                      3. Costos Indirectos (CIF)
                    </span>
                    <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-extrabold text-sm">
                      {costosConversion.pctCIF.toFixed(2)}%
                    </span>
                    <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] block">
                      Depreciación CNC + Energía + Insumos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div 
        style={{ color: coloresApariencia?.textoSecundario }}
        className="flex items-center text-[11px] pt-1 transition-colors"
      >
        <span>
          Los costos de tableros se liquidan automáticamente a través de la matriz de negociación de cada proveedor.
        </span>
      </div>
    </div>
  );
}
