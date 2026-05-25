/* eslint-disable prefer-const */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, Filter, ChevronRight, Clock, MoreVertical, AlertCircle, LayoutGrid, List, Paperclip, Download, Loader2, Edit2, Trash2, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { MOCK_TICKETS, MOCK_SOLICITUDES, Ticket, Solicitud, TicketStatus, SolicitudEstado, TipoSolicitud } from "@/lib/auth/tickets"
import { NuevaSolicitudModal } from "@/components/solicitudes/nueva-solicitud-modal"
import { SolicitudDetalle } from "@/components/solicitudes/solicitud-detalle"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"
import { getCompanySolicitudes } from "@/app/actions/solicitudes"

const formatDateSafe = (dateStr: string | null): string => {
  if (!dateStr) return "No especificada";
  try {
    const onlyDate = dateStr.split('T')[0];
    const [y, m, d] = onlyDate.split('-');
    if (!y || !m || !d) return "No especificada";
    return `${m}/${d}/${y}`;
  } catch(e) {
    return "No especificada";
  }
}

export default function SolicitudesPage() {
  const { isSuperAdmin, isCoequipero, role } = usePermissions()
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const sParam = searchParams.get("s")
  const fromParam = searchParams.get("from")
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="flex items-center justify-center p-12 text-on-surface-variant">Cargando...</div>

  // Bloqueo estricto para el rol "viewer" (Lector)
  if (role === "viewer") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-error/50" />
        <h2 className="mb-2 text-xl font-bold text-on-surface">Acceso Denegado</h2>
        <p className="max-w-md text-sm text-on-surface-variant">
          Tu rol actual no tiene permisos para ver o gestionar solicitudes. Contacta a tu administrador.
        </p>
      </div>
    )
  }

  if (!mounted) return <div className="flex items-center justify-center p-12 text-on-surface-variant">Cargando...</div>

  // Miembros del equipo (SuperAdmin y Diseñadores) ven la vista de gestión
  const isTeam = isSuperAdmin || isCoequipero

  return isTeam ? <SuperAdminView initialId={sParam} fromPath={fromParam} /> : <ClientView initialId={sParam} fromPath={fromParam} />
}

