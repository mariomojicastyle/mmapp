"use client";

import React, { useState, useEffect, useMemo } from "react";
import { use3BFStore, TableroRecord, HerrajeRecord, CantoRecord, calcularCostoLaminaNovopan } from "@/lib/store";
import { X, Save, Layers, Ruler, DollarSign, Tag, Building2, Check, Scissors, Box } from "lucide-react";

export type ElementoDbSeleccionado = 
  | { tipo: "tablero"; item: TableroRecord }
  | { tipo: "herraje"; item: HerrajeRecord }
  | { tipo: "canto"; item: CantoRecord };

interface Props {
  abierto: boolean;
  elemento: ElementoDbSeleccionado | null;
  onCerrar: () => void;
  onGuardar: (tipo: "tablero" | "herraje" | "canto", itemActualizado: any) => void;
}

export default function ModalEditarMaterialDb({
  abierto,
  elemento,
  onCerrar,
  onGuardar,
}: Props) {
  const { coloresApariencia, esquemaColor, negociacionNovopan } = use3BFStore();
  const esOscuro = esquemaColor === "oscuro";

  // Estados locales para la edición
  const [formData, setFormData] = useState<any>({});
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Inicializar o recargar datos al abrir el modal o cambiar el elemento
  useEffect(() => {
    if (elemento?.item) {
      setFormData({ ...elemento.item });
      setGuardadoExitoso(false);
    }
  }, [elemento]);

  // Cálculos en tiempo real para tableros
  const calculosTablero = useMemo(() => {
    if (!elemento || elemento.tipo !== "tablero") return null;

    const largo = Number(formData.largoLaminaMm) || 2440;
    const ancho = Number(formData.anchoLaminaMm) || 1830;
    const calibre = Number(formData.calibreMm) || 15;
    const listaUsd = Number(formData.costoListaUsd) || 0;
    const descCara = Number(formData.descuentoCaraPct) || 0;
    const proveedor = formData.proveedor || "Duratex";
    const nombre = formData.nombreComercial || "";

    const areaM2 = Number(((largo * ancho) / 1_000_000.0).toFixed(3));

    if (proveedor === "Novopan" || proveedor === "Duratex") {
      const res = calcularCostoLaminaNovopan(
        listaUsd,
        largo,
        ancho,
        calibre,
        descCara,
        negociacionNovopan,
        nombre
      );
      return {
        areaM2,
        costoLaminaCop: res.costoLaminaCop,
        costoLaminaUsd: res.costoLaminaUsd,
        costoM2Cop: res.costoM2Cop,
        costoM2Usd: res.costoM2Usd,
      };
    } else {
      const costoM2Usd = areaM2 > 0 ? Number(((formData.costoLaminaUsd || listaUsd) / areaM2).toFixed(2)) : 0;
      const costoLaminaCop = Math.round((formData.costoLaminaUsd || listaUsd) * 4000);
      const costoM2Cop = Math.round(costoM2Usd * 4000);
      return {
        areaM2,
        costoLaminaCop,
        costoLaminaUsd: formData.costoLaminaUsd || listaUsd,
        costoM2Cop,
        costoM2Usd,
      };
    }
  }, [elemento, formData, negociacionNovopan]);

  const actualizarCampo = (campo: string, valor: any) => {
    setFormData((prev: any) => ({ ...prev, [campo]: valor }));
  };

  // Solo retornar null después de haber ejecutado todos los hooks de React
  if (!abierto || !elemento) return null;

  const colorFondoModal = coloresApariencia?.fondoPaneles || (esOscuro ? "#131B2E" : "#FFFFFF");
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elemento) return;

    let itemParaGuardar = { ...formData };

    if (elemento.tipo === "tablero" && calculosTablero) {
      itemParaGuardar = {
        ...itemParaGuardar,
        largoLaminaMm: Number(formData.largoLaminaMm),
        anchoLaminaMm: Number(formData.anchoLaminaMm),
        calibreMm: Number(formData.calibreMm),
        costoListaUsd: Number(formData.costoListaUsd),
        costoLaminaCop: calculosTablero.costoLaminaCop,
        costoLaminaUsd: calculosTablero.costoLaminaUsd,
        costoM2Cop: calculosTablero.costoM2Cop,
        costoM2Usd: calculosTablero.costoM2Usd,
      };
    } else if (elemento.tipo === "herraje") {
      itemParaGuardar = {
        ...itemParaGuardar,
        costoCop: Number(formData.costoCop),
        costoUsd: Number(formData.costoUsd),
        mallasPorUnidad: Number(formData.mallasPorUnidad) || 1,
        pesoKg: Number(formData.pesoKg) || 0.01,
      };
    } else if (elemento.tipo === "canto") {
      itemParaGuardar = {
        ...itemParaGuardar,
        espesorMm: Number(formData.espesorMm),
        anchoMm: Number(formData.anchoMm),
        costoMlCop: Number(formData.costoMlCop),
        costoMlUsd: Number(formData.costoMlUsd),
      };
    }

    setGuardadoExitoso(true);
    onGuardar(elemento.tipo, itemParaGuardar);

    setTimeout(() => {
      onCerrar();
    }, 450);
  };

  const aplicarFormatoRapido = (largo: number, ancho: number) => {
    setFormData((prev: any) => ({
      ...prev,
      largoLaminaMm: largo,
      anchoLaminaMm: ancho,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        style={{
          backgroundColor: colorFondoModal,
          borderColor: colorBorde,
          color: colorTexto,
        }}
        className="w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Encabezado del Modal */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: `${colorBotonActivo}20`, color: colorBotonActivo }}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
            >
              {elemento.tipo === "tablero" ? (
                <Layers className="w-5 h-5" />
              ) : elemento.tipo === "herraje" ? (
                <Box className="w-5 h-5" />
              ) : (
                <Scissors className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">
                Editar {elemento.tipo === "tablero" ? "Tablero & Sustrato" : elemento.tipo === "herraje" ? "Herraje DfMA" : "Canto & Acabado"}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {formData.codigo || "ID"} • {formData.nombreComercial || formData.nombreGhx || formData.descripcion}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ========================================================================= */}
          {/* 🪵 FORMULARIO TABLERO / SUSTRATO                                          */}
          {/* ========================================================================= */}
          {elemento.tipo === "tablero" && (
            <div className="space-y-4">
              {/* Código y Sustrato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Código ERP
                  </label>
                  <input
                    type="text"
                    value={formData.codigo || ""}
                    onChange={(e) => actualizarCampo("codigo", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Sustrato
                  </label>
                  <select
                    value={formData.sustrato || "MDP"}
                    onChange={(e) => actualizarCampo("sustrato", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="MDP">MDP (Aglomerado)</option>
                    <option value="MDF">MDF Estándar</option>
                    <option value="MDF RH">MDF RH Hidrófugo</option>
                    <option value="HDF">HDF (Fondo / Traseras)</option>
                    <option value="Triplex">Triplex / Contrachapado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Calibre (Espesor mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="60"
                    value={formData.calibreMm ?? 15}
                    onChange={(e) => actualizarCampo("calibreMm", parseFloat(e.target.value) || 15)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                    required
                  />
                </div>
              </div>

              {/* Nombre Comercial */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Nombre Comercial & Textura
                </label>
                <input
                  type="text"
                  value={formData.nombreComercial || ""}
                  onChange={(e) => actualizarCampo("nombreComercial", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              {/* DIMENSIONES DEL FORMATO DE LÁMINA (ZONA CRÍTICA) */}
              <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-cyan-800 dark:text-cyan-200 uppercase tracking-wider">
                    <Ruler className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Formato de Lámina Comercial (Inventario Real)</span>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold text-cyan-700 dark:text-cyan-300">
                    Área: {calculosTablero?.areaM2 || 0} m²
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      Largo de Lámina (mm)
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="6000"
                      value={formData.largoLaminaMm ?? 2440}
                      onChange={(e) => actualizarCampo("largoLaminaMm", parseInt(e.target.value, 10) || 2440)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono font-extrabold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
                      Ancho de Lámina (mm)
                    </label>
                    <input
                      type="number"
                      min="500"
                      max="4000"
                      value={formData.anchoLaminaMm ?? 1830}
                      onChange={(e) => actualizarCampo("anchoLaminaMm", parseInt(e.target.value, 10) || 1830)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono font-extrabold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                      required
                    />
                  </div>
                </div>

                {/* Formatos rápidos comunes en cápsulas rounded-full */}
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Formatos estándar comunes (1 clic):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { l: 2440, a: 1830, label: "2440 × 1830 mm (Estándar 1.83)" },
                      { l: 2440, a: 1150, label: "2440 × 1150 mm (Medio 1.15)" },
                      { l: 2440, a: 2150, label: "2440 × 2150 mm (Duratex 2.15)" },
                      { l: 2800, a: 2100, label: "2800 × 2100 mm (HDF / Trasera)" },
                      { l: 2750, a: 1830, label: "2750 × 1830 mm (Largo)" },
                    ].map((fmt) => {
                      const activo = formData.largoLaminaMm === fmt.l && formData.anchoLaminaMm === fmt.a;
                      return (
                        <button
                          key={fmt.label}
                          type="button"
                          onClick={() => aplicarFormatoRapido(fmt.l, fmt.a)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            activo
                              ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-400"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Proveedor y Precios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Proveedor
                  </label>
                  <select
                    value={formData.proveedor || "Duratex"}
                    onChange={(e) => actualizarCampo("proveedor", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="Duratex">Duratex</option>
                    <option value="Novopan">Novopan</option>
                    <option value="Primadera">Primadera</option>
                    <option value="Arauco">Arauco</option>
                    <option value="Pelíkano">Pelíkano</option>
                    <option value="Genérico">Genérico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Precio Lista (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costoListaUsd ?? 0}
                    onChange={(e) => actualizarCampo("costoListaUsd", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Desc. Cara (%)
                  </label>
                  <select
                    value={formData.descuentoCaraPct ?? 0}
                    onChange={(e) => actualizarCampo("descuentoCaraPct", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value={0}>0% (D/D 2 caras)</option>
                    <option value={5}>5% (D/B Balance)</option>
                  </select>
                </div>
              </div>

              {/* Resumen de Liquidación Automática en Fábrica */}
              {calculosTablero && (
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Lámina en Fábrica</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ${calculosTablero.costoLaminaCop.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Costo Lámina USD</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      ${calculosTablero.costoLaminaUsd.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Costo m² (COP)</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      ${calculosTablero.costoM2Cop.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">Costo m² (USD)</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                      ${calculosTablero.costoM2Usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 🔩 FORMULARIO HERRAJE DfMA                                                */}
          {/* ========================================================================= */}
          {elemento.tipo === "herraje" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Código ERP
                  </label>
                  <input
                    type="text"
                    value={formData.codigo || ""}
                    onChange={(e) => actualizarCampo("codigo", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Nombre Grasshopper (GHX)
                  </label>
                  <input
                    type="text"
                    value={formData.nombreGhx || ""}
                    onChange={(e) => actualizarCampo("nombreGhx", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria || "Accesorios"}
                    onChange={(e) => actualizarCampo("categoria", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="Minifix">Minifix</option>
                    <option value="Tornillos">Tornillos</option>
                    <option value="Tarugos">Tarugos</option>
                    <option value="Correderas">Correderas</option>
                    <option value="Bisagras">Bisagras</option>
                    <option value="Soportes">Soportes</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Descripción Comercial
                </label>
                <input
                  type="text"
                  value={formData.descripcion || ""}
                  onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Mallas / Unidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.mallasPorUnidad ?? 1}
                    onChange={(e) => actualizarCampo("mallasPorUnidad", parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Unidad
                  </label>
                  <select
                    value={formData.unidad || "UND"}
                    onChange={(e) => actualizarCampo("unidad", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer text-center"
                  >
                    <option value="UND">UND</option>
                    <option value="PAR">PAR</option>
                    <option value="JGO">JGO</option>
                    <option value="KIT">KIT</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Costo (COP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.costoCop ?? 0}
                    onChange={(e) => {
                      const cop = parseFloat(e.target.value) || 0;
                      actualizarCampo("costoCop", cop);
                      actualizarCampo("costoUsd", Number((cop / 4000.0).toFixed(4)));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Costo (USD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.costoUsd ?? 0}
                    onChange={(e) => actualizarCampo("costoUsd", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.proveedor || ""}
                  onChange={(e) => actualizarCampo("proveedor", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 📏 FORMULARIO CANTO / TAPACANTO                                           */}
          {/* ========================================================================= */}
          {elemento.tipo === "canto" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Código ERP
                  </label>
                  <input
                    type="text"
                    value={formData.codigo || ""}
                    onChange={(e) => actualizarCampo("codigo", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Descripción Canto
                  </label>
                  <input
                    type="text"
                    value={formData.descripcion || ""}
                    onChange={(e) => actualizarCampo("descripcion", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Espesor (mm)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={formData.espesorMm ?? 0.45}
                    onChange={(e) => actualizarCampo("espesorMm", parseFloat(e.target.value) || 0.45)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Ancho (mm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.anchoMm ?? 22}
                    onChange={(e) => actualizarCampo("anchoMm", parseInt(e.target.value, 10) || 22)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo || "Flexible"}
                    onChange={(e) => actualizarCampo("tipo", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Rígido 2mm">Rígido 2mm</option>
                    <option value="Melamínico">Melamínico</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor || ""}
                    onChange={(e) => actualizarCampo("proveedor", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Costo Metro Lineal (COP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.costoMlCop ?? 0}
                    onChange={(e) => {
                      const cop = parseFloat(e.target.value) || 0;
                      actualizarCampo("costoMlCop", cop);
                      actualizarCampo("costoMlUsd", Number((cop / 4000.0).toFixed(4)));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Costo Metro Lineal (USD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.costoMlUsd ?? 0}
                    onChange={(e) => actualizarCampo("costoMlUsd", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botonera de Acción en Cápsulas rounded-full puras */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCerrar}
              className="px-5 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{ backgroundColor: colorBotonActivo }}
              className="px-6 py-2 rounded-full text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition cursor-pointer active:scale-95"
            >
              {guardadoExitoso ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
