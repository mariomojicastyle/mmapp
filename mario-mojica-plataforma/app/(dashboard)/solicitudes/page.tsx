"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Filter, ChevronRight, Clock, MoreVertical, AlertCircle, LayoutGrid, List, Paperclip, Download, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { MOCK_TICKETS, MOCK_SOLICITUDES, Ticket, Solicitud, TicketStatus, SolicitudEstado } from "@/lib/auth/tickets"
import { NuevaSolicitudModal } from "@/components/solicitudes/nueva-solicitud-modal"
import { SolicitudDetalle } from "@/components/solicitudes/solicitud-detalle"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"

export default function SolicitudesPage() {
  const { isSuperAdmin, isDesigner } = usePermissions()
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const sParam = searchParams.get("s")

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="flex items-center justify-center p-12 text-on-surface-variant">Cargando...</div>

  // Miembros del equipo (SuperAdmin y Diseñadores) ven la vista de gestión
  const isTeam = isSuperAdmin || isDesigner

  return isTeam ? <SuperAdminView initialId={sParam} /> : <ClientView initialId={sParam} />
}

// ═══════════════════════════════════════════
//  HOOK PARA CARGAR MIEMBROS DEL EQUIPO
// ═══════════════════════════════════════════
function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<{ id: string, name: string, initials: string, role: string, color: string }[]>([])
  
  useEffect(() => {
    async function fetchTeam() {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("id, full_name, email, job_title, role, company").in("role", ["superadmin", "designer"])
      if (data) {
        const colors = [
          "bg-blue-500/20 text-blue-500",
          "bg-emerald-500/20 text-emerald-500",
          "bg-amber-500/20 text-amber-500",
          "bg-purple-500/20 text-purple-500",
          "bg-pink-500/20 text-pink-500"
        ]
        const mapped = data.map((d, i) => ({
          id: d.id,
          name: d.full_name || d.email,
          initials: (d.full_name || d.email).substring(0, 2).toUpperCase(),
          role: d.job_title || d.role,
          company: d.company,
          color: colors[i % colors.length]
        }))
        setTeamMembers(mapped)
      }
    }
    fetchTeam()
  }, [])
  
  return teamMembers
}

