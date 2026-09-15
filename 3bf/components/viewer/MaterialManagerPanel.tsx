"use client";

import React, { useState, useRef } from "react";
import { use3BFStore, MaterialPBRDef } from "@/lib/store";
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Palette, 
  Sparkles, 
  Pipette,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Check,
  Camera
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

  // 📐 Modo de Vista: Cuadrícula (Rhino 8) o Lista (Blender)
  const [vistaModo, setVistaModo] = useState<"cuadricula" | "lista">(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("3bf_modo_vista_materiales");
      if (saved === "cuadricula" || saved === "lista") return saved;
    }
    return "cuadricula";
  });

  // 🎚️ Tamaño Dinámico de Miniaturas (Slider estilo barra inferior Rhino 8)
  const [tamanoEsfera, setTamanoEsfera] = useState<number>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("3bf_tamano_esferas_materiales");
      if (saved) return Math.min(150, Math.max(70, Number(saved) || 96));
    }
    return 96;
  });

  // 🛠️ Mini-Inspector de Propiedades Rápidas (Colapsado por defecto para máxima altura del catálogo)
  const [inspectorAbierto, setInspectorAbierto] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("3bf_inspector_material_abierto");
      if (saved !== null) return saved === "true";
    }
    return false;
  });

  const cambiarModoVista = (modo: "cuadricula" | "lista") => {
    setVistaModo(modo);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_modo_vista_materiales", modo);
    }
  };

  const cambiarTamanoEsfera = (tamano: number) => {
    setTamanoEsfera(tamano);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_tamano_esferas_materiales", String(tamano));
    }
  };

  const toggleInspector = () => {
    setInspectorAbierto((prev) => {
      const nuevo = !prev;
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_inspector_material_abierto", String(nuevo));
      }
      return nuevo;
    });
  };

  // 💧 Cuentagotas Universal Multipantalla para el panel lateral
  const abrirCuentagotasPanel = async (matId: string) => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          actualizarMaterialPBR(matId, { colorBase: result.sRGBHex.toUpperCase() });
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Cuentagotas cancelado o no disponible:", err);
        }
      }
    } else {
      alert("El Cuentagotas Universal requiere Google Chrome, Microsoft Edge, Opera o Brave.");
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

  // Color de acento según modo (Dark `#1368AA` / Light `#0891B2`)
  const colorAcento = esquemaColor === "oscuro" ? "#1368AA" : (coloresApariencia?.botonActivo || "#0891B2");

  return (
    <div 
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles,
        color: coloresApariencia?.textoPrincipal
      }}
      className="flex flex-col h-full text-xs select-none min-h-0"
    >
      {/* 🔍 BARRA SUPERIOR: Búsqueda, Filtros en Cápsulas y Acciones Rápidas */}
      <div 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
        className="p-2.5 lg:p-3 border-b space-y-2 shrink-0"
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
            className="w-full pl-8 pr-3 py-1.5 border rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:opacity-60 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          {/* Categorías en Cápsulas Circulares */}
          <div className="flex gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {[
              { id: "todos", label: "Todos" },
              { id: "Melamina", label: "Melamina" },
              { id: "Madera", label: "Madera" },
              { id: "Metal", label: "Metal" },
              { id: "Plastico", label: "Plástico" },
              { id: "Pintura", label: "Pintura" }
            ].map((t) => {
              const activo = filtroTipo === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setFiltroTipo(t.id)}
                  style={{
                    backgroundColor: activo ? colorAcento : "transparent",
                    color: activo ? "#FFFFFF" : (coloresApariencia?.textoSecundario || "#64748B"),
                    borderColor: activo ? colorAcento : (coloresApariencia?.bordePaneles || "#CBD5E1")
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors border shadow-2xs font-medium cursor-pointer ${
                    activo ? "opacity-100 font-semibold" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Acciones Rápidas en Cápsulas */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCrearNuevo}
              title="Crear Nuevo Material"
              style={{ backgroundColor: colorAcento }}
              className="p-1.5 text-white rounded-full hover:opacity-90 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => abrirPBRStudioParaMaterial(materialActivo?.id)}
              title="Abrir 3dBimFab Material Studio para fotografiar o calibrar este material"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: colorAcento
              }}
              className="p-1.5 border rounded-full hover:scale-105 transition shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDuplicar}
              title="Duplicar Material Seleccionado"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              className="p-1.5 border rounded-full hover:opacity-80 transition shadow-xs cursor-pointer"
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
              className="p-1.5 border rounded-full hover:bg-red-500/10 disabled:opacity-30 transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetCapasYMateriales}
              title="Restablecer Catálogo por Defecto"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoSecundario
              }}
              className="p-1.5 border rounded-full hover:opacity-100 transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 CATÁLOGO DE MATERIALES (ÁREA PROTAGONISTA EN SU MÁXIMA EXPRESIÓN VERTICAL) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 lg:p-3 custom-scrollbar">
        {materialesFiltrados.length === 0 ? (
          <div 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="h-full flex items-center justify-center italic text-center p-6"
          >
            No se encontraron materiales que coincidan con la búsqueda.
          </div>
        ) : vistaModo === "cuadricula" ? (
          /* ========================================================================= */
          /* MODO CUADRÍCULA (Estilo Rhino 8: Esferas Protagonistas y Solo Nombre)     */
          /* ========================================================================= */
          <div 
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${tamanoEsfera}px, 1fr))`,
              gap: "8px"
            }}
          >
            {materialesFiltrados.map((mat) => {
              const isSel = mat.id === materialActivo?.id;
              // Diámetro de la esfera proporcional al tamaño de la celda
              const sphereSize = Math.max(38, Math.round(tamanoEsfera * 0.58));

              return (
                <button
                  key={mat.id}
                  onClick={() => setMaterialSeleccionadoId(mat.id)}
                  style={isSel ? {
                    backgroundColor: esquemaColor === "oscuro" ? "rgba(19, 104, 170, 0.22)" : "rgba(8, 145, 178, 0.12)",
                    borderColor: colorAcento,
                  } : {
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                  }}
                  className={`group relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
                    isSel ? "ring-2 ring-cyan-500/80 shadow-sm" : "hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs"
                  }`}
                >
                  {/* Contenedor de la Esfera Shader Ball */}
                  <div 
                    className="w-full flex items-center justify-center py-1 relative"
                    style={{ minHeight: `${sphereSize + 8}px` }}
                  >
                    {/* Sombra de contacto inferior realista estilo estudio de Rhino */}
                    <div 
                      className="absolute bottom-1 w-3/4 h-2 rounded-full bg-black/25 blur-[2.5px] pointer-events-none"
                    />

                    {/* Esfera PBR: Fotografía Real del Visor 3D o Simulación Fotorrealista Fallback */}
                    {mat.thumbnailReal ? (
                      <div
                        className="rounded-full shadow-md relative overflow-hidden border border-black/20 dark:border-white/20 shrink-0 transition-transform duration-150 group-hover:scale-105 flex items-center justify-center bg-transparent"
                        style={{
                          width: `${sphereSize}px`,
                          height: `${sphereSize}px`,
                        }}
                      >
                        <img
                          src={mat.thumbnailReal}
                          alt={mat.nombre}
                          className="w-full h-full object-cover rounded-full pointer-events-none scale-[1.24] origin-center"
                        />
                      </div>
                    ) : (
                      <div
                        className="rounded-full shadow-md relative overflow-hidden border border-black/25 flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105"
                        style={{
                          width: `${sphereSize}px`,
                          height: `${sphereSize}px`,
                          backgroundColor: mat.colorBase,
                          backgroundImage: mat.texturaUrl
                            ? `url(${mat.texturaUrl})`
                            : `radial-gradient(circle at 35% 30%, rgba(255,255,255,${0.85 * (1 - (mat.rugosidad ?? 0.45))}), rgba(0,0,0,${0.65 * (1 - (mat.rugosidad ?? 0.45))}) 78%)`,
                          backgroundSize: "cover",
                          backgroundPosition: "center"
                        }}
                      >
                        {/* Brillo especular físico */}
                        <div 
                          className="absolute top-1 left-1.5 rounded-full bg-white/80 blur-[0.6px] pointer-events-none"
                          style={{ 
                            width: `${Math.max(6, sphereSize * 0.28)}px`,
                            height: `${Math.max(4, sphereSize * 0.20)}px`,
                            opacity: Math.max(0.2, 1 - (mat.rugosidad ?? 0.45)) 
                          }}
                        />
                      </div>
                    )}

                    {/* Check de selección sutil */}
                    {isSel && (
                      <div 
                        style={{ backgroundColor: colorAcento }}
                        className="absolute top-0 right-0 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs z-10"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Solo Nombre del Material (Estilo Rhino 8, sin tipo ni categoría) */}
                  <div 
                    style={{
                      backgroundColor: isSel 
                        ? (esquemaColor === "oscuro" ? "rgba(19, 104, 170, 0.35)" : "rgba(8, 145, 178, 0.18)")
                        : (esquemaColor === "oscuro" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.7)"),
                      borderColor: isSel ? colorAcento : "transparent"
                    }}
                    className="w-full mt-1.5 py-0.5 px-1 rounded-md text-center border"
                  >
                    <span 
                      style={{ color: coloresApariencia?.textoPrincipal }}
                      className="text-[11px] font-semibold truncate block w-full leading-tight"
                      title={mat.nombre}
                    >
                      {mat.nombre}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO LISTA (Estilo Blender: Navegación Vertical Rápida y Compacta)         */
          /* ========================================================================= */
          <div className="flex flex-col gap-1">
            {materialesFiltrados.map((mat) => {
              const isSel = mat.id === materialActivo?.id;
              return (
                <button
                  key={mat.id}
                  onClick={() => setMaterialSeleccionadoId(mat.id)}
                  style={isSel ? {
                    backgroundColor: esquemaColor === "oscuro" ? "rgba(19, 104, 170, 0.25)" : "rgba(8, 145, 178, 0.12)",
                    borderColor: colorAcento,
                    color: coloresApariencia?.textoPrincipal
                  } : {
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left ${
                    isSel ? "font-semibold shadow-2xs" : "hover:bg-slate-500/10 opacity-85 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Miniatura de Esfera estilo Blender: Foto Real o Fallback */}
                    {mat.thumbnailReal ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden shadow-inner shrink-0 border border-black/25 flex items-center justify-center">
                        <img
                          src={mat.thumbnailReal}
                          alt={mat.nombre}
                          className="w-full h-full object-cover rounded-full pointer-events-none scale-[1.24] origin-center"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full shadow-inner relative overflow-hidden border border-black/25 shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: mat.colorBase,
                          backgroundImage: mat.texturaUrl
                            ? `url(${mat.texturaUrl})`
                            : `radial-gradient(circle at 35% 30%, rgba(255,255,255,${0.85 * (1 - (mat.rugosidad ?? 0.45))}), rgba(0,0,0,${0.65 * (1 - (mat.rugosidad ?? 0.45))}) 75%)`,
                          backgroundSize: "cover",
                        }}
                      >
                        <div 
                          className="absolute top-0.5 left-1 w-1.5 h-1 rounded-full bg-white/75 blur-[0.4px] pointer-events-none"
                          style={{ opacity: 1 - (mat.rugosidad ?? 0.45) }}
                        />
                      </div>
                    )}

                    {/* Nombre del Material */}
                    <span className="text-xs truncate">
                      {mat.nombre}
                    </span>
                  </div>

                  {/* Indicador de Tipo Discreto */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span 
                      style={{ 
                        color: coloresApariencia?.textoSecundario,
                        backgroundColor: esquemaColor === "oscuro" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
                      }}
                      className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono"
                    >
                      {mat.tipo}
                    </span>
                    {isSel && (
                      <Check style={{ color: colorAcento }} className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🎛️ DOCK DE VISUALIZACIÓN INFERIOR (Estilo Barra Inferior de Rhino 8) */}
      <div 
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion,
          borderColor: coloresApariencia?.bordePaneles
        }}
        className="px-3 py-1.5 border-t flex items-center justify-between gap-3 shrink-0"
      >
        {/* Slider de Tamaño de Miniaturas (Rhino 8) */}
        <div className="flex items-center gap-2 flex-1 max-w-[210px]">
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] font-medium shrink-0"
            title="Ajustar escala de las esferas de materiales"
          >
            Escala:
          </span>
          <input
            type="range"
            min={70}
            max={140}
            step={5}
            value={tamanoEsfera}
            onChange={(e) => cambiarTamanoEsfera(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-600"
            title={`Tamaño de miniatura: ${tamanoEsfera}px`}
          />
        </div>

        {/* Toggles de Vista & Propiedades Rápidas en Cápsulas */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Botón Vista Cuadrícula (Rhino 8) */}
          <button
            onClick={() => cambiarModoVista("cuadricula")}
            title="Vista Cuadrícula de Esferas (Estilo Rhino 8)"
            style={{
              backgroundColor: vistaModo === "cuadricula" ? colorAcento : "transparent",
              color: vistaModo === "cuadricula" ? "#FFFFFF" : (coloresApariencia?.textoSecundario || "#64748B"),
              borderColor: vistaModo === "cuadricula" ? colorAcento : (coloresApariencia?.bordePaneles || "#CBD5E1")
            }}
            className="p-1.5 rounded-full border transition cursor-pointer shadow-2xs hover:opacity-100"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>

          {/* Botón Vista Lista (Blender) */}
          <button
            onClick={() => cambiarModoVista("lista")}
            title="Vista Lista Compacta (Estilo Blender)"
            style={{
              backgroundColor: vistaModo === "lista" ? colorAcento : "transparent",
              color: vistaModo === "lista" ? "#FFFFFF" : (coloresApariencia?.textoSecundario || "#64748B"),
              borderColor: vistaModo === "lista" ? colorAcento : (coloresApariencia?.bordePaneles || "#CBD5E1")
            }}
            className="p-1.5 rounded-full border transition cursor-pointer shadow-2xs hover:opacity-100"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <div 
            style={{ backgroundColor: coloresApariencia?.bordePaneles }}
            className="w-[1px] h-4 mx-0.5 opacity-50"
          />

          {/* Botón Propiedades Rápidas (Colapsable) */}
          <button
            onClick={toggleInspector}
            title={inspectorAbierto ? "Ocultar propiedades rápidas" : "Mostrar propiedades rápidas del material seleccionado"}
            style={{
              backgroundColor: inspectorAbierto 
                ? (esquemaColor === "oscuro" ? "rgba(19, 104, 170, 0.25)" : "rgba(8, 145, 178, 0.15)") 
                : "transparent",
              color: inspectorAbierto ? colorAcento : (coloresApariencia?.textoSecundario || "#64748B"),
              borderColor: inspectorAbierto ? colorAcento : (coloresApariencia?.bordePaneles || "#CBD5E1")
            }}
            className="p-1.5 rounded-full border transition cursor-pointer shadow-2xs hover:opacity-100 flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {inspectorAbierto ? (
              <ChevronDown className="w-3 h-3 opacity-70" />
            ) : (
              <ChevronUp className="w-3 h-3 opacity-70" />
            )}
          </button>
        </div>
      </div>

      {/* 🛠️ MINI-INSPECTOR DE PROPIEDADES RÁPIDAS (Desplegable a demanda) */}
      {inspectorAbierto && materialActivo && (
        <div 
          style={{
            backgroundColor: coloresApariencia?.fondoPaneles,
            borderColor: coloresApariencia?.bordePaneles
          }}
          className="p-3 border-t space-y-2 shrink-0 animate-in slide-in-from-bottom duration-150"
        >
          <div className="flex items-center justify-between mb-1">
            <span 
              style={{ color: coloresApariencia?.textoSecundario }}
              className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Palette style={{ color: colorAcento }} className="w-3.5 h-3.5" />
              Propiedades Rápidas: {materialActivo.nombre}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Nombre */}
            <div>
              <label 
                style={{ color: coloresApariencia?.textoSecundario }}
                className="block text-[9.5px] font-medium mb-1"
              >
                Nombre Técnico
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
                className="w-full px-2.5 py-1 border rounded-full font-mono text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Tipo */}
            <div>
              <label 
                style={{ color: coloresApariencia?.textoSecundario }}
                className="block text-[9.5px] font-medium mb-1"
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
                className="w-full px-2.5 py-1 border rounded-full text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="PBR">PBR Físico</option>
                <option value="Melamina">Melamina</option>
                <option value="Madera">Madera Natural</option>
                <option value="Metal">Metal / Acero</option>
                <option value="Plastico">Plástico</option>
                <option value="Pintura">Pintura</option>
              </select>
            </div>

            {/* Color Base y Cuentagotas */}
            <div>
              <label 
                style={{ color: coloresApariencia?.textoSecundario }}
                className="block text-[9.5px] font-medium mb-1"
              >
                Color Base / Tono
              </label>
              <div className="flex items-center gap-1.5">
                <label
                  className="w-6 h-6 rounded-full border shadow-xs cursor-pointer hover:scale-105 transition flex items-center justify-center relative overflow-hidden shrink-0"
                  style={{ backgroundColor: materialActivo.colorBase || "#CCCCCC" }}
                  title="Cambiar color base"
                >
                  <input
                    type="color"
                    value={materialActivo.colorBase?.startsWith("#") && materialActivo.colorBase.length === 7 ? materialActivo.colorBase : "#CCCCCC"}
                    onChange={(e) => actualizarMaterialPBR(materialActivo.id, { colorBase: e.target.value })}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
                <input
                  type="text"
                  maxLength={7}
                  value={materialActivo.colorBase || "#CCCCCC"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                      actualizarMaterialPBR(materialActivo.id, { colorBase: val });
                    }
                  }}
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="w-full px-2 py-1 border rounded-full font-mono text-xs uppercase focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => abrirCuentagotasPanel(materialActivo.id)}
                  className="p-1 rounded-full border shadow-xs flex items-center justify-center cursor-pointer hover:scale-105 transition shrink-0"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: colorAcento
                  }}
                  title="Cuentagotas de pantalla"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 BOTÓN PRINCIPAL AL LÍMITE INFERIOR: Editar en 3dBimFab Material Studio */}
      <div 
        style={{
          backgroundColor: coloresApariencia?.fondoPaneles,
          borderColor: coloresApariencia?.bordePaneles
        }}
        className="p-2.5 lg:p-3 border-t shrink-0"
      >
        <button
          onClick={() => abrirPBRStudioParaMaterial(materialActivo?.id)}
          style={{ backgroundColor: colorAcento }}
          className="w-full py-2.5 px-4 rounded-full font-semibold text-xs text-white shadow-xs transition cursor-pointer hover:opacity-90 flex items-center justify-center text-center"
        >
          <span>Editar en 3dBimFab Material Studio</span>
        </button>
      </div>
    </div>
  );
}
