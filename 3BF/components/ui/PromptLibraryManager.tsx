"use client";

import React, { useState, useMemo } from "react";
import { use3BFStore, PromptTemplateItem } from "@/lib/store";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Sparkles, 
  RotateCcw,
  Tag,
  ArrowRight,
  Sliders
} from "lucide-react";

interface PromptLibraryManagerProps {
  onSelectPrompt: (promptText: string, item: PromptTemplateItem) => void;
  promptSeleccionadoId?: string | null;
}

const CATEGORIAS: Array<PromptTemplateItem["categoria"] | "Todos" | "Favoritos"> = [
  "Todos",
  "Favoritos",
  "Oficina",
  "Hogar / Sala",
  "Dormitorio",
  "Comercial / Tienda",
  "Estudio Fotográfico",
  "Personalizado"
];

export default function PromptLibraryManager({
  onSelectPrompt,
  promptSeleccionadoId
}: PromptLibraryManagerProps) {
  const {
    bibliotecaPrompts,
    guardarNuevoPrompt,
    actualizarPrompt,
    eliminarPrompt,
    toggleFavoritoPrompt,
    restaurarPromptsDefecto,
    coloresApariencia,
    tema
  } = use3BFStore();

  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [modoCrear, setModoCrear] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Estado para el formulario de nuevo/editar prompt
  const [formTitulo, setFormTitulo] = useState("");
  const [formCategoria, setFormCategoria] = useState<PromptTemplateItem["categoria"]>("Oficina");
  const [formPrompt, setFormPrompt] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formAspectRatio, setFormAspectRatio] = useState<"1:1" | "16:9" | "4:3" | "9:16">("1:1");

  // Filtrado de prompts
  const promptsFiltrados = useMemo(() => {
    return bibliotecaPrompts.filter((p) => {
      // Filtro por categoría
      if (categoriaActiva === "Favoritos" && !p.esFavorito) return false;
      if (categoriaActiva !== "Todos" && categoriaActiva !== "Favoritos" && p.categoria !== categoriaActiva) {
        return false;
      }
      // Filtro por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return (
          p.titulo.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [bibliotecaPrompts, categoriaActiva, busqueda]);

  const iniciarCreacion = () => {
    setFormTitulo("");
    setFormCategoria("Oficina");
    setFormPrompt("");
    setFormDescripcion("");
    setFormAspectRatio("1:1");
    setEditandoId(null);
    setModoCrear(true);
  };

  const iniciarEdicion = (item: PromptTemplateItem) => {
    setFormTitulo(item.titulo);
    setFormCategoria(item.categoria);
    setFormPrompt(item.prompt);
    setFormDescripcion(item.descripcion || "");
    setFormAspectRatio(item.aspectRatio || "1:1");
    setEditandoId(item.id);
    setModoCrear(true);
  };

  const guardarFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formPrompt.trim()) return;

    if (editandoId) {
      actualizarPrompt(editandoId, {
        titulo: formTitulo.trim(),
        categoria: formCategoria,
        prompt: formPrompt.trim(),
        descripcion: formDescripcion.trim(),
        aspectRatio: formAspectRatio
      });
    } else {
      guardarNuevoPrompt({
        titulo: formTitulo.trim(),
        categoria: formCategoria,
        prompt: formPrompt.trim(),
        descripcion: formDescripcion.trim(),
        aspectRatio: formAspectRatio,
        esFavorito: false
      });
    }

    setModoCrear(false);
    setEditandoId(null);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-xs">
      {/* Encabezado y Barra de Acciones */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: coloresApariencia?.bordePaneles }}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
          <span className="font-extrabold text-sm" style={{ color: coloresApariencia?.textoPrincipal }}>
            Biblioteca de Prompts
          </span>
          <span 
            className="px-2 py-0.5 rounded-full text-[10px] font-mono border"
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.botonActivo || "#0891b2"
            }}
          >
            {bibliotecaPrompts.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={restaurarPromptsDefecto}
            className="flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold transition cursor-pointer hover:opacity-80 shadow-2xs"
            style={{
              backgroundColor: coloresApariencia?.fondoPaneles,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoSecundario
            }}
            title="Restaurar presets de fábrica si fueron modificados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Fábrica</span>
          </button>

          <button
            onClick={iniciarCreacion}
            className="flex items-center gap-1 px-3.5 py-1 rounded-full font-semibold text-xs transition shadow-xs text-white cursor-pointer hover:opacity-90"
            style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
            title="Crear nueva plantilla de prompt"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Prompt</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50" style={{ color: coloresApariencia?.textoSecundario }} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por ambiente, estilo o palabra clave..."
          className="w-full pl-8 pr-3 py-1.5 rounded-md border text-xs outline-none transition"
          style={{
            backgroundColor: coloresApariencia?.fondoPaneles,
            borderColor: coloresApariencia?.bordePaneles,
            color: coloresApariencia?.textoPrincipal
          }}
        />
      </div>

      {/* Categorías / Pestañas Horizontales */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIAS.map((cat) => {
          const esActiva = categoriaActiva === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition border cursor-pointer"
              style={{
                backgroundColor: esActiva
                  ? (coloresApariencia?.botonActivo || "#0891b2")
                  : (coloresApariencia?.fondoAplicacion || (tema === "obsidian" ? "#1E293B" : "#F1F5F9")),
                borderColor: esActiva
                  ? (coloresApariencia?.botonActivo || "#0891b2")
                  : (coloresApariencia?.bordePaneles || (tema === "obsidian" ? "#334155" : "#CBD5E1")),
                color: esActiva
                  ? "#FFFFFF"
                  : (coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94A3B8" : "#475569"))
              }}
            >
              {cat === "Favoritos" ? "⭐ Favoritos" : cat}
            </button>
          );
        })}
      </div>

      {/* Formulario de Creación / Edición */}
      {modoCrear ? (
        <form 
          onSubmit={guardarFormulario} 
          className="flex flex-col gap-2.5 p-3 rounded-lg border shadow-sm transition"
          style={{
            backgroundColor: coloresApariencia?.fondoPaneles,
            borderColor: coloresApariencia?.bordePaneles
          }}
        >
          <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: coloresApariencia?.bordePaneles }}>
            <span className="font-bold text-xs" style={{ color: coloresApariencia?.textoPrincipal }}>
              {editandoId ? "Editar Plantilla de Prompt" : "Crear Nueva Plantilla"}
            </span>
            <button
              type="button"
              onClick={() => setModoCrear(false)}
              className="text-[11px] font-semibold hover:underline cursor-pointer"
              style={{ color: coloresApariencia?.textoSecundario }}
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>Título:</label>
              <input
                type="text"
                required
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="ej: Oficina Nórdica al Atardecer"
                className="px-2 py-1 rounded border text-xs outline-none"
                style={{
                  backgroundColor: coloresApariencia?.fondoAplicacion,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>Categoría:</label>
              <select
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value as any)}
                className="px-2 py-1 rounded border text-xs outline-none cursor-pointer"
                style={{
                  backgroundColor: coloresApariencia?.fondoAplicacion,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
              >
                <option value="Oficina">Oficina</option>
                <option value="Hogar / Sala">Hogar / Sala</option>
                <option value="Dormitorio">Dormitorio</option>
                <option value="Comercial / Tienda">Comercial / Tienda</option>
                <option value="Estudio Fotográfico">Estudio Fotográfico</option>
                <option value="Exterior / Terraza">Exterior / Terraza</option>
                <option value="Personalizado">Personalizado</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>
              Prompt para la IA (en español o inglés con detalles arquitectónicos):
            </label>
            <textarea
              required
              rows={4}
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              placeholder="Fotografía editorial de arquitectura de alta gama del mueble..."
              className="p-2 rounded border text-xs outline-none font-mono leading-relaxed"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>Descripción breve:</label>
            <input
              type="text"
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              placeholder="Para renders de catálogos y propuestas comerciales..."
              className="px-2 py-1 rounded border text-xs outline-none"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModoCrear(false)}
              className="px-3.5 py-1 rounded-full border text-xs font-semibold hover:opacity-80 cursor-pointer shadow-2xs"
              style={{ borderColor: coloresApariencia?.bordePaneles, color: coloresApariencia?.textoSecundario }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full font-semibold text-xs text-white shadow-xs flex items-center gap-1 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar en Biblioteca</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Lista de Tarjetas de Prompts */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        {promptsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center opacity-60 gap-2">
            <Tag className="w-8 h-8 stroke-1" style={{ color: coloresApariencia?.textoSecundario }} />
            <p className="text-xs font-semibold" style={{ color: coloresApariencia?.textoSecundario }}>
              No se encontraron prompts en esta categoría.
            </p>
          </div>
        ) : (
          promptsFiltrados.map((item) => {
            const esSeleccionado = promptSeleccionadoId === item.id;
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border transition flex flex-col gap-1.5"
                style={{
                  backgroundColor: coloresApariencia?.fondoPaneles,
                  borderColor: esSeleccionado ? (coloresApariencia?.botonActivo || "#0891b2") : coloresApariencia?.bordePaneles,
                  boxShadow: esSeleccionado ? `0 0 0 1.5px ${coloresApariencia?.botonActivo || "#0891b2"}` : undefined
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-xs" style={{ color: coloresApariencia?.textoPrincipal }}>
                      {item.titulo}
                    </span>
                    <span 
                      className="px-1.5 py-0.2 text-[9px] font-bold rounded border"
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoSecundario
                      }}
                    >
                      {item.categoria}
                    </span>
                    {item.esPresetSistema && (
                      <span 
                        className="px-1.5 py-0.2 text-[9px] font-bold rounded border"
                        style={{
                          backgroundColor: tema === "obsidian" ? "rgba(16, 185, 129, 0.15)" : "#DCFCE7",
                          color: tema === "obsidian" ? "#6EE7B7" : "#166534",
                          borderColor: tema === "obsidian" ? "rgba(16, 185, 129, 0.3)" : "#BBF7D0"
                        }}
                      >
                        Fábrica
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFavoritoPrompt(item.id)}
                      className="p-1 rounded transition hover:opacity-80 cursor-pointer"
                      title={item.esFavorito ? "Quitar de favoritos" : "Marcar como favorito"}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.esFavorito ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                    </button>
                    <button
                      onClick={() => iniciarEdicion(item)}
                      className="p-1 rounded transition hover:opacity-80 cursor-pointer"
                      style={{ color: coloresApariencia?.textoSecundario }}
                      title="Editar plantilla"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {!item.esPresetSistema && (
                      <button
                        onClick={() => eliminarPrompt(item.id)}
                        className="p-1 rounded text-red-500 transition hover:opacity-80 cursor-pointer"
                        title="Eliminar plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {item.descripcion && (
                  <p className="text-[11px] leading-tight" style={{ color: coloresApariencia?.textoSecundario }}>
                    {item.descripcion}
                  </p>
                )}

                <p 
                  className="text-[11px] font-mono line-clamp-2 p-2 rounded border leading-relaxed"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                >
                  {item.prompt}
                </p>

                <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-dashed" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                  <span className="text-[10px] font-mono opacity-70" style={{ color: coloresApariencia?.textoSecundario }}>
                    Aspecto sugerido: {item.aspectRatio || "1:1"}
                  </span>
                  <button
                    onClick={() => onSelectPrompt(item.prompt, item)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-xs text-white shadow-xs transition cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cargar en Render</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