// ═══════════════════════════════════════════
//  VISTA SUPERADMIN / TEAM (Kanban con drag & drop)
// ═══════════════════════════════════════════
function SuperAdminView({ initialId }: { initialId: string | null }) {
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedSolicitud, setSelectedSolicitud] = useState<{id: string, titulo: string, descripcion: string} | null>(null)
  const teamMembers = useTeamMembers()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    async function fetchTickets() {
      try {
        const { data, error } = await supabase
          .from("solicitudes")
          .select("*, profiles!solicitudes_client_profiles_fkey(full_name, company)")
          .order("created_at", { ascending: false })
          
        if (error) throw error
        if (data) {
          const statusMap: Record<string, TicketStatus> = {
            "Nueva": "backlog",
            "En progreso": "in_progress",
            "Esperando cliente": "waiting_client",
            "En revisión": "review",
            "Resuelta": "done"
          }
          
          const mapped: Ticket[] = data.map(d => {
            const profile = d.profiles as any
            const clientName = profile 
              ? `${profile.full_name}${profile.company ? ` (${profile.company})` : ""}`
              : "Cliente"
              
            return {
              id: String(d.id).padStart(5, "0"),
              title: d.titulo || "",
              description: d.descripcion || "",
              status: statusMap[d.estado] || "backlog",
              priority: "medium",
              client_id: d.client_id || "",
              client_name: clientName,
              created_at: new Date(d.created_at).toISOString(),
              updated_at: new Date(d.updated_at || d.created_at).toISOString(),
              due_date: d.fecha_sugerida_entrega || undefined,
              assigned_to: d.assigned_to || undefined,
              assigned_to_id: d.assigned_to_id || undefined,
              adjuntos: d.adjuntos || [],
              tipo_solicitud: d.tipo_solicitud || "",
              estado_entrega: d.estado_entrega || 'pendiente',
              fecha_equipo: d.fecha_equipo || undefined
            }
          })
          setTickets(mapped)
        }
      } catch (err) {
        console.error("Error fetching tickets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()

    // Suscripción Realtime para SuperAdmin
    const channel = supabase
      .channel('solicitudes_realtime_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        () => {
          fetchTickets() // Recargar todo para mantener consistencia
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (initialId && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === initialId)
      if (ticket) {
        setSelectedSolicitud({ id: ticket.id, titulo: ticket.title, descripcion: ticket.description })
        // Limpiar el parámetro de la URL para evitar que se abra al refrescar
        router.replace('/solicitudes', { scroll: false })
      }
    }
  }, [initialId, tickets, router])

  const handleDownloadAdjuntos = async (t: Ticket) => {
    if (!t.adjuntos || t.adjuntos.length === 0) return;
    setDownloadingId(t.id);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const supabase = createClient();
      
      const folder = zip.folder(`adjuntos-${t.id}`);
      if (!folder) throw new Error("Could not create zip folder");

      for (const path of t.adjuntos) {
        const { data, error } = await supabase.storage.from('solicitudes').download(path);
        if (error) {
          console.error("Error downloading", path, error);
          continue;
        }
        if (data) {
          const fileName = path.split('/').pop() || path;
          folder.file(fileName, data);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solicitud-${t.id}-adjuntos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error zipping files:", err);
      alert("Hubo un error comprimiendo los archivos.");
    } finally {
      setDownloadingId(null);
    }
  }

  const filtered = tickets.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMoveTicket = async (ticketId: string, newStatus: TicketStatus) => {
    // 1. Update local state
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))

    // 2. Map back to DB status
    const reverseStatusMap: Record<TicketStatus, string> = {
      "backlog": "Nueva",
      "todo": "En progreso",
      "in_progress": "En progreso",
      "waiting_client": "Esperando cliente",
      "review": "En revisión",
      "done": "Resuelta"
    }

    const dbStatus = reverseStatusMap[newStatus]

    // 3. Update DB
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("solicitudes")
        .update({ 
          estado: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", parseInt(ticketId, 10))

      if (error) throw error
    } catch (err) {
      console.error("Error updating status in DB:", err)
    }
  }

  const handleAssignTicket = async (ticketId: string, assigneeId: string, assigneeName: string) => {
    // Update local state
    setTickets(prev => prev.map(t => t.id === ticketId ? { 
      ...t, 
      assigned_to: assigneeName || undefined,
      assigned_to_id: assigneeId || undefined
    } : t))
    
    // Update DB
    try {
      const supabase = createClient()
      const { error } = await supabase.from("solicitudes").update({ 
        assigned_to_id: assigneeId || null,
        assigned_to: assigneeName || null // Keep name for legacy/display cache
      }).eq("id", parseInt(ticketId, 10))
      
      if (error) {
        console.error("Error updating assignment:", error)
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Solicitudes</h1>
          <p className="text-sm text-on-surface-variant">Gestiona todas las solicitudes de tus clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-surface-container-high p-1">
            <button onClick={() => setView("kanban")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all", view === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-on-surface-variant hover:text-on-surface")}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-all", view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-on-surface-variant hover:text-on-surface")}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" placeholder="Buscar por ID o título..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-all hover:bg-surface-container">
          <Filter className="h-4 w-4" /><span>Filtros</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex justify-center p-12 text-on-surface-variant">Cargando solicitudes...</div>
        ) : view === "kanban" ? (
          <KanbanView 
            key="k" 
            tickets={filtered} 
            teamMembers={teamMembers} 
            onMoveTicket={handleMoveTicket} 
            onAssignTicket={handleAssignTicket} 
            onSelectTicket={(t) => setSelectedSolicitud({id: t.id, titulo: t.title, descripcion: t.description})} 
          />
        ) : (
          <SuperAdminListView 
            key="l" 
            tickets={filtered} 
            teamMembers={teamMembers} 
            onAssignTicket={handleAssignTicket} 
            onSelectTicket={(t) => setSelectedSolicitud({id: t.id, titulo: t.title, descripcion: t.description})}
            onDownload={handleDownloadAdjuntos}
            downloadingId={downloadingId}
          />
        )}
      </AnimatePresence>

      {/* SlideOver de Comentarios */}
      {selectedSolicitud && (
        <SolicitudDetalle 
          isOpen={!!selectedSolicitud} 
          onClose={() => setSelectedSolicitud(null)} 
          solicitudId={selectedSolicitud.id} 
          solicitudTitulo={selectedSolicitud.titulo} 
          solicitudDescripcion={selectedSolicitud.descripcion} 
          onStatusChange={(estado_entrega, fecha_equipo) => {
            setTickets(prev => prev.map(t => t.id === selectedSolicitud.id ? { 
              ...t, 
              estado_entrega: estado_entrega as any, 
              fecha_equipo: fecha_equipo || t.fecha_equipo,
              due_date: (estado_entrega === "confirmada" && fecha_equipo) ? fecha_equipo : t.due_date 
            } : t))
          }}
        />
      )}
    </div>
  )
}

