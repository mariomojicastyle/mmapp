"use client";

import React, { useState } from "react";
import { use3BFStore, CapaDef } from "@/lib/store";
import { 
  Search, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Lightbulb, 
  LightbulbOff, 
  Lock, 
  Unlock, 
  Check,
  Sparkles
} from "lucide-react";

export default function LayerManagerPanel() {
  const {
    capas,
    materialesPBR,
    crearCapa,
    actualizarCapa,
    eliminarCapa,
    toggleVisibilidadCapa,
    toggleBloqueoCapa,
    resetCapasYMateriales,
    setMaterialSeleccionadoId,
    setPestanaNPanel,
    coloresApariencia,
    esquemaColor
  } = use3BFStore();

  const [busqueda, setBusqueda] = useState("");
  const [capaEnEdicionId, setCapaEnEdicionId] = useState<string | null>(null);
  const [nombreTemp, setNombreTemp] = useState("");

  const capasFiltradas = capas.filter((c) => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleCrearCapa = () => {
    const defaultMat = materialesPBR[0]?.id || "mat_acero";
    const nuevaId = crearCapa({
      nombre: `Capa_${capas.length + 1}`,
      color: "#8A9EA7",
      materialId: defaultMat,
      visible: true,
      bloqueada: false,
      activa: false,
    });
    iniciarEdicion(nuevaId, `Capa_${capas.length + 1}`);
  };

  const iniciarEdicion = (id: string, nombreActual: string) => {
    setCapaEnEdicionId(id);
    setNombreTemp(nombreActual);
  };

  const guardarEdicionNombre = (id: string) => {
    if (nombreTemp.trim()) {
      actualizarCapa(id, { nombre: nombreTemp.trim() });
    }
    setCapaEnEdicionId(null);
  };

  const irAEditarMaterial = (materialId: string) => {
    setMaterialSeleccionadoId(materialId);
    setPestanaNPanel("materiales");
  };

  return (
    <div 
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles,
        color: coloresApariencia?.textoPrincipal
      }}
      className="flex flex-col h-full text-xs select-none"
    >
      {/* 🔍 Barra Superior: Búsqueda y Acciones de Capa */}
      <div 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-3 border-b space-y-2 shrink-0"
      >
        <div className="relative">
          <Search 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-70" 
          />
          <input
            type="text"
            placeholder="Buscar capa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal
            }}
            className="w-full pl-8 pr-3 py-1.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:opacity-60 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] font-semibold uppercase tracking-wider"
          >
            Capas del Modelo ({capasFiltradas.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCrearCapa}
              style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891B2" }}
              className="flex items-center gap-1 px-2.5 py-1 text-white rounded text-[11px] font-medium transition shadow-2xs hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Nueva Capa
            </button>
            <button
              onClick={resetCapasYMateriales}
              title="Restablecer Capas por Defecto"
              style={{ color: coloresApariencia?.textoSecundario }}
              className="p-1 hover:opacity-100 rounded transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 📋 Tabla de Capas (Estilo Panel de Capas de Rhino 8) */}
      <div 
        style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        <table className="w-full text-left border-collapse">
          <thead 
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              color: coloresApariencia?.textoSecundario,
              borderColor: coloresApariencia?.bordePaneles
            }}
            className="sticky top-0 text-[10px] uppercase font-semibold border-b z-10"
          >
            <tr>
              <th className="py-2 px-2.5">Capa</th>
              <th className="py-2 px-1 w-7 text-center" title="Visibilidad">Vis</th>
              <th className="py-2 px-1.5 w-7 text-center" title="Color de Capa">Col</th>
              <th className="py-2 px-2">Material Asignado</th>
              <th className="py-2 px-1.5 w-7 text-center"></th>
            </tr>
          </thead>
          <tbody 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="divide-y font-sans"
          >
            {capasFiltradas.map((capa) => {
              const materialAsignado = materialesPBR.find((m) => m.id === capa.materialId) || materialesPBR[0];

              return (
                <tr
                  key={capa.id}
                  style={{
                    borderColor: coloresApariencia?.bordePaneles
                  }}
                  className="group transition-colors hover:opacity-90"
                >
                  {/* Col 1: Nombre de Capa (Doble clic o clic para editar) */}
                  <td className="py-1.5 px-2.5">
                    {capaEnEdicionId === capa.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={nombreTemp}
                        onChange={(e) => setNombreTemp(e.target.value)}
                        onBlur={() => guardarEdicionNombre(capa.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") guardarEdicionNombre(capa.id);
                          if (e.key === "Escape") setCapaEnEdicionId(null);
                        }}
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.botonActivo || "#0891B2",
                          color: coloresApariencia?.textoPrincipal
                        }}
                        className="w-full px-1.5 py-0.5 border rounded text-xs focus:outline-none"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => iniciarEdicion(capa.id, capa.nombre)}
                        style={{ color: coloresApariencia?.textoPrincipal }}
                        className="cursor-pointer truncate max-w-[90px] sm:max-w-[120px] font-medium"
                        title={`${capa.nombre} (Doble clic para renombrar)`}
                      >
                        {capa.nombre}
                      </div>
                    )}
                  </td>

                  {/* Col 2: Visibilidad (Bombillo) */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => toggleVisibilidadCapa(capa.id)}
                      title={capa.visible ? "Ocultar capa" : "Mostrar capa"}
                      style={{
                        color: capa.visible 
                          ? (coloresApariencia?.objetosSeleccionados || "#FF9500") 
                          : (coloresApariencia?.textoSecundario || "#64748B")
                      }}
                      className={`p-1 rounded transition hover:scale-110 cursor-pointer ${
                        !capa.visible ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      {capa.visible ? <Lightbulb className="w-3.5 h-3.5 fill-current" /> : <LightbulbOff className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* Col 3: Color de Capa */}
                  <td className="py-1.5 px-1.5 text-center">
                    <div 
                      style={{ borderColor: coloresApariencia?.bordePaneles }}
                      className="relative inline-block w-4 h-4 rounded overflow-hidden shadow-2xs border"
                    >
                      <input
                        type="color"
                        value={capa.color}
                        onChange={(e) => actualizarCapa(capa.id, { color: e.target.value })}
                        title="Cambiar color de capa"
                        className="absolute -top-2 -left-2 w-8 h-8 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: capa.color }} />
                    </div>
                  </td>

                  {/* Col 6: Material PBR Asignado (Selector con Esfera Preview) */}
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5">
                      {/* Esfera PBR 3D simulada en miniatura (Iluminada con volumen, reflejos y especularidad) */}
                      <button
                        onClick={() => materialAsignado && irAEditarMaterial(materialAsignado.id)}
                        title={`Editar shader de ${materialAsignado?.nombre || "Material"}`}
                        className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full shadow-inner relative overflow-hidden border border-black/30 flex items-center justify-center shrink-0 cursor-pointer transition hover:scale-110"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                          backgroundColor: materialAsignado?.colorBase || "#888",
                          backgroundImage: materialAsignado?.texturaUrl
                            ? `url(${materialAsignado.texturaUrl})`
                            : `radial-gradient(circle at 35% 30%, rgba(255,255,255,${0.85 * (1 - (materialAsignado?.rugosidad ?? 0.4))}), rgba(0,0,0,${0.65 * (1 - (materialAsignado?.rugosidad ?? 0.4))}) 75%)`,
                          backgroundSize: "cover",
                        }}
                      >
                        {/* Brillo especular 3D */}
                        <div 
                          className="absolute top-[2px] left-[3px] w-2 h-1.5 rounded-full bg-white/80 blur-[0.3px] pointer-events-none"
                          style={{ opacity: 1 - (materialAsignado?.rugosidad ?? 0.4) }}
                        />
                        {materialAsignado && materialAsignado.metalico > 0.5 && (
                          <Sparkles className="w-2.5 h-2.5 text-white/90 absolute bottom-0.5 right-0.5 pointer-events-none" />
                        )}
                      </button>

                      <select
                        value={capa.materialId}
                        onChange={(e) => actualizarCapa(capa.id, { materialId: e.target.value })}
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoPrincipal
                        }}
                        className="flex-1 py-0.5 px-1.5 border rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500 truncate cursor-pointer"
                      >
                        {materialesPBR.map((mat) => (
                          <option 
                            key={mat.id} 
                            value={mat.id}
                            style={{
                              backgroundColor: coloresApariencia?.fondoPaneles || "#0B0F17",
                              color: coloresApariencia?.textoPrincipal || "#F1F5F9"
                            }}
                          >
                            {mat.nombre} ({mat.tipo})
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Col 7: Acciones */}
                  <td className="py-1.5 px-1.5 text-center">
                    {capas.length > 1 && (
                      <button
                        onClick={() => eliminarCapa(capa.id)}
                        title="Eliminar capa"
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:scale-110 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
