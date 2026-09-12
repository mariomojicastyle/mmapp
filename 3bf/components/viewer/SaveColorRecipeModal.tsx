"use client";

import React, { useState } from "react";
import { use3BFStore, RecetaColorMueble, RecetaColorSwatch } from "@/lib/store";
import { X, Check, Palette, Sparkles, Layers } from "lucide-react";

interface SaveColorRecipeModalProps {
  abierto: boolean;
  onCerrar: () => void;
  muebleId: string;
}

export default function SaveColorRecipeModal({
  abierto,
  onCerrar,
  muebleId
}: SaveColorRecipeModalProps) {
  const {
    capas,
    asignacionesPartes,
    materialesPBR,
    guardarNuevaRecetaColor,
    coloresApariencia,
    esquemaColor,
    objetoActivoId,
    instancias,
    parametros
  } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0891B2");

  // Tomar el color de la capa Tono o la primera capa activa como referencia inicial
  const capaTono = capas.find((c) => c.id === "capa_tono") || capas[0];
  const matTono = materialesPBR.find((m) => m.id === capaTono?.materialId);

  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [tipoSwatch, setTipoSwatch] = useState<"solido" | "bicolor">("bicolor");
  const [colorPrimario, setColorPrimario] = useState(matTono?.colorBase || "#B87B4C");
  const [colorSecundario, setColorSecundario] = useState("#F5F2EB");

  if (!abierto) return null;

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    // Capturar el 100% de las capas actuales
    const asignacionesCapaMaterial: Record<string, string> = {};
    capas.forEach((c) => {
      asignacionesCapaMaterial[c.id] = c.materialId;
    });

    // Capturar el 100% de las asignaciones de partes actuales
    const asignacionesPartesMap: Record<string, { capaId: string; materialId: string }> = {};
    Object.entries(asignacionesPartes).forEach(([k, v]) => {
      asignacionesPartesMap[k] = { capaId: v.capaId, materialId: v.materialId };
    });

    // Capturar el 100% de los parámetros paramétricos de piezas, caras de balance y sustratos
    const objetoActivo = objetoActivoId ? instancias[objetoActivoId] : null;
    const parametrosActuales = { ...(objetoActivo?.parametros || parametros || {}) };

    const swatch: RecetaColorSwatch = {
      tipo: tipoSwatch,
      colorPrimario,
      ...(tipoSwatch === "bicolor" ? { colorSecundario } : {})
    };

    const nuevaReceta: RecetaColorMueble = {
      id: `receta_${Date.now()}`,
      nombre: nombre.trim(),
      referenciaSku: sku.trim() || `Ref. ${Math.floor(100 + Math.random() * 900)}`,
      swatch,
      asignacionesCapaMaterial,
      asignacionesPartes: asignacionesPartesMap,
      parametros: parametrosActuales
    };

    guardarNuevaRecetaColor(muebleId, nuevaReceta);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        style={{
          backgroundColor: esOscuro ? "#131B2E" : "#FFFFFF",
          borderColor: esOscuro ? "#1E293B" : "#CBD5E1",
          color: esOscuro ? "#F8FAFC" : "#0F172A"
        }}
        className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div
          style={{ borderColor: esOscuro ? "#1E293B" : "#E2E8F0" }}
          className="p-3.5 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: colorBotonActivo }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xs"
            >
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs lg:text-sm font-bold leading-none">Guardar Receta de Color</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Archivar combinación actual del mueble
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-4 space-y-3.5 text-xs">
          {/* Vista Previa del Swatch */}
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                style={{
                  background:
                    tipoSwatch === "bicolor"
                      ? `linear-gradient(135deg, ${colorPrimario} 50%, ${colorSecundario} 50%)`
                      : colorPrimario,
                  boxShadow: `0 0 0 3px ${colorBotonActivo}, 0 4px 10px rgba(0,0,0,0.15)`
                }}
                className="w-12 h-12 rounded-full border border-black/15 transition-all"
              />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {nombre || "Nombre de color"}
              </span>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Nombre de la combinación
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Cinamomo / Off White"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                borderColor: esOscuro ? "#2A374A" : "#CBD5E1",
                color: esOscuro ? "#F8FAFC" : "#0F172A"
              }}
              className="w-full px-3 py-1.5 rounded-full border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Referencia Comercial / SKU */}
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Referencia Comercial / SKU
            </label>
            <input
              type="text"
              placeholder="Ej: Ref. D737-221"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              style={{
                backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                borderColor: esOscuro ? "#2A374A" : "#CBD5E1",
                color: esOscuro ? "#F8FAFC" : "#0F172A"
              }}
              className="w-full px-3 py-1.5 rounded-full border text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Tipo de Swatch */}
          <div>
            <label className="block text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
              Estilo del Swatch
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipoSwatch("solido")}
                style={{
                  backgroundColor: tipoSwatch === "solido" ? colorBotonActivo : (esOscuro ? "#1E293B" : "#E2E8F0"),
                  color: tipoSwatch === "solido" ? "#FFFFFF" : (esOscuro ? "#CBD5E1" : "#0F172A")
                }}
                className="flex-1 py-1 px-3 rounded-full font-semibold transition cursor-pointer text-center text-xs"
              >
                Monocromático
              </button>
              <button
                type="button"
                onClick={() => setTipoSwatch("bicolor")}
                style={{
                  backgroundColor: tipoSwatch === "bicolor" ? colorBotonActivo : (esOscuro ? "#1E293B" : "#E2E8F0"),
                  color: tipoSwatch === "bicolor" ? "#FFFFFF" : (esOscuro ? "#CBD5E1" : "#0F172A")
                }}
                className="flex-1 py-1 px-3 rounded-full font-semibold transition cursor-pointer text-center text-xs"
              >
                Bicolor
              </button>
            </div>
          </div>

          {/* Selectores de Color Hexadecimal */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                Color Primario
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-6 h-6 rounded-full border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="w-full px-2 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 dark:border-slate-700 bg-transparent text-center"
                />
              </div>
            </div>

            {tipoSwatch === "bicolor" && (
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                  Color Secundario
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-6 h-6 rounded-full border-0 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-full px-2 py-0.5 rounded-full text-[10px] font-mono border border-slate-300 dark:border-slate-700 bg-transparent text-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Resumen de Capas Capturadas */}
          <div
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0"
            }}
            className="p-2 rounded-xl border flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Se capturarán los materiales de las <strong>{capas.length} capas</strong> del modelo actual.</span>
          </div>

          {/* Botones de Acción (Cápsulas puras obligatorias) */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              style={{
                backgroundColor: esOscuro ? "#1E293B" : "#E2E8F0",
                color: esOscuro ? "#CBD5E1" : "#0F172A"
              }}
              className="px-3 py-1.5 rounded-full font-semibold cursor-pointer hover:opacity-80 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ backgroundColor: colorBotonActivo, color: "#FFFFFF" }}
              className="px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-90 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Receta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
