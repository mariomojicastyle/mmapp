 
 
/* eslint-disable @next/next/no-img-element */
 
"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Search, MessageSquare, HelpCircle, User as UserIcon, Settings, FileText, Check, X, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { sendPlatformFeedback } from "@/app/actions/feedback"
import { cn } from "@/lib/utils"

export function TopNav() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Feedback states
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackCategory, setFeedbackCategory] = useState("sugerencia")
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFeedbackOpen(false)
        setFeedbackError(null)
        setFeedbackSuccess(false)
      }
    }
    if (isFeedbackOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFeedbackOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !feedbackText.trim()) return

    setIsSendingFeedback(true)
    setFeedbackError(null)

    const result = await sendPlatformFeedback(user.id, feedbackText, feedbackCategory)
    
    if (result.error) {
      setFeedbackError(result.error)
    } else {
      setFeedbackSuccess(true)
      setFeedbackText("")
      setTimeout(() => {
        setIsFeedbackOpen(false)
        setFeedbackSuccess(false)
      }, 2000)
    }
    setIsSendingFeedback(false)
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 backdrop-blur-xl">
      {/* ⬅️ Franja Izquierda */}
      <div className="flex h-full items-center gap-4">
        {/* 1. Logosimbolo Aligned with Sidebar Icons */}
        <div className="flex h-full w-[52px] items-center justify-center border-r border-outline-variant/30 shrink-0">
          <img src="/Logosimbolo.svg" alt="Logo" className="h-[18px] w-[18px]" />
        </div>

        {/* Breadcrumbs Path */}
        <div className="flex items-center gap-3 text-on-surface-variant px-2">
          <span className="text-sm font-semibold text-on-surface">Mario Mojica</span>
          
          <span className="text-outline-variant">/</span>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">
              {pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="mx-2 h-4 w-px bg-outline-variant/50"></div>

        {/* 2. Nombre del usuario */}
        <div className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors cursor-default">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest">
            <UserIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">
            {user?.name || "Cargando..."}
          </span>
        </div>

        {/* 3. Créditos */}
        <div className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Créditos</span>
          <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-[11px] font-black text-primary-foreground shadow-sm shadow-primary/30">
            {(user?.credits ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ➡️ Franja Derecha */}
      <div className="flex items-center gap-4 pr-[17px]">
        {/* 5. Feedback */}
        <button 
          onClick={() => setIsFeedbackOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
        >
          <MessageSquare className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Feedback</span>
        </button>

        {/* Separador vertical */}
        <div className="h-4 w-px bg-outline-variant/30"></div>

        {/* 6. Búsqueda */}
        <div className="relative hidden items-center lg:flex">
          <Search className="absolute left-3 h-3.5 w-3.5 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="h-9 w-48 rounded-xl border border-outline-variant/30 bg-surface-container-lowest pl-9 pr-12 text-sm text-on-surface focus:w-64 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <div className="absolute right-2 flex items-center rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] font-bold text-on-surface-variant">
            ⌘ K
          </div>
        </div>

        {/* 7. Ayuda */}
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/30 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" title="Centro de Ayuda">
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* 8. Cargar Créditos */}
        <button className="hidden h-9 items-center justify-center rounded-full bg-surface-container-highest px-4 text-xs font-bold text-on-surface transition-all hover:bg-primary hover:text-primary-foreground md:flex">
          Cargar Créditos
        </button>

        {/* 9. Perfil / Menú de Usuario */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 text-xs font-black text-primary transition-all hover:ring-2 hover:ring-primary/50 overflow-hidden"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name || "Usuario"} className="h-full w-full object-cover" />
            ) : (
              user?.name ? user.name.substring(0, 2).toUpperCase() : "MM"
            )}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-outline-variant bg-surface-container-low shadow-xl shadow-black/10 py-1.5 backdrop-blur-md">
              
              {/* User Info */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-on-surface truncate">{user?.name || 'Mario Mojica'}</p>
                <p className="text-xs text-on-surface-variant truncate">{user?.email || 'mariomojica.style@gmail.com'}</p>
              </div>

              <div className="h-px w-full bg-outline-variant/50 my-1" />

              {/* Preferences */}
              <div className="px-1.5 py-1 space-y-0.5">
                <Link 
                  href="/configuracion" 
                  onClick={() => setIsUserMenuOpen(false)} 
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4 text-on-surface-variant" />
                  Configuración
                </Link>
                <Link 
                  href="#" 
                  onClick={() => setIsUserMenuOpen(false)} 
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4 text-on-surface-variant" />
                  Changelog
                </Link>
              </div>

              <div className="h-px w-full bg-outline-variant/50 my-1" />

              {/* Theme Selection */}
              <div className="px-1.5 py-1">
                <p className="px-2.5 py-1 text-xs font-semibold text-on-surface-variant">Theme</p>
                <div className="space-y-0.5 mt-1">
                  <button 
                    onClick={() => {
                      setTheme('dark')
                      setIsUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors"
                  >
                    <div className="flex h-4 w-4 items-center justify-center">
                      {theme === 'dark' && <Check className="h-3.5 w-3.5" />}
                    </div>
                    Dark
                  </button>
                  <button 
                    onClick={() => {
                      setTheme('light')
                      setIsUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-highest rounded-lg transition-colors"
                  >
                    <div className="flex h-4 w-4 items-center justify-center">
                      {theme === 'light' && <Check className="h-3.5 w-3.5" />}
                    </div>
                    Light
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-outline-variant/50 my-1" />

              {/* Logout */}
              <div className="px-1.5 py-1">
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center px-2.5 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFeedbackOpen(false)
                setFeedbackError(null)
                setFeedbackSuccess(false)
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsFeedbackOpen(false)
                  setFeedbackError(null)
                  setFeedbackSuccess(false)
                }}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Enviar Feedback
              </h3>
              <p className="text-xs text-on-surface-variant mb-4">
                Tu opinión nos ayuda a mejorar. El equipo de Mario Mojica recibirá tu comentario al instante.
              </p>

              {feedbackSuccess ? (
                <div className="py-8 text-center space-y-2 animate-pulse">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-on-surface">¡Gracias por tu feedback!</p>
                  <p className="text-xs text-on-surface-variant">Se ha enviado la notificación al equipo.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {feedbackError && (
                    <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-xs font-semibold text-error flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {feedbackError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Categoría
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["sugerencia", "error", "idea"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFeedbackCategory(cat)}
                          className={cn(
                            "py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-all",
                            feedbackCategory === cat
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-surface-container-high border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Comentario
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Escribe aquí tu sugerencia, reporte de error o idea de mejora..."
                      className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFeedbackOpen(false)
                        setFeedbackError(null)
                        setFeedbackSuccess(false)
                      }}
                      className="flex-1 py-3 px-4 rounded-full border border-outline-variant/30 text-sm font-semibold text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingFeedback || !feedbackText.trim()}
                      className="flex-1 flex items-center justify-center rounded-full bg-primary py-3 px-4 font-semibold text-primary-foreground transition-all hover:bg-primary/95 active:scale-[0.98] disabled:opacity-50 text-sm"
                    >
                      {isSendingFeedback ? "Enviando..." : "Enviar Feedback"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}


