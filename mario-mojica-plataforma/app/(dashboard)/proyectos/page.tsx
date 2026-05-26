"use client"

import React, { useState, useEffect } from "react"
import { Folder, Plus, Search, Cpu, Layers, ShoppingBag, FolderGit2, Calendar, Loader2, AlertCircle, ArrowUpRight } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { NuevoProyectoModal } from "@/components/proyectos/nuevo-proyecto-modal"
import { DetalleProyectoModal } from "@/components/proyectos/detalle-proyecto-modal"
import { createClient } from "@/lib/supabase/client"

interface Proyecto {
  id: string
  nombre: string
  tipo_proyecto: "Aplicativo de armado" | "B2B" | "B2C" | "Genérico"
  estado: "Nuevo" | "En progreso" | "En revisión" | "Completado"
  progreso: number
  client_id: string
  solicitud_id: number | null
  created_at: string
  profiles?: {
    id: string
    full_name: string
    company: string
    email: string
  }
  solicitudes?: {
    id: number
    titulo: string
    descripcion: string
    adjuntos: string[]
    estado: string
    created_at: string
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Completado": return "bg-success/20 text-success border border-success/30"
    case "En revisión": return "bg-tertiary/20 text-tertiary border border-tertiary/30"
    case "En progreso": return "bg-primary/20 text-primary border border-primary/30"
    default: return "bg-on-surface-variant/20 text-on-surface-variant border border-on-surface-variant/30"
  }
}

function getProjectIcon(type: string) {
  switch (type) {
    case "Aplicativo de armado": return <Cpu className="h-5 w-5 text-primary" />
    case "B2B": return <Layers className="h-5 w-5 text-teal-400" />
    case "B2C": return <ShoppingBag className="h-5 w-5 text-pink-400" />
    default: return <FolderGit2 className="h-5 w-5 text-amber-400" />
  }
}

function getProjectIconBackground(type: string) {
  switch (type) {
    case "Aplicativo de armado": return "bg-primary/10"
    case "B2B": return "bg-teal-500/10"
    case "B2C": return "bg-pink-500/10"
    default: return "bg-amber-500/10"
  }
}

export default function ProyectosPage() {
  const { isSuperAdmin, isCoequipero, role } = usePermissions()
  const [mounted, setMounted] = useState(false)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos los estados")
  const [typeFilter, setTypeFilter] = useState("Todos los tipos")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Details Modal States
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Roles permitted to create projects
  const canCreate = isSuperAdmin || isCoequipero

  const fetchProyectos = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("proyectos")
        .select(`
          *,
          profiles!client_id (id, full_name, company, email),
          solicitudes!solicitud_id (id, titulo, descripcion, adjuntos, estado, created_at)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProyectos(data || [])
    } catch (err) {
      console.error("Error al cargar proyectos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchProyectos()
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2.5 text-sm">Cargando módulo de proyectos...</span>
      </div>
    )
  }

  // Filtrado de proyectos
  const filteredProjects = proyectos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.profiles?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.profiles?.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.solicitudes?.titulo || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "Todos los estados" || p.estado === statusFilter
    const matchesType = typeFilter === "Todos los tipos" || p.tipo_proyecto === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleCardClick = (project: Proyecto) => {
    setSelectedProject(project)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-6 h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Proyectos</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gestiona, visualiza y personaliza tus aplicativos de armado y proyectos interactivos.
          </p>
        </div>
        
        {/* Botón Nuevo Proyecto (Solo SuperAdmin y Coequipero) */}
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4.5 w-4.5" />
            Nuevo Proyecto
          </button>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, cliente o solicitud..."
            className="h-11 w-full rounded-xl bg-surface-container pl-11 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/10"
          />
        </div>

        {/* Filtro Tipo */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-11 rounded-xl bg-surface-container px-4 text-sm text-on-surface-variant focus:outline-none border border-outline-variant/10 cursor-pointer"
        >
          <option>Todos los tipos</option>
          <option>Aplicativo de armado</option>
          <option>B2B</option>
          <option>B2C</option>
          <option>Genérico</option>
        </select>

        {/* Filtro Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-xl bg-surface-container px-4 text-sm text-on-surface-variant focus:outline-none border border-outline-variant/10 cursor-pointer"
        >
          <option>Todos los estados</option>
          <option>Nuevo</option>
          <option>En progreso</option>
          <option>En revisión</option>
          <option>Completado</option>
        </select>
      </div>

      {/* Grid de Proyectos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-on-surface-variant">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-sm text-on-surface-variant/80">Cargando proyectos desde Supabase...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container py-16 text-center border border-outline-variant/15 p-6">
          <AlertCircle className="mb-4 h-12 w-12 text-primary/45" />
          <h3 className="text-lg font-bold text-on-surface">No se encontraron proyectos</h3>
          <p className="mt-1 max-w-sm text-sm text-on-surface-variant/80">
            {searchQuery || statusFilter !== "Todos los estados" || typeFilter !== "Todos los tipos"
              ? "Prueba cambiando los filtros de búsqueda o eliminando palabras clave."
              : canCreate
                ? "Aún no hay proyectos registrados en el sistema. Comienza creando el primero!"
                : "Aún no tienes ningún proyecto asignado. Cuando esté listo, podrás verlo aquí."}
          </p>
          {canCreate && !searchQuery && statusFilter === "Todos los estados" && typeFilter === "Todos los tipos" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              <Plus className="h-4.5 w-4.5" />
              Crear primer proyecto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleCardClick(project)}
              className="group cursor-pointer rounded-2xl bg-surface-container border border-outline-variant/15 p-5 transition-all duration-300 hover:bg-surface-container-high hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 flex flex-col justify-between"
            >
              <div>
                {/* Header de Tarjeta */}
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getProjectIconBackground(project.tipo_proyecto)}`}>
                    {getProjectIcon(project.tipo_proyecto)}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide uppercase ${getStatusColor(project.estado)}`}>
                    {project.estado}
                  </span>
                </div>

                {/* Contenido */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                    {project.tipo_proyecto}
                  </span>
                  <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                    {project.nombre}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </h3>
                  
                  {/* Metadata de Cliente y Solicitud */}
                  <div className="pt-2 text-xs space-y-1 text-on-surface-variant/80">
                    {project.profiles && (
                      <p>
                        <span className="font-semibold text-on-surface-variant">Cliente:</span>{" "}
                        {project.profiles.full_name}{" "}
                        {project.profiles.company ? `(${project.profiles.company})` : ""}
                      </p>
                    )}
                    {project.solicitudes && (
                      <p className="truncate">
                        <span className="font-semibold text-on-surface-variant">Solicitud:</span>{" "}
                        {project.solicitudes.titulo}
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 pt-1">
                      <Calendar className="h-3 w-3" />
                      Creado el {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-3 border-t border-outline-variant/10">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant/70">Progreso de desarrollo</span>
                  <span className="font-bold text-on-surface">{project.progreso}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-outline-variant/20">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${project.progreso}%` }}
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal de Nuevo Proyecto */}
      <NuevoProyectoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProyectos}
      />

      {/* Modal de Detalle de Proyecto & Panel de Carga de Insumos */}
      {selectedProject && (
        <DetalleProyectoModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedProject(null)
          }}
          proyecto={selectedProject}
          onUpdate={fetchProyectos}
        />
      )}

    </div>
  )
}
