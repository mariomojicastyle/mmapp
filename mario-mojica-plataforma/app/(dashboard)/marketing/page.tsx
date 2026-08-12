"use client"

import React, { useState, useEffect } from "react"
import { Calendar as CalendarIcon, Plus, Loader2, Share2, AlertCircle, CheckCircle2, RefreshCw, Link2, HardDrive, Edit3, KeyRound, Trash2 } from "lucide-react"
import Link from "next/link"
import { getMarketingPosts, getMarketingCuentas, deleteMarketingPost } from "@/app/actions/marketing"
import { EditorPostModal } from "@/components/marketing/editor-post-modal"
import { ConfigTokensModal } from "@/components/marketing/config-tokens-modal"
import { CalendarioSemanal, MarketingPost } from "@/components/marketing/calendario-semanal"

interface MarketingCuenta {
  id: string
  plataforma: string
  nombre_cuenta: string
  avatar_url: string | null
  expires_at: string | null
}

import { useSearchParams } from "next/navigation"

export default function MarketingPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const providerParam = searchParams.get("provider")

  const [posts, setPosts] = useState<MarketingPost[]>([])
  const [cuentas, setCuentas] = useState<MarketingCuenta[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isConfigTokensOpen, setIsConfigTokensOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [postsRes, cuentasRes] = await Promise.all([
      getMarketingPosts(),
      getMarketingCuentas(),
    ])

    if (postsRes.data) setPosts(postsRes.data as any)
    if (cuentasRes.data) setCuentas(cuentasRes.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenNewEditor = () => {
    setEditingPost(null)
    setIsEditorOpen(true)
  }

  const handleOpenEditEditor = (post: MarketingPost) => {
    setEditingPost(post)
    setIsEditorOpen(true)
  }

  const handleDeletePost = async (id: string) => {
    const res = await deleteMarketingPost(id)
    if (res.success) {
      setPosts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleSelectSlot = (date: Date) => {
    setEditingPost({
      id: "",
      titulo: "",
      contenido_base: "",
      plataformas_destino: ["instagram", "facebook"],
      estado: "programado",
      fecha_programada: date.toISOString(),
    })
    setIsEditorOpen(true)
  }

  const borradores = posts.filter((p) => p.estado === "borrador")
  const programados = posts.filter((p) => p.estado === "programado" || p.estado === "en_cola")
  const publicados = posts.filter((p) => p.estado === "publicado")
  const plataformasConectadas = new Set(cuentas.map((c) => c.plataforma))

  return (
    <div className="space-y-6">
      {/* Alerta de Credenciales Faltantes en .env.local */}
      {errorParam === "missing_credentials" && (
        <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4 flex items-start gap-3 text-xs text-on-surface">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning text-sm">Configuración Pendiente de Credenciales OAuth ({providerParam || "Red Social"})</p>
            <p className="mt-1">
              Faltan las llaves de acceso en tu archivo <code className="bg-surface-container px-1.5 py-0.5 rounded text-primary">.env.local</code>.
              Revisa las instrucciones en <code className="bg-surface-container px-1.5 py-0.5 rounded">Plan_Marketing.md</code> para pegar tus credenciales de desarrollador.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Inicio de Conexión de Cuentas */}
      {cuentas.length === 0 && !loading && (
        <div className="rounded-2xl bg-primary/10 border border-primary/30 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary shrink-0">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">Paso 1: Vincular tus Cuentas de Redes Sociales</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Para empezar a publicar, conecta tus perfiles oficiales de LinkedIn, Meta (Facebook/Instagram) o Google Drive.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/api/auth/linkedin"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow"
            >
              <Share2 className="h-3.5 w-3.5" />
              Conectar LinkedIn
            </Link>

            <Link
              href="/api/auth/google"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <HardDrive className="h-3.5 w-3.5 text-primary" />
              Conectar Google Drive / YT
            </Link>

            <Link
              href="/api/auth/facebook"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" />
              Conectar Meta (FB/IG)
            </Link>
          </div>
        </div>
      )}

      {/* Botón de Acción Principal & Filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Planificación de Contenidos</h2>
          <p className="text-xs text-on-surface-variant">
            Gestiona borradores, programa publicaciones multicanal y sincroniza con Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsConfigTokensOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-surface-container-high border border-outline-variant/30 px-3.5 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <KeyRound className="h-4 w-4 text-primary" />
            Configurar Tokens API
          </button>
          <button
            onClick={handleOpenNewEditor}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Crear Publicación
          </button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Cuentas Conectadas", value: loading ? "-" : cuentas.length.toString(), icon: Share2 },
          { label: "Borradores", value: loading ? "-" : borradores.length.toString(), icon: CalendarIcon },
          { label: "Programados / En Cola", value: loading ? "-" : programados.length.toString(), icon: RefreshCw },
          { label: "Publicados Este Mes", value: loading ? "-" : publicados.length.toString(), icon: CheckCircle2 },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl bg-surface-container p-5 border border-outline-variant/15 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-on-surface">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Calendario Semanal Interactivo Dinámico */}
      <CalendarioSemanal
        posts={posts}
        onSelectSlot={handleSelectSlot}
        onSelectPost={handleOpenEditEditor}
      />

      {/* Grid de Estado: Cuentas Conectadas y Publicaciones Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2 Cols): Publicaciones Programadas / Recientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-surface-container p-5 border border-outline-variant/15">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Próximas Publicaciones</h3>
              <span className="text-xs font-medium text-on-surface-variant">
                {programados.length} programadas
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center p-8 text-on-surface-variant">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
                <CalendarIcon className="h-10 w-10 mb-2 opacity-40 text-primary" />
                <p className="text-sm font-medium">No hay publicaciones registradas aún.</p>
                <p className="text-xs mt-1">
                  Haz clic en &quot;Crear Publicación&quot; para redactar tu primer post multicanal.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto pr-1 divide-y divide-outline-variant/20 custom-scrollbar">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleOpenEditEditor(post)}
                    className="py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-surface-container-high/40 p-2.5 rounded-xl transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                          {post.estado}
                        </span>
                        {post.titulo && (
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {post.titulo}
                            <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {post.contenido_base}
                      </p>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] font-semibold text-primary block">
                        {post.fecha_programada
                          ? (() => {
                              const d = new Date(post.fecha_programada)
                              const brDate = new Date(d.getTime() - 3 * 3600 * 1000)
                              const colDate = new Date(d.getTime() - 5 * 3600 * 1000)
                              const pad = (n: number) => n.toString().padStart(2, "0")
                              const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
                              const dateStr = `${brDate.getUTCDate()} ${months[brDate.getUTCMonth()]}`
                              const brTime = `${pad(brDate.getUTCHours())}:${pad(brDate.getUTCMinutes())} BR`
                              const colTime = `${pad(colDate.getUTCHours())}:${pad(colDate.getUTCMinutes())} Col`
                              return `${dateStr}, ${brTime} (${colTime})`
                            })()
                          : "Sin fecha"}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          Editar ✏️
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`¿Eliminar la publicación "${post.titulo || "Sin título"}"?`)) {
                              handleDeletePost(post.id)
                            }
                          }}
                          className="p-1 rounded text-error hover:bg-error/10 transition-colors"
                          title="Eliminar publicación"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (1 Col): Estado de Conexiones de Redes */}
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-container p-5 border border-outline-variant/15">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-on-surface">Estado de Canales</h3>
              <span className="text-xs font-medium text-on-surface-variant">OAuth 2.0</span>
            </div>

            {loading ? (
              <div className="flex justify-center p-6 text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Botones de Conexión Directa */}
                <div className="space-y-2">
                  <Link
                    href="/api/auth/linkedin"
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      plataformasConectadas.has("linkedin")
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-surface-container-high border-outline-variant/20 text-on-surface hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="h-4 w-4 text-primary" />
                      <span>LinkedIn</span>
                    </div>
                    {plataformasConectadas.has("linkedin") ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-[11px] text-primary font-semibold">+ Conectar</span>
                    )}
                  </Link>

                  <Link
                    href="/api/auth/google"
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      plataformasConectadas.has("google_drive") || plataformasConectadas.has("youtube")
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-surface-container-high border-outline-variant/20 text-on-surface hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="h-4 w-4 text-primary" />
                      <span>Google Drive & YouTube</span>
                    </div>
                    {plataformasConectadas.has("google_drive") || plataformasConectadas.has("youtube") ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-[11px] text-primary font-semibold">+ Conectar</span>
                    )}
                  </Link>

                  <Link
                    href="/api/auth/facebook"
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      plataformasConectadas.has("facebook") || plataformasConectadas.has("instagram")
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-surface-container-high border-outline-variant/20 text-on-surface hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="h-4 w-4 text-primary" />
                      <span>Meta (Facebook & Instagram)</span>
                    </div>
                    {plataformasConectadas.has("facebook") || plataformasConectadas.has("instagram") ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-[11px] text-primary font-semibold">+ Conectar</span>
                    )}
                  </Link>
                </div>

                {cuentas.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-outline-variant/15">
                    <p className="text-[11px] font-semibold text-on-surface-variant">Cuentas vinculadas:</p>
                    {cuentas.map((cuenta) => (
                      <div
                        key={cuenta.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/10 text-xs"
                      >
                        <span className="font-medium text-on-surface">{cuenta.nombre_cuenta}</span>
                        <span className="text-[10px] text-primary capitalize font-semibold">{cuenta.plataforma}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Editor Multi-Canal con datos iniciales para edición/reprogramación */}
      <EditorPostModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingPost(null)
        }}
        onSuccess={() => fetchData()}
        onDelete={handleDeletePost}
        initialData={editingPost}
      />

      {/* Modal de Configuración Directa de Tokens API */}
      <ConfigTokensModal
        isOpen={isConfigTokensOpen}
        onClose={() => setIsConfigTokensOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  )
}