// ═══════════════════════════════════════════
//  HOOK PARA CARGAR MIEMBROS DEL EQUIPO
// ═══════════════════════════════════════════
function useTeamMembers() {
  const [teamMembers, setTeamMembers] = useState<{ id: string, name: string, initials: string, role: string, color: string }[]>([])
  
  useEffect(() => {
    async function fetchTeam() {
      const supabase = createClient()
      const { data } = await supabase.from("profiles").select("id, full_name, email, job_title, role, company").in("role", ["superadmin", "coequipero"])
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
function SuperAdminView({ initialId, fromPath }: { initialId: string | null, fromPath: string | null }) {
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
          .select("*, profiles!client_id(full_name, company)")
          .order("created_at", { ascending: false })
          
        if (error) throw error
        if (data) {
          const statusMap: Record<string, TicketStatus> = {
            "Nueva": "backlog",
            "Asignada": "todo",
            "Acordada y aprobada": "in_progress",
            "En progreso": "waiting_client",
            "Esperando cliente": "waiting_client", // Por compatibilidad con registros viejos
            "En revisión": "review",
            "Resuelta": "done",
            "Eliminada": "deleted"
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
        // Limpiar los parámetros de la URL para evitar que se abra al refrescar
        router.replace('/solicitudes', { scroll: false })
      }
    }
  }, [initialId, tickets, router])

  const handleCloseDetail = () => {
    setSelectedSolicitud(null)
    if (fromPath === "notificaciones") {
      router.push("/notificaciones")
    }
  }

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
      "todo": "Asignada",
      "in_progress": "Acordada y aprobada",
      "waiting_client": "En progreso",
      "review": "En revisión",
      "done": "Resuelta",
      "deleted": "Eliminada"
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
    // Update local state and auto-move to 'todo' (Asignada) if assigned
    setTickets(prev => prev.map(t => t.id === ticketId ? { 
      ...t, 
      assigned_to: assigneeName || undefined,
      assigned_to_id: assigneeId || undefined,
      status: assigneeId ? "todo" : t.status
    } : t))
    
    // Update DB
    try {
      const supabase = createClient()
      const updateData: any = { 
        assigned_to_id: assigneeId || null,
        assigned_to: assigneeName || null,
        updated_at: new Date().toISOString()
      }
      
      // Auto-move to "Asignada" if assigned
      if (assigneeId) {
        updateData.estado = "Asignada"
      }
      
      const { error } = await supabase.from("solicitudes").update(updateData).eq("id", parseInt(ticketId, 10))
      
      if (error) {
        console.error("Error updating assignment:", error)
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const handleRestoreTicket = async (ticketId: string) => {
    if (!window.confirm("¿Seguro que deseas restaurar esta solicitud? Volverá al estado 'Nueva' para todos.")) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from("solicitudes").update({ estado: "Nueva" }).eq("id", parseInt(ticketId, 10))
      if (error) throw error
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "todo" } : t))
    } catch (err: any) {
      console.error(err)
      alert("Error al restaurar: " + err.message)
    }
  }

  const handleHardDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("¿ADVERTENCIA: Esta acción eliminará la solicitud permanentemente de la base de datos para todos. ¿Continuar?")) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from("solicitudes").delete().eq("id", parseInt(ticketId, 10))
      if (error) throw error
      setTickets(prev => prev.filter(t => t.id !== ticketId))
    } catch (err: any) {
      console.error(err)
      alert("Error al eliminar definitivamente: " + err.message)
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
            onRestoreTicket={handleRestoreTicket}
            onHardDeleteTicket={handleHardDeleteTicket}
          />
        )}
      </AnimatePresence>

      {/* SlideOver de Comentarios */}
      {selectedSolicitud && (
        <SolicitudDetalle 
          isOpen={!!selectedSolicitud} 
          onClose={handleCloseDetail} 
          solicitudId={selectedSolicitud.id} 
          solicitudTitulo={selectedSolicitud.titulo} 
          solicitudDescripcion={selectedSolicitud.descripcion} 
          viewMode="team"
          onStatusChange={async (estado_entrega, fecha_equipo) => {
            const isConfirmed = estado_entrega === "confirmada"
            setTickets(prev => prev.map(t => t.id === selectedSolicitud.id ? { 
              ...t, 
              estado_entrega: estado_entrega as any, 
              fecha_equipo: fecha_equipo || t.fecha_equipo,
              due_date: (isConfirmed && fecha_equipo) ? fecha_equipo : t.due_date,
              status: isConfirmed ? "in_progress" : t.status
            } : t))

            // Actualizar DB si pasa a Acordada y aprobada
            if (isConfirmed) {
              const supabase = createClient()
              await supabase.from("solicitudes").update({
                estado: "Acordada y aprobada"
              }).eq("id", parseInt(selectedSolicitud.id, 10))
            }
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
    { id: "backlog", label: "Sin asignar", color: "bg-slate-500" },
    { id: "todo", label: "Asignada", color: "bg-blue-500" },
    { id: "in_progress", label: "Acordada y Aprobada", color: "bg-amber-500" },
    { id: "waiting_client", label: "En progreso", color: "bg-orange-400" },
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
  downloadingId,
  onRestoreTicket,
  onHardDeleteTicket
}: { 
  tickets: Ticket[], 
  teamMembers: any[], 
  onAssignTicket: (ticketId: string, assigneeId: string, assigneeName: string) => void,
  onSelectTicket: (t: Ticket) => void,
  onDownload: (t: Ticket) => void,
  downloadingId: string | null,
  onRestoreTicket?: (id: string) => void,
  onHardDeleteTicket?: (id: string) => void
}) {
  const statusLabels: Record<string, string> = { backlog: "Sin asignar", todo: "Asignada", in_progress: "Acordada y Aprobada", waiting_client: "En progreso", review: "Revisión", done: "Completado", deleted: "Eliminada" }
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="overflow-x-auto min-h-[350px]">
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
              <tr key={t.id} onClick={() => onSelectTicket(t)} className={cn("group transition-colors cursor-pointer", t.status === 'deleted' ? "bg-surface-container-highest/30 opacity-60 grayscale hover:opacity-100 hover:grayscale-0" : "hover:bg-surface-container-low/50")}>
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
                    <span>{t.due_date ? formatDateSafe(t.due_date) : "No especificada"}</span>
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
                  {t.status === 'deleted' ? (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => onRestoreTicket?.(t.id)} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-emerald-500 transition-colors" title="Restaurar solicitud">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button onClick={() => onHardDeleteTicket?.(t.id)} className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-rose-500 transition-colors" title="Eliminar definitivamente">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <ChevronRight className="ml-auto h-4 w-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                  )}
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
function ClientView({ initialId, fromPath }: { initialId: string | null, fromPath: string | null }) {
  const teamMembers = useTeamMembers()
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const { role, user } = usePermissions()
  const canCreate = role === "admin" || role === "designer"
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [selectedSolicitud, setSelectedSolicitud] = useState<{id: string, titulo: string, descripcion: string} | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"mias" | "colaboradores">("mias")

  const handleDelete = async (s: Solicitud, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la solicitud "${s.titulo}"?`)) return
    
    try {
      const { softDeleteSolicitud } = await import("@/app/actions/solicitudes")
      const res = await softDeleteSolicitud(s.id, user!.id, s.assigned_to_id)
      
      if (res.error) throw new Error(res.error)
      
      setSolicitudes(prev => prev.filter(req => req.id !== s.id))
    } catch (err: any) {
      console.error(err)
      alert("Error al eliminar la solicitud: " + (err.message || "Error desconocido"))
    }
  }

  const handleEdit = (s: Solicitud, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingData({
      id: parseInt(s.id, 10),
      titulo: s.titulo,
      descripcion: s.descripcion,
      fecha_sugerida_entrega: s.fecha_sugerida_entrega !== "No especificada" ? new Date(s.fecha_sugerida_entrega).toISOString().split('T')[0] : undefined,
      tipo_solicitud: s.tipo_solicitud,
      adjuntos: s.adjuntos,
      assigned_to_id: s.assigned_to_id
    })
    setShowModal(true)
  }

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
        let queryData: any[] = []
        let queryError: any = null

        // Utilizamos el 'user' del hook usePermissions que ya contiene .company
        if (user && role === "admin" && user.company) {
          // El admin puede ver las suyas y las de cualquier perfil de su empresa
          // Usamos el server action para evadir RLS
          const result = await getCompanySolicitudes(user.company)
          if (result.error) {
            queryError = { message: result.error }
          } else {
            queryData = result.data || []
          }
        } else if (user) {
          // Diseñador y Visualizador solo ven las suyas (o si el admin falla al no tener empresa)
          const query = supabase.from("solicitudes").select("*, profiles!client_id(full_name, company)").eq("client_id", user.id).order("created_at", { ascending: false })
          const { data, error } = await query
          if (error) queryError = error
          else queryData = data || []
        }

        if (queryError) {
          console.error("SUPABASE ERROR:", queryError)
          alert("Error Supabase: " + queryError.message)
          throw queryError
        }

        if (queryData) {
          const mapped: Solicitud[] = queryData
            .filter(d => d.estado !== "Eliminada")
            .map(d => ({
              id: String(d.id).padStart(5, "0"),
              titulo: d.titulo || "",
              descripcion: d.descripcion || "",
              fecha_solicitud: d.created_at ? new Date(d.created_at).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "",
              fecha_sugerida_entrega: formatDateSafe(d.fecha_sugerida_entrega),
              adjuntos: d.adjuntos || [],
              tipo_solicitud: d.tipo_solicitud as TipoSolicitud,
              estado: d.estado as SolicitudEstado,
              assigned_to: d.assigned_to || undefined,
              assigned_to_id: d.assigned_to_id || undefined,
              estado_entrega: d.estado_entrega || 'pendiente',
              fecha_equipo: d.fecha_equipo || undefined,
              client_id: d.client_id,
              client_name: d.profiles?.full_name || "Desconocido"
            }))
          setSolicitudes(mapped)
        }
      } catch (err: any) {
        console.error("Error fetching solicitudes:", err)
        alert("Catch Error: " + (err.message || JSON.stringify(err)))
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

  const clientEstadoLabel: Record<string, string> = {
    "Nueva": "Sin asignar",
    "Sin asignar": "Sin asignar",
    "Asignada": "Asignada",
    "Acordada y aprobada": "Acordada y aprobada",
    "En progreso": "En progreso",
    "Esperando cliente": "En progreso",
    "En revisión": "Revisión",
    "Resuelta": "Completado",
    "Eliminada": "Eliminada"
  }

  const estadoColors: Record<string, { dot: string; text: string }> = {
    "Nueva": { dot: "bg-slate-500", text: "text-slate-400" },
    "Sin asignar": { dot: "bg-slate-500", text: "text-slate-400" },
    "Asignada": { dot: "bg-blue-500", text: "text-blue-400" },
    "Acordada y aprobada": { dot: "bg-amber-500", text: "text-amber-400" },
    "En progreso": { dot: "bg-orange-400", text: "text-orange-400" },
    "Esperando cliente": { dot: "bg-orange-400", text: "text-orange-400" },
    "En revisión": { dot: "bg-purple-500", text: "text-purple-400" },
    "Resuelta": { dot: "bg-emerald-500", text: "text-emerald-400" },
    "Eliminada": { dot: "bg-slate-500", text: "text-slate-400" }
  }

  const misSolicitudes = solicitudes.filter(s => s.client_id === user?.id)
  const solicitudesColaboradores = solicitudes.filter(s => s.client_id !== user?.id)
  const solicitudesToDisplay = activeTab === "mias" ? misSolicitudes : solicitudesColaboradores

  const filteredSolicitudes = solicitudesToDisplay.filter(s =>
    s.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery)
  )

  // Stats
  const total = solicitudesToDisplay.length
  const nuevas = solicitudesToDisplay.filter(s => (s.estado as string) === "Nueva" || (s.estado as string) === "Sin asignar" || (s.estado as string) === "backlog").length
  const enCurso = solicitudesToDisplay.filter(s => (s.estado as string) === "Asignada" || (s.estado as string) === "Acordada y aprobada" || (s.estado as string) === "En progreso" || (s.estado as string) === "Esperando cliente" || (s.estado as string) === "En revisión").length
  const resueltas = solicitudesToDisplay.filter(s => (s.estado as string) === "Resuelta" || (s.estado as string) === "Completado").length

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

      {/* Tabs para Admin */}
      {role === "admin" && (
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
          <button 
            onClick={() => setActiveTab("mias")}
            className={cn("px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg flex items-center gap-2", activeTab === "mias" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container")}
          >
            Mis Solicitudes
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", activeTab === "mias" ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant")}>
              {misSolicitudes.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("colaboradores")}
            className={cn("px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg flex items-center gap-2", activeTab === "colaboradores" ? "border-b-2 border-primary text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container")}
          >
            Solicitudes de Colaboradores
            <span className={cn("rounded-full px-2 py-0.5 text-[10px]", activeTab === "colaboradores" ? "bg-primary/20 text-primary" : "bg-surface-container-high text-on-surface-variant")}>
              {solicitudesColaboradores.length}
            </span>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total solicitudes", value: total, icon: "📋" },
          { label: "Sin asignar", value: nuevas, color: "text-slate-400", dot: "bg-slate-500" },
          { label: "En curso", value: enCurso, color: "text-amber-400", dot: "bg-amber-500" },
          { label: "Completadas", value: resueltas, color: "text-emerald-400", dot: "bg-emerald-500" },
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
                {activeTab === "colaboradores" && <th className="px-5 py-4">Autor</th>}
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
                  <td colSpan={activeTab === "colaboradores" ? 11 : 10} className="px-5 py-8 text-center text-on-surface-variant">
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
                  {activeTab === "colaboradores" && (
                    <td className="px-5 py-4 text-xs text-on-surface font-medium whitespace-nowrap">
                      {s.client_name}
                    </td>
                  )}
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
                              {assignee.name} {(assignee as any).company ? `(${(assignee as any).company})` : ""}
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
                      <div className={cn("h-2 w-2 rounded-full", estadoColors[s.estado]?.dot || "bg-slate-500")} />
                      <span className={cn("text-xs font-semibold", estadoColors[s.estado]?.text || "text-slate-400")}>{clientEstadoLabel[s.estado] || s.estado}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canCreate && (
                        <>
                          <button 
                            onClick={(e) => handleEdit(s, e)}
                            className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                            title="Editar solicitud"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(s, e)}
                            className="p-1.5 text-on-surface-variant hover:text-red-500 transition-colors rounded-md hover:bg-red-500/10"
                            title="Eliminar solicitud"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="ml-2 h-4 w-4 text-on-surface-variant transition-transform group-hover:translate-x-1" />
                    </div>
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
          viewMode="client"
          onStatusChange={(estado_entrega, fecha_equipo, estado_general) => {
            setSolicitudes(prev => prev.map(s => s.id === selectedSolicitud.id ? { 
              ...s, 
              estado_entrega: estado_entrega as any, 
              fecha_equipo: fecha_equipo || s.fecha_equipo,
              fecha_sugerida_entrega: (estado_entrega === "confirmada" && fecha_equipo) 
                ? formatDateSafe(fecha_equipo) 
                : s.fecha_sugerida_entrega,
              estado: estado_general ? (estado_general as any) : s.estado
            } : s))
          }}
        />
      )}

      {/* Modal Nueva Solicitud */}
      <NuevaSolicitudModal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false)
          setTimeout(() => setEditingData(null), 300)
        }} 
        nextId={editingData ? String(editingData.id).padStart(5, "0") : String(solicitudes.length > 0 ? Math.max(...solicitudes.map(s => parseInt(s.id, 10))) + 1 : 1).padStart(5, "0")}
        isEditing={!!editingData}
        initialData={editingData}
      />
    </div>
  )
}

