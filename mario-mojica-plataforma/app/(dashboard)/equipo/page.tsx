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

export default function EquipoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeam() {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true })
      if (!error && data) {
        setTeamMembers(data)
      }
      setLoading(false)
    }
    fetchTeam()
  }, [isModalOpen]) // Refetch after modal closes to see new members

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Equipo</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Administra los miembros de tu equipo y sus permisos.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          Invitar Miembro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Miembros", value: loading ? "-" : teamMembers.length.toString() },
          { label: "Activos", value: loading ? "-" : teamMembers.length.toString() },
          { label: "Roles Admin", value: loading ? "-" : teamMembers.filter(m => m.role === "superadmin").length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-surface-container p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-on-surface">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Member list */}
      <div className="rounded-xl bg-surface-container">
        <div className="border-b border-outline-variant/20 px-5 py-3">
          <h2 className="text-sm font-semibold text-on-surface">Miembros del equipo</h2>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {loading ? (
            <div className="flex justify-center p-8 text-on-surface-variant">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="flex justify-center p-8 text-on-surface-variant">
              No hay miembros registrados aún.
            </div>
          ) : teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-container-high/50">
              <div className="flex items-center gap-4">
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
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <InvitarMiembroModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
