"use client"

import React, { useState, useEffect } from "react"
import { Users, Plus, Mail, MoreHorizontal, Loader2 } from "lucide-react"
import { InvitarMiembroModal } from "@/components/equipo/invitar-miembro-modal"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  job_title: string
}

import { usePermissions } from "@/hooks/use-permissions"
import { ChevronDown, ChevronRight, Building2, Trash2 } from "lucide-react"
import { eliminarMiembro, eliminarEmpresa } from "@/app/actions/equipo"
import { ConfirmDeleteModal } from "@/components/equipo/confirm-delete-modal"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  job_title: string
  company?: string
}

export default function EquipoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"equipo" | "cliente">("equipo")
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({})

  // Modal de eliminación
  const [deleteTarget, setDeleteTarget] = useState<{ type: "member" | "company", id: string, name: string } | null>(null)
  
  const { isSuperAdmin, isCoequipero, isAdmin } = usePermissions()
  const isInternalTeam = isSuperAdmin || isCoequipero
  const canManage = isSuperAdmin || isCoequipero || isAdmin
  const canDelete = isSuperAdmin

  const fetchTeam = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
    if (!error && data) {
      setTeamMembers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTeam()
  }, [isModalOpen])

  const openModal = (type: "equipo" | "cliente") => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [company]: !prev[company]
    }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    
    if (deleteTarget.type === "member") {
      const result = await eliminarMiembro(deleteTarget.id)
      if (result.error) throw new Error(result.error)
    } else {
      const result = await eliminarEmpresa(deleteTarget.name)
      if (result.error) throw new Error(result.error)
    }
    
    await fetchTeam() // Refrescar lista
  }

  const internalTeam = teamMembers.filter(m => m.role === "superadmin" || m.role === "coequipero")
  const clientTeam = teamMembers.filter(m => m.role === "admin" || m.role === "designer" || m.role === "viewer")

  // Group clients by company
  const groupedClients = clientTeam.reduce((acc, member) => {
    const comp = member.company || "MultiMuebles"
    if (!acc[comp]) acc[comp] = []
    acc[comp].push(member)
    return acc
  }, {} as Record<string, Profile[]>)

  const sortedCompanies = Object.keys(groupedClients).sort()

  const renderMemberRow = (member: Profile, isNested: boolean = false, isLast: boolean = false) => (
    <div key={member.id} className="relative flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-container-high/50 group">
      {isNested && (
        <div className="absolute left-0 top-0 h-full w-12 pointer-events-none">
          {/* Vertical line from top to middle */}
          <div className="absolute left-[38px] top-0 h-1/2 border-l-2 border-outline-variant/30" />
          {/* Horizontal line */}
          <div className="absolute left-[38px] top-1/2 w-6 border-t-2 border-outline-variant/30" />
          {/* Vertical line from middle to bottom if not last */}
          {!isLast && (
            <div className="absolute left-[38px] top-1/2 h-1/2 border-l-2 border-outline-variant/30" />
          )}
        </div>
      )}
      <div className={`flex items-center gap-4 ${isNested ? "ml-12" : ""}`}>
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {member.full_name?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-container bg-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-on-surface">{member.full_name}</p>
          <p className="text-xs text-on-surface-variant capitalize">{member.job_title || member.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-on-surface-variant">{member.email}</span>
        {canDelete && (
          <button 
            onClick={() => setDeleteTarget({ type: "member", id: member.id, name: member.full_name })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high opacity-0 transition-opacity group-hover:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderInternalSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Equipo</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Administra los miembros de tu equipo y sus permisos.</p>
        </div>
        <button 
          onClick={() => openModal("equipo")} 
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Invitar colaborador
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Miembros", value: loading ? "-" : internalTeam.length.toString() },
          { label: "Activos", value: loading ? "-" : internalTeam.length.toString() },
          { label: "Roles Admin", value: loading ? "-" : internalTeam.filter(m => m.role === "superadmin").length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-surface-container p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-container">
        <div className="border-b border-outline-variant/20 px-5 py-3">
          <h3 className="text-sm font-semibold text-on-surface">Miembros del equipo</h3>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {loading ? (
            <div className="flex justify-center p-8 text-on-surface-variant"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : internalTeam.length === 0 ? (
            <div className="flex justify-center p-8 text-on-surface-variant">No hay miembros registrados aún.</div>
          ) : internalTeam.map((member) => renderMemberRow(member))}
        </div>
      </div>
    </div>
  )

  const renderClientSection = () => {
    const isClientView = !isInternalTeam
    const title = isClientView ? "Equipo" : "Clientes"
    const desc = isClientView ? "Administra los miembros de tu equipo y sus permisos." : "Administra tus clientes, sus colaboradores y permisos."
    const buttonText = isClientView ? "Invitar colaborador" : "Invitar cliente"
    const showButton = isInternalTeam || isAdmin

    const totalCompanies = Object.keys(groupedClients).length
    const totalMembers = clientTeam.length
    
    // As requested:
    // Total Clientes -> Number of companies
    // Total Miembros -> Number of active users
    // Activos -> Number of active users
    const stats = [
      { label: "Total Clientes", value: loading ? "-" : totalCompanies.toString() },
      { label: "Total Miembros", value: loading ? "-" : totalMembers.toString() },
      { label: "Activos", value: loading ? "-" : totalMembers.toString() },
    ]

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">{title}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{desc}</p>
          </div>
          {showButton && (
            <button 
              onClick={() => openModal("cliente")} 
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {buttonText}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface-container p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-on-surface">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface-container overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-8 text-on-surface-variant"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : sortedCompanies.length === 0 ? (
            <div className="flex justify-center p-8 text-on-surface-variant">No hay {isInternalTeam ? "clientes" : "colaboradores"} registrados aún.</div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {sortedCompanies.map((company) => {
                const isExpanded = expandedCompanies[company]
                const members = groupedClients[company]
                return (
                  <div key={company} className="flex flex-col">
                    <button
                      onClick={() => toggleCompany(company)}
                      className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-container-high text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                      <Building2 className="h-5 w-5 text-on-surface-variant" />
                      <span className="font-semibold text-on-surface">{company}</span>
                      <span className="ml-auto rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                        {members.length} miembros
                      </span>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget({ type: "company", id: company, name: company })
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="flex flex-col border-t border-outline-variant/20 bg-surface-container-low/50">
                        <div className="px-5 py-2">
                          <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-12">Miembros de la empresa</h4>
                        </div>
                        {members.map((member, idx) => renderMemberRow(member, true, idx === members.length - 1))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 p-6 h-full pb-12">
      {isInternalTeam && renderInternalSection()}
      {renderClientSection()}

      <InvitarMiembroModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === "company" ? "Eliminar Empresa" : "Eliminar Miembro"}
        description={deleteTarget?.type === "company" 
          ? `¿Estás seguro de que deseas eliminar la empresa "${deleteTarget.name}"? Esta acción borrará permanentemente a TODOS los miembros de esta empresa y no se puede deshacer.`
          : `¿Estás seguro de que deseas eliminar a "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
