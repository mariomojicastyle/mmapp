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
  Copy,
  Sliders,
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
    setPestanaNPanel
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
    <div className="flex flex-col h-full text-xs select-none">
      {/* ?? Barra Superior: B?squeda y Acciones de Capa */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar capa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Capas del Modelo ({capasFiltradas.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCrearCapa}
              className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[11px] font-medium transition shadow-sm"
            >
              <Plus className="w-3 h-3" /> Nueva Capa
            </button>
            <button
              onClick={resetCapasYMateriales}
              title="Restablecer Capas por Defecto"
              className="p-1 text-slate-400 hover:text-cyan-600 rounded transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ?? Tabla de Capas (Estilo Panel de Capas de Rhino 8) */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800/90 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 z-10">
            <tr>
              <th className="py-2 px-2 w-7 text-center" title="Capa Activa">Act</th>
              <th className="py-2 px-2">Capa</th>
              <th className="py-2 px-1 w-7 text-center" title="Visibilidad (??)">Vis</th>
              <th className="py-2 px-1 w-7 text-center" title="Bloqueo (??)">Bloq</th>
              <th className="py-2 px-1.5 w-7 text-center" title="Color de Capa">Col</th>
              <th className="py-2 px-2">Material Asignado</th>
              <th className="py-2 px-1.5 w-7 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
            {capasFiltradas.map((capa) => {
              const materialAsignado = materialesPBR.find((m) => m.id === capa.materialId) || materialesPBR[0];
              const esActiva = capa.activa;

              return (
                <tr
                  key={capa.id}
                  className={`group transition-colors ${
                    esActiva
                      ? "bg-cyan-50/70 dark:bg-cyan-950/30 font-medium"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  {/* Col 1: Capa Activa Check */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={() => actualizarCapa(capa.id, { activa: true })}
                      title={esActiva ? "Capa de trabajo activa" : "Establecer como capa activa"}
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                        esActiva
                          ? "border-cyan-600 bg-cyan-600 text-white"
                          : "border-slate-300 dark:border-slate-600 hover:border-cyan-500"
                      }`}
                    >
                      {esActiva && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Col 2: Nombre de Capa (Doble clic o clic para editar) */}
                  <td className="py-1.5 px-2">
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
                        className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-cyan-500 rounded text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => iniciarEdicion(capa.id, capa.nombre)}
                        className="cursor-pointer truncate max-w-[90px] sm:max-w-[120px] text-slate-800 dark:text-slate-200"
                        title={`${capa.nombre} (Doble clic para renombrar)`}
                      >
                        {capa.nombre}
                      </div>
                    )}
                  </td>

                  {/* Col 3: Visibilidad (?? Bombillo) */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => toggleVisibilidadCapa(capa.id)}
                      title={capa.visible ? "Ocultar capa (??)" : "Mostrar capa"}
                      className={`p-1 rounded transition ${
                        capa.visible
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {capa.visible ? <Lightbulb className="w-3.5 h-3.5 fill-amber-400" /> : <LightbulbOff className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* Col 4: Bloqueo (?? Candado) */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => toggleBloqueoCapa(capa.id)}
                      title={capa.bloqueada ? "Desbloquear capa" : "Bloquear capa"}
                      className={`p-1 rounded transition ${
                        capa.bloqueada
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {capa.bloqueada ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* Col 5: Color de Capa */}
                  <td className="py-1.5 px-1.5 text-center">
                    <div className="relative inline-block w-4 h-4 rounded overflow-hidden shadow-sm border border-slate-300 dark:border-slate-600">
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
                      {/* Esfera preview del material */}
                      <button
                        onClick={() => materialAsignado && irAEditarMaterial(materialAsignado.id)}
                        title={`Editar shader de ${materialAsignado?.nombre || "Material"}`}
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner overflow-hidden relative"
                        style={{
                          backgroundColor: materialAsignado?.colorBase || "#888",
                          backgroundImage: materialAsignado?.texturaUrl
                            ? `url(${materialAsignado.texturaUrl})`
                            : undefined,
                          backgroundSize: "cover",
                        }}
                      />

                      <select
                        value={capa.materialId}
                        onChange={(e) => actualizarCapa(capa.id, { materialId: e.target.value })}
                        className="flex-1 py-0.5 px-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 truncate"
                      >
                        {materialesPBR.map((mat) => (
                          <option key={mat.id} value={mat.id}>
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
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
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

      {/* 💡 Pie de Información de Capas */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] text-slate-500 space-y-1">
        <p className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          Jerarquía de Materiales 3DBimFab:
        </p>
        <p>
          Las mallas del Grasshopper asignadas a cada capa heredan automáticamente el material PBR de esa capa. Al exportar a <strong>GLB</strong>, los materiales conservarán estos nombres exactos para render inmediato en <strong>Blender</strong>.
        </p>
      </div>
    </div>
  );
}
