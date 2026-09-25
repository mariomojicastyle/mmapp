"use client";

import React, { useState, useEffect } from "react";
import { use3BFStore } from "@/lib/store";
import { Search, Box, Camera, Check } from "lucide-react";

export interface DefinicionItem {
  id: string;
  nombre: string;
  categoria: string;
  archivo: string;
  rutaRelativa: string;
  descripcion?: string;
  thumbnail?: string;
}

const CATEGORIAS_FALLBACK = ["Cubiertas"];

const DEFINICIONES_FALLBACK: DefinicionItem[] = [
  {
    id: "Cubierta",
    nombre: "Cubierta",
    categoria: "Cubiertas",
    archivo: "Cubierta.ghx",
    rutaRelativa: "Cubiertas/Cubierta.ghx",
    thumbnail: "/thumbnails/cubierta_render.svg",
  },
];

export default function ComponentAssetBrowser() {
  const { coloresApariencia, esquemaColor } = use3BFStore();
  const esOscuro = esquemaColor === "oscuro";
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0891B2");

  const [busqueda, setBusqueda] = useState("");
  const [categoriaMueble, setCategoriaMueble] = useState<string>("Todos");
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_FALLBACK);
  const [definiciones, setDefiniciones] = useState<DefinicionItem[]>(DEFINICIONES_FALLBACK);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const touchStartPos = React.useRef<{ id: string; x: number; y: number; time: number } | null>(null);

  // Estados de captura de miniatura individual para componentes
  const [capturandoCompId, setCapturandoCompId] = useState<string | null>(null);
  const [capturaExitosaId, setCapturaExitosaId] = useState<string | null>(null);

  const cargarDefiniciones = () => {
    fetch("/api/definitions")
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategorias(data.categories);
        }
        if (data?.items && Array.isArray(data.items)) {
          const mapped = data.items.map((item: any) => {
            const idLower = (item.id || "").toLowerCase();
            const catLower = (item.categoria || "").toLowerCase();
            
            let thumb = item.thumbnail ? `${item.thumbnail}?t=${Date.now()}` : "/thumbnails/cubierta_render.svg";
            if (!item.thumbnail) {
              if (idLower.includes("cubierta")) {
                thumb = `/thumbnails/Cubierta.png?t=${Date.now()}`;
              } else if (catLower.includes("comoda") || catLower.includes("cajon")) {
                thumb = "/thumbnails/comoda_render.svg";
              } else if (catLower.includes("armario") || catLower.includes("closet")) {
                thumb = "/thumbnails/armario_render.svg";
              } else if (catLower.includes("escritorio") || catLower.includes("mesa")) {
                thumb = "/thumbnails/escritorio_render.svg";
              }
            }
            return { ...item, thumbnail: thumb };
          });
          setDefiniciones(mapped);
        }
      })
      .catch((err) => {
        console.warn("API definitions fallback:", err);
      });
  };

  useEffect(() => {
    cargarDefiniciones();

    const handleThumbUpdated = () => {
      cargarDefiniciones();
    };

    window.addEventListener("3bf-thumbnail-updated", handleThumbUpdated);
    return () => window.removeEventListener("3bf-thumbnail-updated", handleThumbUpdated);
  }, []);

  const handleCapturarMiniaturaComponente = async (item: DefinicionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      setCapturandoCompId(item.id);
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        alert("No se encontró el lienzo 3D.");
        return;
      }

      let imageBase64 = "";
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        imageBase64 = (window as any).__capturarThumbnail3BF() || "";
      }
      if (!imageBase64) {
        imageBase64 = canvas.toDataURL("image/png");
      }

      const res = await fetch("/api/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: item.id, imageBase64 }),
      });

      if (res.ok) {
        setCapturaExitosaId(item.id);
        setTimeout(() => setCapturaExitosaId(null), 2000);
        
        setDefiniciones((prev) =>
          prev.map((def) =>
            def.id === item.id
              ? { ...def, thumbnail: `${imageBase64}` }
              : def
          )
        );

        window.dispatchEvent(
          new CustomEvent("3bf-thumbnail-updated", { detail: { modelId: item.id, imageBase64 } })
        );
      }
    } catch (err) {
      console.error("Error al capturar miniatura de componente:", err);
    } finally {
      setCapturandoCompId(null);
    }
  };

  const mueblesFiltrados = definiciones.filter((item) => {
    const coincideTexto = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          item.archivo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = categoriaMueble === "Todos" || item.categoria.toLowerCase() === categoriaMueble.toLowerCase();
    return coincideTexto && coincideCat;
  });

  const handleDragStart = (e: React.DragEvent, item: DefinicionItem) => {
    setDraggedItemId(item.id);
    if (typeof window !== "undefined") {
      (window as any).__dragged3BFItem = item;
    }
    const payload = JSON.stringify({ 
      id: item.id, 
      nombre: item.nombre,
      categoria: item.categoria,
      archivo: item.archivo,
      tipo: "mueble" 
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        (window as any).__dragged3BFItem = null;
      }, 500);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      
      {/* Buscador */}
      <div className="p-1.5 lg:p-3 pb-1 lg:pb-1.5 shrink-0">
        <div className="relative flex items-center">
          <Search 
            style={{ color: coloresApariencia?.textoSecundario }} 
            className="w-3 lg:w-4 h-3 lg:h-4 absolute left-2 lg:left-3 pointer-events-none opacity-60" 
          />
          <input
            type="text"
            placeholder="Buscar componentes..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal,
            }}
            className="w-full pl-6.5 lg:pl-9 pr-2.5 lg:pr-3 py-1 lg:py-2 text-[11px] lg:text-xs rounded-full border focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Botones de Categorías Dinámicas (Cápsulas puras rounded-full) */}
      <div className="flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-3 py-1 lg:py-1.5 overflow-x-auto text-[9px] lg:text-xs no-scrollbar shrink-0">
        {["Todos", ...categorias].map((cat) => {
          const isSelected = categoriaMueble.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => setCategoriaMueble(cat)}
              style={
                isSelected
                  ? { backgroundColor: colorBotonActivo, borderColor: colorBotonActivo, color: "#FFFFFF" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2.5 lg:px-3.5 py-0.5 lg:py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer border text-[9.5px] lg:text-xs ${
                isSelected
                  ? "shadow-sm text-white"
                  : "hover:opacity-90 backdrop-blur-sm"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid de Miniaturas Blender Style (Thumbnail + Nombre) con Scroll Vertical Directo */}
      <div className="flex-1 overflow-y-auto p-1.5 lg:p-3 custom-scrollbar touch-pan-y">
        <div className="text-[9px] lg:text-[11px] text-slate-400 font-semibold px-1 mb-1.5 lg:mb-2">
          <span>COMPONENTES ({mueblesFiltrados.length})</span>
        </div>

        <div className="flex flex-wrap gap-1.5 lg:gap-3 p-0.5 lg:p-1 content-start items-start">
          {mueblesFiltrados.map((item) => {
            return (
              <div
                key={item.id}
                draggable={typeof window !== "undefined" ? window.innerWidth >= 1024 : true}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  touchStartPos.current = { id: item.id, x: t.clientX, y: t.clientY, time: Date.now() };
                  if (typeof window !== "undefined") {
                    (window as any).__dragged3BFItem = item;
                  }
                }}
                onTouchEnd={async (e) => {
                  const info = touchStartPos.current;
                  touchStartPos.current = null;
                  if (!info || info.id !== item.id) return;
                  const t = e.changedTouches[0];
                  const dx = Math.abs(t.clientX - info.x);
                  const dy = Math.abs(t.clientY - info.y);
                  const elapsed = Date.now() - info.time;
                  const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;

                  // Tap o toque simple en móvil
                  if (dx < 25 && dy < 25 && elapsed < 700) {
                    e.preventDefault();
                    await use3BFStore.getState().cargarDefinicion(item);
                    if (esMovil) {
                      use3BFStore.getState().setMostrarNPanel(false);
                    }
                    return;
                  }

                  // Arrastre con el dedo soltado en el escenario 3D
                  if (esMovil && t.clientX < window.innerWidth - 70) {
                    e.preventDefault();
                    await use3BFStore.getState().cargarDefinicion(item);
                    use3BFStore.getState().setMostrarNPanel(false);
                  }
                }}
                onClick={async () => {
                  await use3BFStore.getState().cargarDefinicion(item);
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    use3BFStore.getState().setMostrarNPanel(false);
                  }
                }}
                onDoubleClick={async () => {
                  await use3BFStore.getState().cargarDefinicion(item);
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    use3BFStore.getState().setMostrarNPanel(false);
                  }
                }}
                title={`${item.nombre} (${item.archivo}) - Haz clic o arrastra al visor 3D`}
                className={`group flex flex-col items-center cursor-grab active:cursor-grabbing p-0.5 lg:p-1 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all select-none relative w-[60px] lg:w-[88px] shrink-0 ${
                  draggedItemId === item.id ? "opacity-40 scale-95" : ""
                }`}
              >
                {/* Miniatura Cuadrada Estilo Blender */}
                <div 
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion || "#F1F5F9",
                    borderColor: coloresApariencia?.fondoAplicacion || coloresApariencia?.bordePaneles || "#E2E8F0",
                  }}
                  className="w-[56px] lg:w-[84px] h-[56px] lg:h-[84px] aspect-square rounded-lg overflow-hidden border shadow-2xs group-hover:border-cyan-500/80 group-hover:shadow-md transition-all relative flex items-center justify-center p-0 shrink-0"
                >
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.nombre} 
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <Box 
                      style={{ color: colorBotonActivo }} 
                      className="w-6 lg:w-9 h-6 lg:h-9 opacity-70" 
                    />
                  )}

                  {/* Botón de Captura de Miniatura en Hover (Cápsula circular) */}
                  <button
                    onClick={(e) => handleCapturarMiniaturaComponente(item, e)}
                    title={`Capturar vista 3D actual como miniatura para ${item.nombre}`}
                    className={`absolute top-0.5 lg:top-1 right-0.5 lg:right-1 p-1 rounded-full transition-all cursor-pointer shadow-xs z-10 ${
                      capturaExitosaId === item.id
                        ? "opacity-100 bg-emerald-600 text-white"
                        : "opacity-0 group-hover:opacity-100 bg-black/65 hover:bg-cyan-600 text-white"
                    }`}
                  >
                    {capturaExitosaId === item.id ? (
                      <Check className="w-2.5 lg:w-3.5 h-2.5 lg:h-3.5 text-white" />
                    ) : (
                      <Camera className={`w-2.5 lg:w-3.5 h-2.5 lg:h-3.5 ${capturandoCompId === item.id ? "animate-pulse" : ""}`} />
                    )}
                  </button>
                </div>

                {/* Nombre Limpio Estilo Blender */}
                <div className="w-full mt-1 lg:mt-1.5 px-0.5 text-center">
                  <p className="text-[10px] lg:text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {item.nombre}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {mueblesFiltrados.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-xs">
            No hay componentes en la categoría <span className="font-bold">"{categoriaMueble}"</span>.
          </div>
        )}
      </div>
    </div>
  );
}
