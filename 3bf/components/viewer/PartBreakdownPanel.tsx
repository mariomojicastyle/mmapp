"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { 
  Search, 
  Layers, 
  Lightbulb, 
  LightbulbOff, 
  Box, 
  ChevronDown, 
  ChevronRight
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
    setHoveredPiece,
    coloresApariencia,
    esquemaColor
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
    if (kLow.includes("maquinado") || kLow.includes("perforado")) {
      return capas.find((c) => c.nombre.toLowerCase().includes("perforad") || c.id === "capa_perforados")?.id || capas[0]?.id;
    }
    if (categoria === "Herrajes" || kLow.includes("perno") || kLow.includes("tornillo") || kLow.includes("corredera")) {
      return capas.find((c) => c.nombre.toLowerCase().includes("herraje") || c.id === "capa_herrajes" || c.id === "capa_acero")?.id || capas[0]?.id;
    }
    if (kLow.includes("caja")) {
      return capas.find((c) => c.id === "capa_zincado" || c.id === "capa_zinc" || c.nombre.toLowerCase().includes("zinc"))?.id || capas[0]?.id;
    }
    if (kLow.includes("tarugo") || kLow.includes("soporte")) {
      return capas.find((c) => c.id === "capa_madera" || c.nombre.toLowerCase().includes("madera"))?.id || capas[0]?.id;
    }
    if (kLow.includes("mdp")) return capas.find((c) => c.nombre.toLowerCase() === "mdp" || c.id === "capa_mdp")?.id || capas[0]?.id;
    if (kLow.includes("mdf")) return capas.find((c) => c.nombre.toLowerCase() === "mdf" || c.id === "capa_mdf")?.id || capas[0]?.id;
    if (kLow.includes("balance") || kLow.includes("back")) {
      return capas.find((c) => c.id === "capa_back" || c.id === "capa_espaldar" || c.nombre.toLowerCase().includes("back"))?.id || capas[0]?.id;
    }
    // 🪵 Para cualquier lámina / tablero (Cubierta, Lateral, Frente, Tapa, Cajón, etc.), asignar Capa Tono por defecto
    const capaTono = capas.find((c) => c.id === "capa_tono" || c.nombre.toLowerCase() === "tono" || c.nombre.toLowerCase().includes("tono"));
    return capaTono?.id || capas[0]?.id || "capa_tono";
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

    const isBoard = categoria === "Tableros";
    const rawCapaId = asignacion?.capaId;
    const cleanCapaId = (isBoard && rawCapaId === "capa_acero") ? "por_defecto" : (rawCapaId || "por_defecto");

    return {
      parteKey,
      nombreLimpio: cleanName,
      categoria,
      cantidad: count,
      capaId: cleanCapaId,
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
    <div 
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles,
        color: coloresApariencia?.textoPrincipal
      }}
      className="flex flex-col h-full text-xs select-none"
    >
      {/* 🔍 Buscador Superior */}
      <div 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-2.5 border-b shrink-0 flex flex-col gap-2"
      >
        <div className="relative">
          <Search 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-70" 
          />
          <input
            type="text"
            placeholder="Buscar componente o herraje..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal
            }}
            className="w-full pl-8 pr-3 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:opacity-60 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            Componentes del Modelo ({partesFiltradas.length})
          </span>
        </div>
      </div>

      {/* 🏷️ Franja Gris de Títulos de Columnas (Estilo Ficha de Capas) */}
      <div 
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion,
          color: coloresApariencia?.textoSecundario,
          borderColor: coloresApariencia?.bordePaneles
        }}
        className="flex items-center justify-between py-2 px-3 border-b text-[10px] uppercase font-semibold tracking-wider shrink-0 select-none z-10"
      >
        <span className="pl-1 flex-1">Componente</span>
        <div className="flex items-center gap-2 shrink-0 pr-1">
          <span className="w-6 text-center" title="Visibilidad">Vis</span>
          <span className="w-[130px] text-left pl-1">Capa</span>
        </div>
      </div>

      {/* 🌳 Árbol Jerárquico con Selector de Capa en Línea (Direct Dropdown) */}
      <div 
        style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
        className="flex-1 overflow-y-auto p-2 custom-scrollbar font-sans"
      >
        {/* Nodo Raíz: Objeto Padre (Cubierta / Estructura) */}
        <div className="space-y-1">
          <div 
            onClick={() => setNodoPadreAbierto(!nodoPadreAbierto)}
            style={{ color: coloresApariencia?.textoPrincipal }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded hover:opacity-80 transition cursor-pointer font-bold text-xs"
          >
            {nodoPadreAbierto ? (
              <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5 shrink-0" />
            )}
            <Box style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-4 h-4 shrink-0" />
            <span className="truncate text-[12px]">{nombreObjetoPadre}</span>
          </div>

          {/* Lista de Componentes y Herrajes con Selector Directo de Capa */}
          {nodoPadreAbierto && (
            <div 
              style={{ borderColor: coloresApariencia?.bordePaneles }}
              className="ml-2 pl-2 border-l space-y-1 mt-1"
            >
              {partesFiltradas.length > 0 ? (
                partesFiltradas.map((parte) => {
                  const isSel = parte.parteKey === parteSeleccionadaKey;
                  const capaEfectivaId = parte.capaId === "por_defecto" ? getCapaSugeridaId(parte.parteKey, parte.categoria) : parte.capaId;
                  const capaItem = capas.find((c) => c.id === capaEfectivaId) || capas[0];

                  return (
                    <div
                      key={parte.parteKey}
                      onClick={() => {
                        setParteSeleccionadaKey(parte.parteKey);
                      }}
                      onMouseEnter={() => {
                        if (parte.cantidad > 0) setHoveredPiece(parte.nombreLimpio);
                      }}
                      onMouseLeave={() => setHoveredPiece(null)}
                      style={isSel ? {
                        backgroundColor: esquemaColor === "oscuro" ? "rgba(8, 145, 178, 0.20)" : "rgba(8, 145, 178, 0.10)",
                        borderColor: coloresApariencia?.botonActivo || "#0891B2",
                      } : {
                        borderColor: "transparent",
                      }}
                      className="group flex items-center justify-between py-1 px-1.5 rounded border transition-all hover:opacity-90"
                    >
                      {/* Lado Izquierdo: Muestra de Color + Nombre del Componente */}
                      <div className="flex items-center gap-1.5 min-w-0 pr-2 flex-1">
                        {/* Bloque de Color de la Capa */}
                        <div 
                          className="w-3.5 h-3.5 rounded shrink-0 border shadow-xs"
                          style={{ 
                            backgroundColor: capaItem?.color || "#8A9EA7",
                            borderColor: coloresApariencia?.bordePaneles || "#475569"
                          }}
                          title={`Color de capa: ${capaItem?.nombre}`}
                        />
                        <span 
                          style={{ color: coloresApariencia?.textoPrincipal }}
                          className="truncate text-[11px] font-medium"
                          title={parte.nombreLimpio}
                        >
                          {parte.nombreLimpio}
                        </span>
                        {parte.cantidad > 1 && (
                          <span 
                            style={{ color: coloresApariencia?.textoSecundario }}
                            className="text-[9px] font-mono font-bold shrink-0 opacity-75"
                          >
                            x{parte.cantidad}
                          </span>
                        )}
                      </div>

                      {/* Lado Derecho: Visibilidad a la izquierda + Selector Desplegable de Capas Maestras */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Toggle de Visibilidad Rápido (Ubicado a la izquierda de la capa) */}
                        <button
                          onClick={() => toggleVisibilidadParte(parte.parteKey)}
                          title={parte.visible ? "Ocultar componente" : "Mostrar componente"}
                          style={{
                            color: parte.visible 
                              ? (coloresApariencia?.objetosSeleccionados || "#FF9500") 
                              : (coloresApariencia?.textoSecundario || "#64748B"),
                          }}
                          className={`p-1 rounded transition hover:scale-110 cursor-pointer w-6 flex items-center justify-center ${
                            !parte.visible ? "opacity-40" : "opacity-100"
                          }`}
                        >
                          {parte.visible ? <Lightbulb className="w-3.5 h-3.5 fill-current" /> : <LightbulbOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Selector Desplegable de Capa */}
                        <select
                          value={capaEfectivaId}
                          onChange={(e) => asignarParteACapa(parte.parteKey, e.target.value, parte.nombreLimpio)}
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal
                          }}
                          className="py-1 px-2 pr-6 border rounded-md text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer transition shadow-2xs w-[130px] max-w-[130px] truncate"
                          title={`Asignar capa a ${parte.nombreLimpio}`}
                        >
                          {capas.map((capa) => (
                            <option 
                              key={capa.id} 
                              value={capa.id}
                              style={{
                                backgroundColor: coloresApariencia?.fondoPaneles || "#0B0F17",
                                color: coloresApariencia?.textoPrincipal || "#F1F5F9"
                              }}
                            >
                              {capa.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div 
                  style={{ color: coloresApariencia?.textoSecundario }}
                  className="text-[11px] py-3 text-center italic"
                >
                  No se encontraron componentes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
