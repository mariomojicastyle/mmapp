"use client";

import React, { useState, useRef } from "react";
import { use3BFStore, MaterialPBRDef } from "@/lib/store";
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight, 
  Palette, 
  Sparkles,
  Info,
  Sliders,
  Image as ImageIcon,
  Upload,
  X
} from "lucide-react";

export default function MaterialManagerPanel() {
  const {
    materialesPBR,
    materialSeleccionadoId,
    setMaterialSeleccionadoId,
    crearMaterialPBR,
    actualizarMaterialPBR,
    eliminarMaterialPBR,
    resetCapasYMateriales
  } = use3BFStore();

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [acordeonAbierto, setAcordeonAbierto] = useState({
    nombreTipo: true,
    colorFisico: true,
    especularidad: false,
    opacidad: false,
    notas: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redimensión interactiva vertical de la galería de esferas de materiales
  const [alturaGaleria, setAlturaGaleria] = useState<number>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("3bf_altura_galeria_materiales");
      if (saved) return Number(saved) || 160;
    }
    return 160;
  });

  const [isResizing, setIsResizing] = useState(false);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const startY = mouseDownEvent.clientY;
    const startHeight = alturaGaleria;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(75, Math.min(600, startHeight + deltaY));
      setAlturaGaleria(newHeight);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_altura_galeria_materiales", String(newHeight));
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [alturaGaleria]);

  const toggleAcordeon = (key: keyof typeof acordeonAbierto) => {
    setAcordeonAbierto((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubirTextura = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !materialActivo) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        actualizarMaterialPBR(materialActivo.id, { texturaUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const materialesFiltrados = materialesPBR.filter((mat) => {
    const coincideTexto = mat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          mat.tipo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = filtroTipo === "todos" || mat.tipo.toLowerCase() === filtroTipo.toLowerCase();
    return coincideTexto && coincideTipo;
  });

  const materialActivo = materialesPBR.find((m) => m.id === materialSeleccionadoId) || materialesPBR[0];

  const handleCrearNuevo = () => {
    const id = crearMaterialPBR({
      nombre: `Material_${materialesPBR.length + 1}`,
      tipo: "PBR",
      colorBase: "#C5B39A",
      metalico: 0.1,
      rugosidad: 0.45,
      especularidad: 0.5,
      opacidad: 1.0,
      ior: 1.50,
      notas: "Nuevo material PBR",
    });
    setMaterialSeleccionadoId(id);
  };

  const handleDuplicar = () => {
    if (!materialActivo) return;
    const id = crearMaterialPBR({
      ...materialActivo,
      id: undefined,
      nombre: `${materialActivo.nombre}_Copia`,
    });
    setMaterialSeleccionadoId(id);
  };

  const handleEliminar = () => {
    if (!materialActivo || materialesPBR.length <= 1) return;
    if (confirm(`¿Eliminar el material "${materialActivo.nombre}"?`)) {
      eliminarMaterialPBR(materialActivo.id);
    }
  };

  return (
    <div className="flex flex-col h-full text-xs select-none">
      {/* 🔍 Barra de Búsqueda y Acciones Rápidas */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar material PBR..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {["todos", "Melamina", "Madera", "Metal", "Plastico", "Pintura"].map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  filtroTipo === t
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCrearNuevo}
              title="Crear Nuevo Material"
              className="p-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDuplicar}
              title="Duplicar Material Seleccionado"
              className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleEliminar}
              title="Eliminar Material Seleccionado"
              disabled={materialesPBR.length <= 1}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🌐 Galería Superior de Miniaturas / Esferas PBR (Estilo Rhino) */}
      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Catálogo de Materiales ({materialesFiltrados.length})</span>
          <button
            onClick={resetCapasYMateriales}
            title="Restablecer Materiales por Defecto"
            className="text-slate-400 hover:text-cyan-600 flex items-center gap-1 text-[10px] transition"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Reset
          </button>
        </div>

        <div 
          style={{ height: `${alturaGaleria}px` }}
          className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto pr-1 custom-scrollbar"
        >
          {materialesFiltrados.map((mat) => {
            const isSel = mat.id === materialActivo?.id;
            return (
              <button
                key={mat.id}
                onClick={() => setMaterialSeleccionadoId(mat.id)}
                className={`flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                  isSel
                    ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 ring-1 ring-cyan-500 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Esfera PBR simulada con gradiente radial y reflejos */}
                <div
                  className="w-9 h-9 rounded-full shadow-inner relative overflow-hidden border border-black/10 flex items-center justify-center"
                  style={{
                    backgroundColor: mat.colorBase,
                    backgroundImage: mat.texturaUrl
                      ? `url(${mat.texturaUrl})`
                      : `radial-gradient(circle at 35% 30%, rgba(255,255,255,${0.85 * (1 - mat.rugosidad)}), rgba(0,0,0,${0.6 * (1 - mat.rugosidad)}) 75%)`,
                    backgroundSize: "cover",
                  }}
                >
                  {/* Brillo especular */}
                  <div 
                    className="absolute top-1 left-1.5 w-3 h-2 rounded-full bg-white/70 blur-[0.5px] pointer-events-none"
                    style={{ opacity: 1 - mat.rugosidad }}
                  />
                  {mat.metalico > 0.5 && (
                    <Sparkles className="w-3 h-3 text-white/80 absolute bottom-1 right-1 pointer-events-none" />
                  )}
                </div>
                <span className="mt-1 text-[10px] font-medium text-slate-800 dark:text-slate-200 truncate w-full text-center">
                  {mat.nombre}
                </span>
                <span className="text-[8px] text-slate-400 truncate max-w-full">
                  {mat.tipo}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ↔️ Divisor Interactivo de Redimensión Vertical */}
      <div
        onMouseDown={startResizing}
        title="Arrastra para redimensionar el espacio de esferas de materiales"
        className={`h-2 border-y border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-500/80 dark:hover:bg-cyan-500/80 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0 ${
          isResizing ? "bg-cyan-500! dark:bg-cyan-500!" : ""
        }`}
      >
        <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-white transition-colors" />
      </div>

      {/* 🛠️ Inspector Detallado de Propiedades Físicas PBR (Estilo Rhino) */}
      {materialActivo ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {/* Acordeón 1: Nombre y Tipo */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
            <button
              onClick={() => toggleAcordeon("nombreTipo")}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-600" />
                <span>Nombre y Tipo</span>
              </div>
              {acordeonAbierto.nombreTipo ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {acordeonAbierto.nombreTipo && (
              <div className="p-3 space-y-2.5">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">
                    Nombre Técnico del Material (Blender / Rhino)
                  </label>
                  <input
                    type="text"
                    value={materialActivo.nombre}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { nombre: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 mt-0.5 block">
                    Este nombre exacto es el que vinculará la plantilla HD de Blender en el GLB.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Tipo de Material</label>
                  <select
                    value={materialActivo.tipo}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { tipo: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="PBR">PBR Físico Estándar</option>
                    <option value="Melamina">Melamina / Tablero Laminado</option>
                    <option value="Madera">Madera Natural / Poro Abierto</option>
                    <option value="Metal">Metal / Acero / Aluminio</option>
                    <option value="Plastico">Plástico Inyectado / Polímero</option>
                    <option value="Pintura">Pintura Electrostática</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 2: Color Base / Metálico / Rugosidad */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
            <button
              onClick={() => toggleAcordeon("colorFisico")}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-600" />
                <span>Color Base, Metálico & Rugosidad</span>
              </div>
              {acordeonAbierto.colorFisico ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {acordeonAbierto.colorFisico && (
              <div className="p-3 space-y-3">
                {/* Color Base */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Color Base (Albedo)</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{materialActivo.colorBase}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={materialActivo.colorBase}
                      onChange={(e) => actualizarMaterialPBR(materialActivo.id, { colorBase: e.target.value })}
                      className="w-9 h-8 p-0.5 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={materialActivo.colorBase}
                      onChange={(e) => actualizarMaterialPBR(materialActivo.id, { colorBase: e.target.value })}
                      className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 🖼️ Mapa de Textura Difusa con Carga de Archivos */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-400" /> Mapa de Textura Difusa
                    </label>
                    {materialActivo.texturaUrl && (
                      <button
                        onClick={() => actualizarMaterialPBR(materialActivo.id, { texturaUrl: undefined })}
                        className="text-[9px] text-red-500 hover:underline flex items-center gap-0.5"
                      >
                        <X className="w-2.5 h-2.5" /> Quitar textura
                      </button>
                    )}
                  </div>

                  {/* Input Oculto de Archivo */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleSubirTextura}
                    className="hidden"
                  />

                  {/* Previsualización de Textura Actual y Botón de Subida */}
                  {materialActivo.texturaUrl ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      <div
                        className="w-10 h-10 rounded border border-black/20 shrink-0 shadow-sm overflow-hidden bg-cover bg-center"
                        style={{ backgroundImage: `url(${materialActivo.texturaUrl})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                          Textura Activa
                        </p>
                        <span className="text-[9px] text-slate-400 truncate block font-mono">
                          {materialActivo.texturaUrl.startsWith("data:") ? "(Imagen personalizada cargada)" : materialActivo.texturaUrl}
                        </span>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-medium transition flex items-center gap-1 shrink-0"
                      >
                        <Upload className="w-2.5 h-2.5" /> Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 border border-dashed border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-lg text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> Cargar Imagen de Textura
                        </button>
                      </div>

                      {/* Presets Rápidos de Texturas del Sistema */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 shrink-0">O elegir preset:</span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              actualizarMaterialPBR(materialActivo.id, { texturaUrl: e.target.value });
                            }
                          }}
                          className="flex-1 py-0.5 px-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="">Seleccionar textura...</option>
                          <option value="/textures/Marfil_diffuse.jpg">Marfil Diffuse (Novopan)</option>
                          <option value="/textures/wood_melamine.jpg">Wood Melamine (Duna)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metálico */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Metálico (Metallic)</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{materialActivo.metalico.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.metalico}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { metalico: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>0.00 Dieléctrico</span>
                    <span>1.00 Metal Puro</span>
                  </div>
                </div>

                {/* Rugosidad */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Rugosidad (Roughness)</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{materialActivo.rugosidad.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.rugosidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { rugosidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>0.00 Espejo Pulido</span>
                    <span>1.00 Mate Rugoso</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 3: Especularidad & F0 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
            <button
              onClick={() => toggleAcordeon("especularidad")}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Especularidad (F0)</span>
              </div>
              {acordeonAbierto.especularidad ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {acordeonAbierto.especularidad && (
              <div className="p-3 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Intensidad Especular F0</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{materialActivo.especularidad.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.especularidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { especularidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 4: Opacidad & Refracción (IOR) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
            <button
              onClick={() => toggleAcordeon("opacidad")}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-600" />
                <span>Opacidad & Refracción (IOR)</span>
              </div>
              {acordeonAbierto.opacidad ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {acordeonAbierto.opacidad && (
              <div className="p-3 space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Opacidad (Alfa)</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{(materialActivo.opacidad * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.opacidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { opacidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-medium text-slate-500">Índice de Refracción (IOR)</label>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{materialActivo.ior.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.01"
                    value={materialActivo.ior}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { ior: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>1.00 Aire</span>
                    <span>1.50 Vidrio / Resina</span>
                    <span>2.42 Diamante</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 5: Notas Técnicas */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm">
            <button
              onClick={() => toggleAcordeon("notas")}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-600" />
                <span>Notas & Proveedor</span>
              </div>
              {acordeonAbierto.notas ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {acordeonAbierto.notas && (
              <div className="p-3">
                <textarea
                  rows={3}
                  value={materialActivo.notas || ""}
                  onChange={(e) => actualizarMaterialPBR(materialActivo.id, { notas: e.target.value })}
                  placeholder="Observaciones de taller, código de fábrica o parámetros de acabado..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 p-4 text-center">
          Selecciona o crea un material PBR para editar sus propiedades.
        </div>
      )}
    </div>
  );
}