function AssigneeSelector({ currentAssigneeId, teamMembers = [], onAssign }: { currentAssigneeId?: string, teamMembers: any[], onAssign: (id: string, name: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const assignee = teamMembers?.find(m => m.id === currentAssigneeId)

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none">
        {assignee ? (
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", assignee.color)} title={assignee.name}>
            {assignee.initials}
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-outline-variant text-on-surface-variant text-[10px] hover:border-primary hover:text-primary transition-colors" title="Asignar">
            <Plus className="h-3 w-3" />
          </div>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 right-0 top-full mt-2 w-48 rounded-xl border border-outline-variant bg-surface-container-high p-2 shadow-xl">
              <div className="mb-2 px-2 text-[10px] font-bold uppercase text-on-surface-variant">Asignar a</div>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                <button onClick={() => { onAssign("", ""); setIsOpen(false) }} className="flex items-center px-2 py-1.5 text-xs text-on-surface hover:bg-surface-container-highest rounded-md">Sin asignar</button>
                {teamMembers.map(m => (
                  <button key={m.id} onClick={() => { onAssign(m.id, m.name); setIsOpen(false) }} className="flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface hover:bg-surface-container-highest rounded-md text-left">
                    <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold", m.color)}>{m.initials}</div>
                    <div className="flex flex-col"><span className="font-medium truncate">{m.name}</span><span className="text-[9px] text-on-surface-variant">{m.company || m.role}</span></div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function KanbanView({ tickets, teamMembers, onMoveTicket, onAssignTicket, onSelectTicket }: { tickets: Ticket[], teamMembers: any[], onMoveTicket: (id: string, status: TicketStatus) => void, onAssignTicket: (id: string, assigneeId: string, assigneeName: string) => void, onSelectTicket: (t: Ticket) => void }) {
  const columns: { id: TicketStatus; label: string; color: string }[] = [
    { id: "backlog", label: "Backlog", color: "bg-slate-500" },
    { id: "todo", label: "Por hacer", color: "bg-blue-500" },
    { id: "in_progress", label: "En progreso", color: "bg-amber-500" },
    { id: "waiting_client", label: "Esperando", color: "bg-orange-400" },
    { id: "review", label: "Revisión", color: "bg-purple-500" },
    { id: "done", label: "Completado", color: "bg-emerald-500" },
  ]

  const dragInProgress = React.useRef(false)

  const handleDragStart = () => {
    dragInProgress.current = true
  }

  const handleDragEnd = (result: DropResult) => {
    // Mantener dragInProgress en true un momento extra para evitar clics accidentales
    setTimeout(() => {
      dragInProgress.current = false
    }, 150)

    if (!result.destination) return
    const ticketId = result.draggableId
    const newStatus = result.destination.droppableId as TicketStatus
    
    if (onMoveTicket) {
      onMoveTicket(ticketId, newStatus)
    }
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-6 gap-3">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className={cn("h-2 w-2 rounded-full", col.color)} />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">{col.label}</h3>
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">{tickets.filter(t => t.status === col.id).length}</span>
            </div>
            
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl bg-surface-container-lowest/50 p-2 min-h-[400px] border transition-colors",
                    snapshot.isDraggingOver ? "bg-surface-container border-primary/50" : "border-outline-variant/30"
                  )}
                >
                  {tickets.filter(t => t.status === col.id).map((ticket, index) => (
                    <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => {
                            if (!dragInProgress.current) {
                              onSelectTicket(ticket)
                            }
                          }}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                            transform: snapshot.isDragging ? provided.draggableProps.style?.transform : "none"
                          }}
                          className={cn(
                            "group flex flex-col gap-2 rounded-xl border p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing",
                            snapshot.isDragging ? "border-primary shadow-lg bg-surface-container-high z-50 scale-105" : "border-outline-variant bg-surface-container-low hover:border-primary/50 hover:shadow-md"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">{ticket.id}</span>
                            <button className="rounded-lg p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:bg-surface-container"><MoreVertical className="h-4 w-4" /></button>
                          </div>
                          <h4 className="text-xs font-semibold leading-snug text-on-surface group-hover:text-primary transition-colors">{ticket.title}</h4>
                          <div className="flex flex-wrap gap-2">
                            <PriorityBadge priority={ticket.priority} />
                            <span className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-medium text-on-surface-variant truncate max-w-[160px]">{ticket.client_name}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between border-t border-outline-variant/50 pt-3">
                            <div className="flex items-center gap-2 text-on-surface-variant"><Clock className="h-3 w-3" /><span className="text-[10px]">2 días</span></div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <AssigneeSelector currentAssigneeId={ticket.assigned_to_id} teamMembers={teamMembers} onAssign={(id, name) => onAssignTicket(ticket.id, id, name)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </motion.div>
    </DragDropContext>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: "Baja", cls: "text-slate-500 bg-slate-500/10" },
    medium: { label: "Media", cls: "text-blue-500 bg-blue-500/10" },
    high: { label: "Alta", cls: "text-orange-500 bg-orange-500/10" },
    urgent: { label: "Urgente", cls: "text-red-500 bg-red-500/10" },
  }
  const p = map[priority] || map.medium
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase", p.cls)}>{p.label}</span>
}

function SuperAdminListView({ 
  tickets, 
  teamMembers, 
  onAssignTicket, 
  onSelectTicket,
  onDownload,
  downloadingId
}: { 
  tickets: Ticket[], 
  teamMembers: any[], 
  onAssignTicket: (ticketId: string, assigneeId: string, assigneeName: string) => void, 
  onSelectTicket: (t: Ticket) => void,
  onDownload: (t: Ticket) => void,
  downloadingId: string | null
}) {
  const statusLabels: Record<string, string> = { backlog: "Backlog", todo: "Por hacer", in_progress: "En progreso", waiting_client: "Esperando", review: "Revisión", done: "Completado" }
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-5 py-4">ID</th>
              <th className="px-5 py-4">Título</th>
              <th className="px-5 py-4">Descripción</th>
              <th className="px-5 py-4">Solicitud (M/D/A)</th>
              <th className="px-5 py-4">Asignado</th>
              <th className="px-5 py-4">Entrega Sugerida</th>
              <th className="px-5 py-4">Adjuntos</th>
              <th className="px-5 py-4">Tipo</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {tickets.map(t => (
              <tr key={t.id} onClick={() => onSelectTicket(t)} className="group transition-colors hover:bg-surface-container-low/50 cursor-pointer">
                <td className="px-5 py-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tight">{t.id}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{t.title}</span>
                </td>
                <td className="px-5 py-4 max-w-[180px]">
                  <p className="truncate text-xs text-on-surface-variant">{t.description}</p>
                </td>
                <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                  {new Date(t.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                </td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <AssigneeSelector currentAssigneeId={t.assigned_to_id} teamMembers={teamMembers} onAssign={(id, name) => onAssignTicket(t.id, id, name)} />
                </td>
                <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {t.due_date && (
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        t.estado_entrega === "confirmada" ? "bg-emerald-500" :
                        t.estado_entrega === "propuesta_equipo" ? "bg-amber-500" :
                        "bg-rose-500"
                      )} title={t.estado_entrega === "confirmada" ? "Confirmada" : t.estado_entrega === "propuesta_equipo" ? "Contrapropuesta" : "Pendiente de validación"} />
                    )}
                    <span>{t.due_date ? new Date(t.due_date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "No especificada"}</span>
                  </div>
                </td>
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  {t.adjuntos && t.adjuntos.length > 0 ? (
                    <button
                      onClick={() => onDownload(t)}
                      disabled={downloadingId === t.id}
                      className="flex items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === t.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {t.adjuntos.length} {t.adjuntos.length === 1 ? 'Archivo' : 'Archivos'}
                    </button>
                  ) : (
                    <span className="text-xs text-on-surface-variant italic">Ninguno</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-surface-container-high px-2 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-tight whitespace-nowrap">
                    {t.tipo_solicitud || "General"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className={cn("h-2 w-2 rounded-full", t.status === "done" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-amber-500" : "bg-slate-400")} />
                    <span className="text-xs font-semibold text-on-surface">{statusLabels[t.status]}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <ChevronRight className="ml-auto h-4 w-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="flex flex-col items-center py-12">
          <AlertCircle className="mb-2 h-8 w-8 text-on-surface-variant/30" />
          <p className="text-sm text-on-surface-variant">No se encontraron solicitudes.</p>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════
//  VISTA CLIENTE (Admin / Diseñador / Lector)
// ═══════════════════════════════════════════
function ClientView({ initialId }: { initialId: string | null }) {
  const teamMembers = useTeamMembers()
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const { role } = usePermissions()
  const canCreate = role === "admin"
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedSolicitud, setSelectedSolicitud] = useState<{id: string, titulo: string, descripcion: string} | null>(null)

  const handleDownloadAdjuntos = async (s: Solicitud) => {
    if (!s.adjuntos || s.adjuntos.length === 0) return;
    setDownloadingId(s.id);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const supabase = createClient();
      
      const folder = zip.folder(`adjuntos-${s.id}`);
      if (!folder) throw new Error("Could not create zip folder");

      for (const path of s.adjuntos) {
        const { data, error } = await supabase.storage.from('solicitudes').download(path);
        if (error) {
          console.error("Error downloading", path, error);
          continue;
        }
        if (data) {
          const fileName = path.split('/').pop() || path;
          folder.file(fileName, data);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solicitud-${s.id}-adjuntos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error zipping files:", err);
      alert("Hubo un error comprimiendo los archivos.");
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: any

    async function fetchSolicitudes() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        let query = supabase.from("solicitudes").select("*").order("created_at", { ascending: false })
        
        if (user && role !== "superadmin") {
          query = query.eq("client_id", user.id)
        }

        const { data, error } = await query
        if (error) throw error

        if (data) {
          const mapped: Solicitud[] = data.map(d => ({
            id: String(d.id).padStart(5, "0"),
            titulo: d.titulo || "",
            descripcion: d.descripcion || "",
            fecha_solicitud: d.created_at ? new Date(d.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "",
            fecha_sugerida_entrega: d.fecha_sugerida_entrega ? new Date(d.fecha_sugerida_entrega).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "No especificada",
            adjuntos: d.adjuntos || [],
            tipo_solicitud: d.tipo_solicitud as TipoSolicitud,
            estado: d.estado as SolicitudEstado,
            assigned_to: d.assigned_to || undefined,
            assigned_to_id: d.assigned_to_id || undefined,
            estado_entrega: d.estado_entrega || 'pendiente',
            fecha_equipo: d.fecha_equipo || undefined
          }))
          setSolicitudes(mapped)
        }
      } catch (err) {
        console.error("Error fetching solicitudes:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSolicitudes()

    // Suscripción Realtime para Cliente
    channel = supabase
      .channel('solicitudes_realtime_client')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solicitudes' },
        () => {
          fetchSolicitudes()
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [role])

  useEffect(() => {
    if (initialId && solicitudes.length > 0) {
      const sol = solicitudes.find(s => s.id === initialId)
      if (sol) {
        setSelectedSolicitud({ id: sol.id, titulo: sol.titulo, descripcion: sol.descripcion })
        // Limpiar el parámetro de la URL para evitar que se abra al refrescar
        router.replace('/solicitudes', { scroll: false })
      }
    }
  }, [initialId, solicitudes, router])

  const estadoColors: Record<SolicitudEstado, { dot: string; text: string }> = {
    "Nueva": { dot: "bg-blue-500", text: "text-blue-400" },
    "En progreso": { dot: "bg-amber-500", text: "text-amber-400" },
    "Esperando cliente": { dot: "bg-orange-400", text: "text-orange-400" },
    "En revisión": { dot: "bg-purple-500", text: "text-purple-400" },
    "Resuelta": { dot: "bg-emerald-500", text: "text-emerald-400" },
  }

  const filteredSolicitudes = solicitudes.filter(s =>
    s.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery)
  )

  // Stats
  const total = solicitudes.length
  const nuevas = solicitudes.filter(s => s.estado === "Nueva").length
  const enCurso = solicitudes.filter(s => s.estado === "En progreso" || s.estado === "En revisión").length
  const resueltas = solicitudes.filter(s => s.estado === "Resuelta").length

  const nextId = String(solicitudes.length + 1).padStart(5, "0")

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Solicitudes</h1>
          <p className="text-sm text-on-surface-variant">Estado y seguimiento de tus solicitudes.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" /><span>Nueva Solicitud</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total solicitudes", value: total, icon: "📋" },
          { label: "Nuevas", value: nuevas, color: "text-blue-400", dot: "bg-blue-500" },
          { label: "En curso", value: enCurso, color: "text-amber-400", dot: "bg-amber-500" },
          { label: "Resueltas", value: resueltas, color: "text-emerald-400", dot: "bg-emerald-500" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
            <div className="flex items-center gap-2 mb-2">
              {stat.dot && <div className={cn("h-2 w-2 rounded-full", stat.dot)} />}
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
            </div>
            <span className={cn("text-3xl font-bold", stat.color || "text-on-surface")}>
              {String(stat.value).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input type="text" placeholder="Buscar solicitudes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container">
          <Filter className="h-4 w-4" /><span>Filtros</span>
        </button>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">ID</th>
                <th className="px-5 py-4">Título</th>
                <th className="px-5 py-4 hidden lg:table-cell">Descripción</th>
                <th className="px-5 py-4">Fecha solicitud (M/D/A)</th>
                <th className="px-5 py-4">Asignado</th>
                <th className="px-5 py-4 hidden md:table-cell">Entrega sugerida (M/D/A)</th>
                <th className="px-5 py-4 hidden md:table-cell">Adjuntos</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-on-surface-variant">
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : filteredSolicitudes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-8 text-center text-on-surface-variant">
                    No se encontraron solicitudes.
                  </td>
                </tr>
              ) : filteredSolicitudes.map(s => (
                <tr key={s.id} onClick={() => setSelectedSolicitud({ id: s.id, titulo: s.titulo, descripcion: s.descripcion })} className="group transition-colors hover:bg-surface-container-low/50 cursor-pointer">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold text-on-surface-variant">{s.id}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{s.titulo}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell max-w-[200px]">
                    <span className="text-xs text-on-surface-variant line-clamp-2">{s.descripcion}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap">{s.fecha_solicitud}</td>
                  <td className="px-5 py-4">
                    {(() => {
                      const assignee = teamMembers?.find(m => m.id === s.assigned_to_id)
                      if (!assignee) return <span className="text-xs text-on-surface-variant italic">Sin asignar</span>
                      return (
                        <div className="flex items-center gap-2">
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0", assignee.color)} title={assignee.name}>
                            {assignee.initials}
                          </div>
                          <div className="flex flex-col hidden sm:flex">
                            <span className="text-xs font-medium text-on-surface">
                              {assignee.name} {assignee.company ? `(${assignee.company})` : ""}
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-4 text-xs text-on-surface-variant whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {s.fecha_sugerida_entrega !== "No especificada" && (
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          s.estado_entrega === "confirmada" ? "bg-emerald-500" :
                          s.estado_entrega === "propuesta_equipo" ? "bg-amber-500" :
                          "bg-rose-500"
                        )} title={s.estado_entrega === "confirmada" ? "Confirmada" : s.estado_entrega === "propuesta_equipo" ? "Fátima propone nueva fecha" : "Pendiente de revisión"} />
                      )}
                      <span>{s.fecha_sugerida_entrega}</span>
                    </div>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    {s.adjuntos && s.adjuntos.length > 0 ? (
                      <button
                        onClick={() => handleDownloadAdjuntos(s)}
                        disabled={downloadingId === s.id}
                        className="flex items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        {s.adjuntos.length} {s.adjuntos.length === 1 ? 'Archivo' : 'Archivos'}
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant italic">Ninguno</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-surface-container-high px-2 py-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-tight whitespace-nowrap">
                      {s.tipo_solicitud}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className={cn("h-2 w-2 rounded-full", estadoColors[s.estado].dot)} />
                      <span className={cn("text-xs font-semibold", estadoColors[s.estado].text)}>{s.estado}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-1" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {solicitudes.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <AlertCircle className="mb-2 h-8 w-8 text-on-surface-variant/30" />
            <p className="text-sm text-on-surface-variant">No se encontraron solicitudes.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-outline-variant px-5 py-3">
          <span className="text-xs text-on-surface-variant">Mostrando {filteredSolicitudes.length} de {solicitudes.length} resultados</span>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">1</button>
          </div>
        </div>
      </motion.div>

      {/* SlideOver de Comentarios */}
      {selectedSolicitud && (
        <SolicitudDetalle 
          isOpen={!!selectedSolicitud} 
          onClose={() => setSelectedSolicitud(null)} 
          solicitudId={selectedSolicitud.id} 
          solicitudTitulo={selectedSolicitud.titulo} 
          solicitudDescripcion={selectedSolicitud.descripcion} 
          onStatusChange={(estado_entrega, fecha_equipo) => {
            setSolicitudes(prev => prev.map(s => s.id === selectedSolicitud.id ? { 
              ...s, 
              estado_entrega: estado_entrega as any, 
              fecha_equipo: fecha_equipo || s.fecha_equipo,
              fecha_sugerida_entrega: (estado_entrega === "confirmada" && fecha_equipo) 
                ? new Date(fecha_equipo).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) 
                : s.fecha_sugerida_entrega
            } : s))
          }}
        />
      )}

      {/* Modal Nueva Solicitud */}
      <NuevaSolicitudModal isOpen={showModal} onClose={() => setShowModal(false)} nextId={nextId} />
    </div>
  )
}
