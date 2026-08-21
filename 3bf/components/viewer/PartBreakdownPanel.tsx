"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { 
  Search, 
  Layers, 
  Palette, 
  Lightbulb, 
  LightbulbOff, 
  Box, 
  ChevronDown, 
  ChevronRight,
  Info
} from "lucide-react";

export default function PartBreakdownPanel() {
  const {
    resultado,
    parametros,
    instancias,
    objetoActivoId,
    capas,
    materialesPBR,
    asignacionesPartes,
    asignarParteACapa,
    asignarParteAMaterial,
    toggleVisibilidadParte,
    setHoveredPiece
  } = use3BFStore();

  const [busqueda, setBusqueda] = useState("");
  const [nodoPadreAbierto, setNodoPadreAbierto] = useState(true);
  const [parteSeleccionadaKey, setParteSeleccionadaKey] = useState<string | null>(null);

  // Obtener mallas del objeto activo o del resultado general
  const instanciaActiva = objetoActivoId ? instancias[objetoActivoId] : null;
  const res = instanciaActiva?.resultado || resultado;
  const realMeshes = res?.real_meshes || [];
  
  const nombreObjetoPadre = instanciaActiva?.nombreVisible || instanciaActiva?.definitionId || parametros.model_id || "Cubierta";

  // 1. Obtener todas las salidas declaradas en el GHX activo + las mallas reales generadas
  const declaredOutputs = res?.declared_outputs || [];
  const meshNames = realMeshes.map((m: any) => m.name);
  const allOutputKeys = Array.from(new Set([...declaredOutputs, ...meshNames])).filter(Boolean);

  const getCapaSugeridaId = (parteKey: string, categoria: string) => {
    const kLow = parteKey.toLowerCase();
    if (kLow.includes("maquinado")) return capas.find((c) => c.nombre.toLowerCase().includes("perforad"))?.id || capas[0]?.id;
    if (categoria === "Herrajes") return capas.find((c) => c.nombre.toLowerCase().includes("herraje") || c.nombre.toLowerCase().includes("acero"))?.id || capas[0]?.id;
    if (kLow.includes("mdp")) return capas.find((c) => c.nombre.toLowerCase() === "mdp")?.id || capas[0]?.id;
    if (kLow.includes("mdf")) return capas.find((c) => c.nombre.toLowerCase() === "mdf")?.id || capas[0]?.id;
    if (kLow.includes("color")) return capas.find((c) => c.nombre.toLowerCase().includes("tono"))?.id || capas[0]?.id;
    if (kLow.includes("balance")) return capas.find((c) => c.nombre.toLowerCase().includes("back") || c.nombre.toLowerCase().includes("espaldar"))?.id || capas[0]?.id;
    return capas[0]?.id || "capa_aluminio";
  };

  // Mapear partes completas del Grasshopper
  const partesUnicas = allOutputKeys.map((parteKey) => {
    const cleanName = parteKey.replace(/^RH_OUT:/, "").trim();
    const count = realMeshes.filter((m: any) => m.name === parteKey).length;
    const asignacion = asignacionesPartes[parteKey];

    const kLow = parteKey.toLowerCase();
    let categoria = "Estructura";
    if (kLow.includes("maquinado") || kLow.includes("perforado")) {
      categoria = "Mecanizados";
    } else if (kLow.includes("perno") || kLow.includes("caja") || kLow.includes("tarugo") || kLow.includes("tornillo") || kLow.includes("soporte") || kLow.includes("corredera") || kLow.includes("pata")) {
      categoria = "Herrajes";
    } else if (kLow.includes("cubierta") || kLow.includes("mdp") || kLow.includes("mdf") || kLow.includes("cajon") || kLow.includes("cajón") || kLow.includes("lateral") || kLow.includes("entrepaño") || kLow.includes("color") || kLow.includes("balance") || kLow.includes("division")) {
      categoria = "Tableros";
    }

    return {
      parteKey,
      nombreLimpio: cleanName,
      categoria,
      cantidad: count,
      capaId: asignacion?.capaId || "por_defecto",
      materialId: asignacion?.materialId || "por_capa",
      visible: asignacion?.visible ?? true,
    };
  });

  // Auto-seleccionar primera parte si no hay ninguna seleccionada
  React.useEffect(() => {
    if (!parteSeleccionadaKey && partesUnicas.length > 0) {
      setParteSeleccionadaKey(partesUnicas[0].parteKey);
    }
  }, [partesUnicas, parteSeleccionadaKey]);

  const partesFiltradas = partesUnicas.filter((p) => {
    return p.nombreLimpio.toLowerCase().includes(busqueda.toLowerCase()) ||
           p.parteKey.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full text-xs select-none">
      {/* 🔍 Buscador Superior */}
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar componente o herraje..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* 🌳 Árbol Jerárquico con Selector de Capa en Línea (Direct Dropdown) */}
      <div className="flex-1 overflow-y-auto p-2 bg-white dark:bg-slate-900 custom-scrollbar font-sans">
        {/* Nodo Raíz: Objeto Padre (Cubierta / Estructura) */}
        <div className="space-y-1">
          <div 
            onClick={() => setNodoPadreAbierto(!nodoPadreAbierto)}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer font-bold text-slate-800 dark:text-slate-100 text-xs"
          >
            {nodoPadreAbierto ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <Box className="w-4 h-4 text-cyan-600 shrink-0" />
            <span className="truncate text-[12px]">{nombreObjetoPadre}</span>
            <span className="ml-auto text-[10px] font-mono font-normal text-slate-400">
              ({partesFiltradas.length})
            </span>
          </div>

          {/* Lista de Componentes y Herrajes con Selector Directo de Capa */}
          {nodoPadreAbierto && (
            <div className="ml-2 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-1 mt-1">
              {partesFiltradas.length > 0 ? (
                partesFiltradas.map((parte) => {
                  const isSel = parte.parteKey === parteSeleccionadaKey;
                  const capaEfectivaId = parte.capaId === "por_defecto" ? getCapaSugeridaId(parte.parteKey, parte.categoria) : parte.capaId;
                  const capaItem = capas.find((c) => c.id === capaEfectivaId) || capas[0];
                  const materialDeCapa = materialesPBR.find((m) => m.id === capaItem?.materialId) || materialesPBR[0];

                  return (
                    <div
                      key={parte.parteKey}
                      onClick={() => {
                        setParteSeleccionadaKey(parte.parteKey);
                        if (parte.cantidad > 0) setHoveredPiece(parte.nombreLimpio);
                      }}
                      onMouseEnter={() => {
                        if (parte.cantidad > 0) setHoveredPiece(parte.nombreLimpio);
                      }}
                      onMouseLeave={() => setHoveredPiece(null)}
                      className={`group flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                        isSel
                          ? "bg-cyan-50/90 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800/80 shadow-xs"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      {/* Lado Izquierdo: Muestra de Color + Nombre del Componente */}
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        {/* Bloque de Color de la Capa */}
                        <div 
                          className="w-3.5 h-3.5 rounded shrink-0 border border-black/20 shadow-xs"
                          style={{ backgroundColor: capaItem?.color || "#8A9EA7" }}
                          title={`Color de capa: ${capaItem?.nombre}`}
                        />
                        <span 
                          className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-200"
                          title={parte.nombreLimpio}
                        >
                          {parte.nombreLimpio}
                        </span>
                        {parte.cantidad > 1 && (
                          <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
                            x{parte.cantidad}
                          </span>
                        )}
                      </div>

                      {/* Lado Derecho: Selector Desplegable de Capa en L?nea */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={capaEfectivaId}
                          onChange={(e) => {
                            asignarParteACapa(parte.parteKey, e.target.value, parte.nombreLimpio);
                          }}
                          className="py-1 px-2 pr-6 bg-slate-100 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition shadow-2xs max-w-[125px] truncate"
                          title={`Asignar capa a ${parte.nombreLimpio}`}
                        >
                          {capas.map((capa) => (
                            <option key={capa.id} value={capa.id}>
                              {capa.nombre}
                            </option>
                          ))}
                        </select>

                        {/* Toggle de Visibilidad R?pido */}
                        <button
                          onClick={() => toggleVisibilidadParte(parte.parteKey)}
                          title={parte.visible ? "Ocultar componente" : "Mostrar componente"}
                          className={`p-1 rounded transition ${
                            parte.visible
                              ? "text-amber-500 hover:text-amber-600"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        >
                          {parte.visible ? <Lightbulb className="w-3 h-3 fill-amber-400" /> : <LightbulbOff className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-slate-400 py-3 text-center italic">
                  No se encontraron componentes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ?? Pie Informativo */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] text-slate-500 space-y-0.5 shrink-0">
        <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          Asignaci?n Directa de Capas:
        </p>
        <p className="leading-tight text-[9.5px]">
          Al cambiar la capa de cualquier componente desde el selector, este hereda autom?ticamente el material PBR de esa capa para el visor y la exportaci?n a <strong>Blender</strong>.
        </p>
      </div>
    </div>
  );
}
