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
    resetCapasYMateriales,
    abrirPBRStudioParaMaterial,
    coloresApariencia,
    esquemaColor
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
    <div 
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles,
        color: coloresApariencia?.textoPrincipal
      }}
      className="flex flex-col h-full text-xs select-none"
    >
      {/* 🔍 Barra de Búsqueda y Acciones Rápidas */}
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
            placeholder="Buscar material PBR..."
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

        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {["todos", "Melamina", "Madera", "Metal", "Plastico", "Pintura"].map((t) => {
              const activo = filtroTipo === t;
              return (
                <button
                  key={t}
                  onClick={() => setFiltroTipo(t)}
                  style={{
                    backgroundColor: activo 
                      ? (coloresApariencia?.botonActivo || "#0891B2") 
                      : (coloresApariencia?.fondoAplicacion || "#F1F5F9"),
                    color: activo ? "#FFFFFF" : (coloresApariencia?.textoSecundario || "#64748B"),
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1"
                  }}
                  className="px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-colors border shadow-2xs"
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCrearNuevo}
              title="Crear Nuevo Material"
              style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891B2" }}
              className="p-1.5 text-white rounded hover:opacity-90 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => abrirPBRStudioParaMaterial(materialActivo?.id)}
              title="Abrir 3BF PBR Material Studio (Calibrador 3D con Shader Ball)"
              className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>PBR Studio</span>
            </button>
            <button
              onClick={handleDuplicar}
              title="Duplicar Material Seleccionado"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              className="p-1.5 border rounded hover:opacity-80 transition shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleEliminar}
              title="Eliminar Material Seleccionado"
              disabled={materialesPBR.length <= 1}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: "#EF4444"
              }}
              className="p-1.5 border rounded hover:bg-red-500/10 disabled:opacity-30 transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🌐 Galería Superior de Miniaturas / Esferas PBR (Estilo Rhino) */}
      <div 
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion,
          borderColor: coloresApariencia?.bordePaneles
        }}
        className="p-3 border-b"
      >
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span style={{ color: coloresApariencia?.textoSecundario }}>
            Catálogo de Materiales ({materialesFiltrados.length})
          </span>
          <button
            onClick={resetCapasYMateriales}
            title="Restablecer Materiales por Defecto"
            style={{ color: coloresApariencia?.textoSecundario }}
            className="hover:opacity-100 flex items-center gap-1 text-[10px] transition cursor-pointer"
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
                style={isSel ? {
                  backgroundColor: esquemaColor === "oscuro" ? "rgba(8, 145, 178, 0.25)" : "rgba(8, 145, 178, 0.12)",
                  borderColor: coloresApariencia?.botonActivo || "#0891B2",
                } : {
                  backgroundColor: coloresApariencia?.fondoPaneles,
                  borderColor: coloresApariencia?.bordePaneles,
                }}
                className={`flex flex-col items-center p-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                  isSel ? "ring-1 ring-cyan-500" : "hover:opacity-90"
                }`}
              >
                {/* Esfera PBR simulada con gradiente radial y reflejos */}
                <div
                  className="w-9 h-9 rounded-full shadow-inner relative overflow-hidden border border-black/20 flex items-center justify-center shrink-0"
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
                <span 
                  style={{ color: coloresApariencia?.textoPrincipal }}
                  className="mt-1 text-[10px] font-medium truncate w-full text-center"
                >
                  {mat.nombre}
                </span>
                <span 
                  style={{ color: coloresApariencia?.textoSecundario }}
                  className="text-[8px] truncate max-w-full opacity-80"
                >
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
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion,
          borderColor: coloresApariencia?.bordePaneles
        }}
        className={`h-2 border-y hover:bg-cyan-500/80 cursor-row-resize flex items-center justify-center transition-colors group select-none shrink-0 ${
          isResizing ? "bg-cyan-500!" : ""
        }`}
      >
        <div 
          style={{ backgroundColor: coloresApariencia?.bordePaneles || "#94A3B8" }}
          className="w-8 h-1 rounded-full group-hover:bg-white transition-colors" 
        />
      </div>

      {/* 🛠️ Inspector Detallado de Propiedades Físicas PBR (Estilo Rhino) */}
      {materialActivo ? (
        <div 
          style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
          className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar"
        >
          {/* Acordeón 1: Nombre y Tipo */}
          <div 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="border rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => toggleAcordeon("nombreTipo")}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                color: coloresApariencia?.textoPrincipal
              }}
              className="w-full flex items-center justify-between p-2.5 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Palette style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-3.5 h-3.5" />
                <span>Nombre y Tipo</span>
              </div>
              {acordeonAbierto.nombreTipo ? (
                <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              )}
            </button>

            {acordeonAbierto.nombreTipo && (
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
                className="p-3 space-y-2.5"
              >
                <div>
                  <label 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="block text-[10px] font-medium mb-1"
                  >
                    Nombre Técnico del Material (Blender / Rhino)
                  </label>
                  <input
                    type="text"
                    value={materialActivo.nombre}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { nombre: e.target.value })}
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal
                    }}
                    className="w-full px-2.5 py-1.5 border rounded font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                  <span 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="text-[9px] mt-0.5 block opacity-80"
                  >
                    Este nombre exacto es el que vinculará la plantilla HD de Blender en el GLB.
                  </span>
                </div>

                <div>
                  <label 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="block text-[10px] font-medium mb-1"
                  >
                    Tipo de Material
                  </label>
                  <select
                    value={materialActivo.tipo}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { tipo: e.target.value as any })}
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal
                    }}
                    className="w-full px-2.5 py-1.5 border rounded text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
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
          <div 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="border rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => toggleAcordeon("colorFisico")}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                color: coloresApariencia?.textoPrincipal
              }}
              className="w-full flex items-center justify-between p-2.5 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-3.5 h-3.5" />
                <span>Color Base, Metálico & Rugosidad</span>
              </div>
              {acordeonAbierto.colorFisico ? (
                <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              )}
            </button>

            {acordeonAbierto.colorFisico && (
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
                className="p-3 space-y-3"
              >
                {/* Color Base */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Color Base (Albedo)
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {materialActivo.colorBase}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={materialActivo.colorBase}
                      onChange={(e) => actualizarMaterialPBR(materialActivo.id, { colorBase: e.target.value })}
                      className="w-9 h-8 p-0.5 rounded border border-black/20 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={materialActivo.colorBase}
                      onChange={(e) => actualizarMaterialPBR(materialActivo.id, { colorBase: e.target.value })}
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal
                      }}
                      className="flex-1 px-2 py-1 border rounded font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 🖼️ Mapa de Textura Difusa con Carga de Archivos */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium flex items-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3 opacity-70" /> Mapa de Textura Difusa
                    </label>
                    {materialActivo.texturaUrl && (
                      <button
                        onClick={() => actualizarMaterialPBR(materialActivo.id, { texturaUrl: undefined })}
                        className="text-[9px] text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    <div 
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg border"
                    >
                      <div
                        className="w-10 h-10 rounded border border-black/20 shrink-0 shadow-sm overflow-hidden bg-cover bg-center"
                        style={{ backgroundImage: `url(${materialActivo.texturaUrl})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p 
                          style={{ color: coloresApariencia?.textoPrincipal }}
                          className="text-[10px] font-medium truncate"
                        >
                          Textura Activa
                        </p>
                        <span 
                          style={{ color: coloresApariencia?.textoSecundario }}
                          className="text-[9px] truncate block font-mono opacity-80"
                        >
                          {materialActivo.texturaUrl.startsWith("data:") ? "(Imagen personalizada cargada)" : materialActivo.texturaUrl}
                        </span>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891B2" }}
                        className="px-2 py-1 text-white rounded text-[10px] font-medium transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs hover:opacity-90"
                      >
                        <Upload className="w-2.5 h-2.5" /> Cambiar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            borderColor: coloresApariencia?.botonActivo || "#0891B2",
                            color: coloresApariencia?.botonActivo || "#0891B2",
                            backgroundColor: esquemaColor === "oscuro" ? "rgba(8, 145, 178, 0.10)" : "rgba(8, 145, 178, 0.05)"
                          }}
                          className="flex-1 py-2 px-3 border border-dashed rounded-lg text-center font-medium text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer hover:opacity-90"
                        >
                          <Upload className="w-3.5 h-3.5" /> Cargar Imagen de Textura
                        </button>
                      </div>

                      {/* Presets Rápidos de Texturas del Sistema */}
                      <div className="flex items-center gap-1">
                        <span 
                          style={{ color: coloresApariencia?.textoSecundario }}
                          className="text-[9px] shrink-0"
                        >
                          O elegir preset:
                        </span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              actualizarMaterialPBR(materialActivo.id, { texturaUrl: e.target.value });
                            }
                          }}
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal
                          }}
                          className="flex-1 py-0.5 px-1.5 border rounded text-[10px] focus:outline-none cursor-pointer"
                        >
                          <option value="">Seleccionar textura...</option>
                          <option value="/textures/Marfil_diffuse.jpg">Marfil Diffuse (Novopan)</option>
                          <option value="/textures/wood_melamine.jpg">Wood Melamine (Duna)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Acceso Directo a PBR Studio */}
                  <button
                    onClick={() => abrirPBRStudioParaMaterial(materialActivo.id)}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>🧪 Calibrar en 3BF PBR Studio (Shader Ball)</span>
                  </button>
                </div>

                {/* Metálico */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Metálico (Metallic)
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {materialActivo.metalico.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.metalico}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { metalico: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="flex justify-between text-[8px] mt-0.5 opacity-80"
                  >
                    <span>0.00 Dieléctrico</span>
                    <span>1.00 Metal Puro</span>
                  </div>
                </div>

                {/* Rugosidad */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Rugosidad (Roughness)
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {materialActivo.rugosidad.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.rugosidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { rugosidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="flex justify-between text-[8px] mt-0.5 opacity-80"
                  >
                    <span>0.00 Espejo Pulido</span>
                    <span>1.00 Mate Rugoso</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 3: Especularidad & F0 */}
          <div 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="border rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => toggleAcordeon("especularidad")}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                color: coloresApariencia?.textoPrincipal
              }}
              className="w-full flex items-center justify-between p-2.5 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-3.5 h-3.5" />
                <span>Especularidad (F0)</span>
              </div>
              {acordeonAbierto.especularidad ? (
                <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              )}
            </button>

            {acordeonAbierto.especularidad && (
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
                className="p-3 space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Intensidad Especular F0
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {materialActivo.especularidad.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.especularidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { especularidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 4: Opacidad & Refracción (IOR) */}
          <div 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="border rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => toggleAcordeon("opacidad")}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                color: coloresApariencia?.textoPrincipal
              }}
              className="w-full flex items-center justify-between p-2.5 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-3.5 h-3.5" />
                <span>Opacidad & Refracción (IOR)</span>
              </div>
              {acordeonAbierto.opacidad ? (
                <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              )}
            </button>

            {acordeonAbierto.opacidad && (
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
                className="p-3 space-y-3"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Opacidad (Alfa)
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {(materialActivo.opacidad * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialActivo.opacidad}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { opacidad: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="text-[10px] font-medium"
                    >
                      Índice de Refracción (IOR)
                    </label>
                    <span 
                      style={{ color: coloresApariencia?.textoSecundario }}
                      className="font-mono text-[10px]"
                    >
                      {materialActivo.ior.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.01"
                    value={materialActivo.ior}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { ior: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="flex justify-between text-[8px] mt-0.5 opacity-80"
                  >
                    <span>1.00 Aire</span>
                    <span>1.50 Vidrio / Resina</span>
                    <span>2.42 Diamante</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acordeón 5: Notas Técnicas */}
          <div 
            style={{ borderColor: coloresApariencia?.bordePaneles }}
            className="border rounded-lg overflow-hidden shadow-xs"
          >
            <button
              onClick={() => toggleAcordeon("notas")}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                color: coloresApariencia?.textoPrincipal
              }}
              className="w-full flex items-center justify-between p-2.5 font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} className="w-3.5 h-3.5" />
                <span>Notas & Proveedor</span>
              </div>
              {acordeonAbierto.notas ? (
                <ChevronDown style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
              )}
            </button>

            {acordeonAbierto.notas && (
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoPaneles }}
                className="p-3"
              >
                <textarea
                  rows={3}
                  value={materialActivo.notas || ""}
                  onChange={(e) => actualizarMaterialPBR(materialActivo.id, { notas: e.target.value })}
                  placeholder="Observaciones de taller, código de fábrica o parámetros de acabado..."
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="w-full p-2 border rounded text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none placeholder:opacity-60"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          style={{ color: coloresApariencia?.textoSecundario }}
          className="flex-1 flex items-center justify-center p-4 text-center italic"
        >
          Selecciona o crea un material PBR para editar sus propiedades.
        </div>
      )}
    </div>
  );
}
