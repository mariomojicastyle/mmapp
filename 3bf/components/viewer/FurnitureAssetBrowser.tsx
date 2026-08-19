"use client";

import React, { useState, useEffect } from "react";
import { use3BFStore, CarpetaMuebleNode, MuebleGuardadoItem } from "@/lib/store";
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Search,
  Save,
  Box,
  Layers,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Tag,
  RefreshCw,
  Check
} from "lucide-react";

export default function FurnitureAssetBrowser() {
  const {
    arbolCarpetasMuebles,
    mueblesGuardados,
    cargarArbolMuebles,
    carpetaSeleccionadaId,
    setCarpetaSeleccionadaId,
    abrirMueble,
    setModalGuardarComoAbierto,
    crearCarpetaMueble,
    renombrarMuebleGuardado,
    eliminarMuebleGuardado,
    urlGoogleDrive,
  } = use3BFStore();

  const [busqueda, setBusqueda] = useState("");
  const [carpetasExpandidas, setCarpetasExpandidas] = useState<Record<string, boolean>>({});
  const [creandoMarca, setCreandoMarca] = useState(false);
  const [nombreNuevaMarca, setNombreNuevaMarca] = useState("");
  const [creandoSubcarpetaPara, setCreandoSubcarpetaPara] = useState<string | null>(null);
  const [nombreNuevaSubcarpeta, setNombreNuevaSubcarpeta] = useState("");

  // Estado para edición inline del nombre de mueble
  const [editandoMuebleId, setEditandoMuebleId] = useState<string | null>(null);
  const [nombreTemporal, setNombreTemporal] = useState("");
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    cargarArbolMuebles();
  }, []);

  const toggleExpandir = (id: string) => {
    setCarpetasExpandidas((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handleCrearMarca = async () => {
    if (!nombreNuevaMarca.trim()) return;
    await crearCarpetaMueble(nombreNuevaMarca.trim(), "marca", null);
    setNombreNuevaMarca("");
    setCreandoMarca(false);
  };

  const handleCrearSubcarpeta = async (padreId: string) => {
    if (!nombreNuevaSubcarpeta.trim()) return;
    await crearCarpetaMueble(nombreNuevaSubcarpeta.trim(), "tipologia", padreId);
    setNombreNuevaSubcarpeta("");
    setCreandoSubcarpetaPara(null);
  };

  const handleIniciarEdicion = (mueble: MuebleGuardadoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditandoMuebleId(mueble.id);
    setNombreTemporal(mueble.nombre);
  };

  const handleGuardarEdicion = async (id: string) => {
    if (nombreTemporal.trim()) {
      await renombrarMuebleGuardado(id, nombreTemporal.trim());
    }
    setEditandoMuebleId(null);
  };

  const handleEliminarMueble = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este mueble del catálogo?")) {
      await eliminarMuebleGuardado(id);
    }
  };

  const handleSincronizarDrive = async () => {
    setSincronizando(true);
    await cargarArbolMuebles();
    setTimeout(() => setSincronizando(false), 600);
  };

  // Filtrado de Muebles según la carpeta seleccionada y búsqueda
  const mueblesFiltrados = mueblesGuardados.filter((m) => {
    // Filtro por búsqueda
    const coincideBusqueda =
      !busqueda.trim() ||
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.tipologia.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;

    // Filtro por carpeta
    if (carpetaSeleccionadaId === "all") return true;

    // Si la carpeta seleccionada es una marca
    const esMarca = arbolCarpetasMuebles.find((marca) => marca.id === carpetaSeleccionadaId);
    if (esMarca) {
      return m.marca.toLowerCase() === esMarca.nombre.toLowerCase();
    }

    // Si la carpeta seleccionada es una subcarpeta tipológica (ej: "rta-design/escritorios")
    for (const marca of arbolCarpetasMuebles) {
      const sub = marca.subcarpetas?.find((s) => s.id === carpetaSeleccionadaId);
      if (sub) {
        return (
          m.marca.toLowerCase() === marca.nombre.toLowerCase() &&
          m.tipologia.toLowerCase() === sub.nombre.toLowerCase()
        );
      }
    }

    return true;
  });

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B0F17]">
      
      {/* ========================================================================= */}
      {/* 🔍 BARRA SUPERIOR BLENDER STYLE: BÚSQUEDA & BOTÓN GUARDAR COMO            */}
      {/* ========================================================================= */}
      <div className="p-2.5 border-b border-slate-200 dark:border-cyan-900/40 bg-slate-50/70 dark:bg-[#0E131F]/80 flex items-center justify-between gap-2 shrink-0">
        
        {/* Input Buscador */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar muebles o marcas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#090D14] border border-slate-200 dark:border-cyan-900/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Botón Principal: Guardar Como */}
        <button
          onClick={() => setModalGuardarComoAbierto(true)}
          title="Guardar el diseño actual como un mueble en el catálogo de Google Drive"
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar como</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📁 CUERPO DEL ASSET BROWSER: PANEL IZQUIERDO (ÁRBOL) + DERECHO (GRID)      */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO: Árbol de Catálogos / Marcas (Estilo Blender Asset Browser) */}
        <div className="w-48 sm:w-56 border-r border-slate-200 dark:border-cyan-900/40 bg-slate-50/40 dark:bg-[#0B0F17]/60 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          
          {/* Cabecera del Árbol */}
          <div className="p-2 border-b border-slate-200/80 dark:border-cyan-900/30 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Catálogos & Marcas</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSincronizarDrive}
                title="Sincronizar carpetas con Google Drive"
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? "animate-spin text-cyan-600" : ""}`} />
              </button>
              {!creandoMarca && (
                <button
                  onClick={() => setCreandoMarca(true)}
                  title="Agregar nueva marca"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Formulario rápido para crear nueva marca */}
          {creandoMarca && (
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/40 border-b border-cyan-200 dark:border-cyan-900/50 flex flex-col gap-1.5">
              <input
                type="text"
                placeholder="Nombre de marca..."
                value={nombreNuevaMarca}
                onChange={(e) => setNombreNuevaMarca(e.target.value)}
                className="px-2 py-1 text-[11px] rounded bg-white dark:bg-[#0B0F17] border border-cyan-400 text-slate-800 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={handleCrearMarca}
                  className="px-2 py-0.5 text-[9px] bg-cyan-600 text-white rounded font-bold hover:bg-cyan-500"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setCreandoMarca(false)}
                  className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-800"
                >
                  X
                </button>
              </div>
            </div>
          )}

          {/* Opción "All / Todos los Muebles" */}
          <div className="p-1">
            <button
              onClick={() => setCarpetaSeleccionadaId("all")}
              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between font-semibold transition cursor-pointer ${
                carpetaSeleccionadaId === "all"
                  ? "bg-cyan-600 text-white shadow-xs font-bold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Todos los Muebles</span>
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${carpetaSeleccionadaId === "all" ? "bg-cyan-800 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
                {mueblesGuardados.length}
              </span>
            </button>
          </div>

          {/* Lista de Marcas y Subcarpetas */}
          <div className="flex-1 p-1 flex flex-col gap-0.5">
            {arbolCarpetasMuebles.map((marca) => {
              const expandida = carpetasExpandidas[marca.id] !== false;
              const isSelectedMarca = carpetaSeleccionadaId === marca.id;
              const countMarca = mueblesGuardados.filter(
                (m) => m.marca.toLowerCase() === marca.nombre.toLowerCase()
              ).length;

              return (
                <div key={marca.id} className="flex flex-col">
                  {/* Fila de la Marca */}
                  <div
                    className={`group flex items-center justify-between px-2 py-1 rounded-lg text-xs transition cursor-pointer ${
                      isSelectedMarca
                        ? "bg-cyan-600/15 border border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div 
                      onClick={() => setCarpetaSeleccionadaId(marca.id)}
                      className="flex-1 flex items-center gap-1.5 truncate"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandir(marca.id);
                        }}
                        className="p-0.5 hover:bg-slate-300 dark:hover:bg-slate-700 rounded"
                      >
                        {expandida ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelectedMarca ? "text-cyan-600 fill-cyan-600" : "text-amber-500"}`} />
                      <span className="truncate">{marca.nombre}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {countMarca > 0 && (
                        <span className="text-[9px] font-mono text-slate-400">
                          {countMarca}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreandoSubcarpetaPara(marca.id);
                        }}
                        title={`Agregar subcarpeta a ${marca.nombre}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-600 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Input rápido para crear subcarpeta tipológica */}
                  {creandoSubcarpetaPara === marca.id && (
                    <div className="ml-5 my-1 p-1 bg-cyan-50 dark:bg-cyan-950/40 rounded border border-cyan-400 flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Ej: Escritorios..."
                        value={nombreNuevaSubcarpeta}
                        onChange={(e) => setNombreNuevaSubcarpeta(e.target.value)}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-white dark:bg-[#0B0F17] text-slate-800 dark:text-white"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleCrearSubcarpeta(marca.id)}
                          className="px-1.5 py-0.5 text-[8px] bg-cyan-600 text-white rounded font-bold"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setCreandoSubcarpetaPara(null)}
                          className="px-1 py-0.5 text-[8px] text-slate-500"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subcarpetas por Tipología */}
                  {expandida && marca.subcarpetas && (
                    <div className="ml-4 pl-1 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-0.5 my-0.5">
                      {marca.subcarpetas.map((sub) => {
                        const isSelectedSub = carpetaSeleccionadaId === sub.id;
                        const countSub = mueblesGuardados.filter(
                          (m) =>
                            m.marca.toLowerCase() === marca.nombre.toLowerCase() &&
                            m.tipologia.toLowerCase() === sub.nombre.toLowerCase()
                        ).length;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => setCarpetaSeleccionadaId(sub.id)}
                            className={`px-2 py-1 rounded text-left text-[11px] flex items-center justify-between transition cursor-pointer ${
                              isSelectedSub
                                ? "bg-cyan-600 text-white font-bold shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Folder className="w-3 h-3 shrink-0 opacity-70" />
                              <span className="truncate">{sub.nombre}</span>
                            </span>
                            {countSub > 0 && (
                              <span className={`text-[9px] font-mono ${isSelectedSub ? "text-white" : "text-slate-400"}`}>
                                {countSub}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Grid de Muebles / Assets (Blender Asset Gallery) */}
        <div className="flex-1 min-w-0 p-3 overflow-y-auto custom-scrollbar flex flex-col">
          
          <div className="text-[10px] text-slate-400 font-semibold px-1 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-cyan-600" />
              MUEBLES EN CATÁLOGO ({mueblesFiltrados.length})
            </span>
            
            {/* Acciones de Google Drive */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSincronizarDrive}
                title="Refrescar y sincronizar cambios desde Google Drive"
                className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 font-semibold p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${sincronizando ? "animate-spin text-cyan-600" : ""}`} />
                <span>Sincronizar</span>
              </button>

              <a
                href={urlGoogleDrive}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir la carpeta raíz de Google Drive en una nueva pestaña"
                className="flex items-center gap-1 text-[10px] text-cyan-700 dark:text-cyan-300 font-bold hover:underline bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-300/80 dark:border-cyan-800/60 shadow-2xs transition cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Ir al Drive</span>
              </a>
            </div>
          </div>

          {/* Grid de Tarjetas de Muebles */}
          {/* Grid de Tarjetas de Muebles Estilo Blender Asset Browser */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
            {mueblesFiltrados.map((mueble) => {
              const isEditing = editandoMuebleId === mueble.id;

              return (
                <div
                  key={mueble.id}
                  onClick={() => !isEditing && abrirMueble(mueble)}
                  title={`${mueble.nombre}\nHaz doble clic para editar nombre, o clic para abrir en 3D`}
                  className="group flex flex-col items-center cursor-pointer p-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all select-none relative"
                >
                  {/* Miniatura Cuadrada Estilo Blender */}
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-[#131B2E] border border-slate-200/70 dark:border-slate-800 shadow-2xs group-hover:border-cyan-500/80 group-hover:shadow-md transition-all relative flex items-center justify-center">
                    {mueble.thumbnail ? (
                      <img
                        src={mueble.thumbnail}
                        alt={mueble.nombre}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
                        <Box className="w-8 h-8 opacity-60 group-hover:scale-105 transition-transform text-cyan-600 dark:text-cyan-400" />
                      </div>
                    )}

                    {/* Botón de Eliminar en Hover (Discreto en esquina) */}
                    <button
                      onClick={(e) => handleEliminarMueble(mueble.id, e)}
                      title="Eliminar este mueble del catálogo"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs z-10"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Nombre Limpio Estilo Blender (Sin rebordes, sin "2 módulos", sin "Abrir") */}
                  <div className="w-full mt-1.5 px-0.5 text-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={nombreTemporal}
                          onChange={(e) => setNombreTemporal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleGuardarEdicion(mueble.id);
                            if (e.key === "Escape") setEditandoMuebleId(null);
                          }}
                          onBlur={() => handleGuardarEdicion(mueble.id)}
                          autoFocus
                          className="w-full px-1 py-0.5 text-xs font-semibold rounded bg-white dark:bg-[#090D14] border border-cyan-500 text-slate-900 dark:text-white text-center focus:outline-none shadow-2xs"
                        />
                        <button
                          onClick={() => handleGuardarEdicion(mueble.id)}
                          className="p-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 shrink-0"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <p
                        onDoubleClick={(e) => handleIniciarEdicion(mueble, e)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors"
                      >
                        {mueble.nombre}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estado Vacío */}
          {mueblesFiltrados.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No hay muebles en esta carpeta
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Diseña una composición en el Visor 3D y pulsa{" "}
                  <strong className="text-cyan-600 font-semibold">Guardar como</strong> para añadir tu primer mueble.
                </p>
              </div>
              <button
                onClick={() => setModalGuardarComoAbierto(true)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Mueble Actual</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
