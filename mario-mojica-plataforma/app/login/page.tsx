/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Info, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type AuthMode = "login" | "signup" | "forgot"

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [lang, setLang] = useState<"es" | "en">("en")
  
  // Form fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [cargo, setCargo] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Fetch real user count
  useEffect(() => {
    async function fetchUserCount() {
      try {
        const { count, error } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
        if (!error && count !== null) {
          setUserCount(count)
        }
      } catch (err) {
        console.error("Error fetching user count:", err)
      }
    }
    fetchUserCount()
  }, [supabase])

  useEffect(() => {
    const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || "en"
    if (browserLang.toLowerCase().startsWith("es")) {
      setLang("es")
    } else {
      setLang("en")
    }
  }, [])

  // UI Translation Dictionary
  const t = {
    es: {
      welcome: "Bienvenido de nuevo",
      signinSubtitle: "Inicia sesión en tu cuenta",
      getStarted: "Comienza ahora",
      signupSubtitle: "Crea una nueva cuenta",
      forgotTitle: "Recuperar contraseña",
      forgotSubtitle: "Ingresa tu email para recibir un enlace de recuperación",
      googleBtn: "Continuar con Google",
      or: "o",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      forgotLink: "¿Olvidaste tu contraseña?",
      signinBtn: "Iniciar sesión",
      signingIn: "Iniciando sesión...",
      signupBtn: "Registrarse",
      signingUp: "Registrando...",
      sendResetBtn: "Enviar enlace de recuperación",
      sendingReset: "Enviando...",
      noAccount: "¿No tienes una cuenta?",
      hasAccount: "¿Ya tienes una cuenta?",
      backToLogin: "Volver a iniciar sesión",
      nameLabel: "Nombre",
      lastNameLabel: "Apellido",
      companyLabel: "Empresa",
      roleLabel: "Cargo",
      privacy: "PRIVACIDAD",
      terms: "TÉRMINOS",
      copyright: "© 2026 MARIO MOJICA",
      testimonialQuote: "Para competir en el mercado actual, la automatización de la manufactura y la capacidad de asombrar al cliente online deben coexistir. Es así como la Industria 4.0 cobra sentido. Hoy, las empresas ya pueden contar con una plataforma robusta que seguirá escalando y llevando la transformación digital a cada etapa del negocio. Con nuestro manual de armado interactivo en 3D, entregamos una herramienta diseñada para reducir drásticamente las reclamaciones por armado defectuoso y consolidar la lealtad del cliente final.",
      testimonialAuthor: "Mario Mojica",
      testimonialTag: "#Industria4.0",
      kpiUptime: "DISPONIBILIDAD",
      kpiPerformance: "RENDIMIENTO",
      kpiUsers: "USUARIOS"
    },
    en: {
      welcome: "Welcome back",
      signinSubtitle: "Sign in to your account",
      getStarted: "Get started",
      signupSubtitle: "Create a new account",
      forgotTitle: "Recover password",
      forgotSubtitle: "Enter your email to receive a recovery link",
      googleBtn: "Continue with Google",
      or: "or",
      emailLabel: "Email address",
      passwordLabel: "Password",
      forgotLink: "Forgot password?",
      signinBtn: "Sign in",
      signingIn: "Signing in...",
      signupBtn: "Sign up",
      signingUp: "Signing up...",
      sendResetBtn: "Send recovery link",
      sendingReset: "Sending...",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      backToLogin: "Back to sign in",
      nameLabel: "First Name",
      lastNameLabel: "Last Name",
      companyLabel: "Company",
      roleLabel: "Job Title",
      privacy: "PRIVACY",
      terms: "TERMS",
      copyright: "© 2026 MARIO MOJICA",
      testimonialQuote: "To compete in today's market, manufacturing automation and the ability to amaze the customer online must coexist. This is how Industry 4.0 makes sense. Today, companies can already count on a robust platform that will continue to scale and bring digital transformation to every stage of the business. With our interactive 3D assembly manual, we deliver a tool designed to drastically reduce claims due to faulty assembly and consolidate end-customer loyalty.",
      testimonialAuthor: "Mario Mojica",
      testimonialTag: "#Industry4.0",
      kpiUptime: "UPTIME",
      kpiPerformance: "PERFORMANCE",
      kpiUsers: "USERS"
    }
  }[lang]

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } else {
      router.push("/proyectos")
    }
    setLoading(false)
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    // Sign up via Supabase with custom metadata to sync with profiles table
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${nombre} ${apellido}`.trim(),
          company: empresa,
          job_title: cargo,
          role: "admin" // default role for client admin
        }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(
        lang === "es" 
          ? "¡Registro exitoso! Por favor revisa tu correo para confirmar tu cuenta." 
          : "Signup successful! Please check your email to confirm your account."
      )
      // Reset signup fields
      setNombre("")
      setApellido("")
      setEmpresa("")
      setCargo("")
      setEmail("")
      setPassword("")
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(
        lang === "es"
          ? "Se ha enviado un correo para restablecer tu contraseña."
          : "An email has been sent to reset your password."
      )
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Auth Form */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 xl:px-24 relative min-h-screen py-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center lg:justify-start">
            <img src="/Logo_vertical_color_en.svg" alt="Mario Mojica" className="h-8" />
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="mb-2 text-[30px] font-bold tracking-tight text-slate-900">{t.welcome}</h1>
                <p className="mb-6 text-slate-500 font-medium text-sm">{t.signinSubtitle}</p>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white py-3 px-4 text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-semibold text-sm">{t.googleBtn}</span>
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-slate-400 font-medium">{t.or}</span>
                  </div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="email">
                      {t.emailLabel}
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none focus:ring-1 focus:ring-[#0088AA] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800" htmlFor="password">
                        {t.passwordLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                        className="text-xs font-semibold text-[#0088AA] hover:underline"
                      >
                        {t.forgotLink}
                      </button>
                    </div>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none focus:ring-1 focus:ring-[#0088AA] transition-all"
                    />
                  </div>

                  {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}
                  {success && <div className="rounded-lg bg-green-50 p-3 text-xs font-medium text-green-600">{success}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-full bg-[#0088AA] py-3 px-4 font-semibold text-white transition-all hover:bg-[#007799] active:scale-[0.98] disabled:opacity-50 text-sm"
                  >
                    {loading ? t.signingIn : t.signinBtn}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs font-medium text-slate-500">
                  {t.noAccount}{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                    className="font-bold text-[#0088AA] hover:underline"
                  >
                    {t.signupBtn}
                  </button>
                </p>
              </motion.div>
            )}

            {mode === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="mb-2 text-[30px] font-bold tracking-tight text-slate-900">{t.getStarted}</h1>
                <p className="mb-6 text-slate-500 font-medium text-sm">{t.signupSubtitle}</p>

                <form onSubmit={handleEmailSignup} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">{t.nameLabel}</label>
                      <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#0088AA] focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">{t.lastNameLabel}</label>
                      <input
                        type="text"
                        required
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#0088AA] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">{t.companyLabel}</label>
                      <input
                        type="text"
                        required
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#0088AA] focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-800">{t.roleLabel}</label>
                      <input
                        type="text"
                        required
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#0088AA] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-800" htmlFor="email-signup">
                      {t.emailLabel}
                    </label>
                    <input
                      id="email-signup"
                      type="email"
                      placeholder="name@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-800" htmlFor="password-signup">
                      {t.passwordLabel}
                    </label>
                    <input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none transition-all"
                    />
                  </div>

                  {error && <div className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600">{error}</div>}
                  {success && <div className="rounded-lg bg-green-50 p-2.5 text-xs font-medium text-green-600">{success}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-full bg-[#0088AA] py-3 px-4 font-semibold text-white transition-all hover:bg-[#007799] active:scale-[0.98] disabled:opacity-50 text-xs mt-2"
                  >
                    {loading ? t.signingUp : t.signupBtn}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs font-medium text-slate-500">
                  {t.hasAccount}{" "}
                  <button
                    onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                    className="font-bold text-[#0088AA] hover:underline"
                  >
                    {t.signinBtn}
                  </button>
                </p>
              </motion.div>
            )}

            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <button
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline mb-5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.backToLogin}
                </button>

                <h1 className="mb-2 text-[30px] font-bold tracking-tight text-slate-900">{t.forgotTitle}</h1>
                <p className="mb-6 text-slate-500 font-medium text-xs leading-relaxed">{t.forgotSubtitle}</p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="email-forgot">
                      {t.emailLabel}
                    </label>
                    <input
                      id="email-forgot"
                      type="email"
                      placeholder="name@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none transition-all"
                    />
                  </div>

                  {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}
                  {success && <div className="rounded-lg bg-green-50 p-3 text-xs font-medium text-green-600">{success}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-full bg-[#0088AA] py-3 px-4 font-semibold text-white transition-all hover:bg-[#007799] active:scale-[0.98] disabled:opacity-50 text-sm mt-2"
                  >
                    {loading ? t.sendingReset : t.sendResetBtn}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 left-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold lg:flex hidden gap-4">
          <p>{t.copyright}</p>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[15%] text-[10px] text-slate-400 uppercase tracking-widest font-bold flex gap-4">
          <Link href="/privacy" className="hover:text-slate-600">{t.privacy}</Link>
          <Link href="/terms" className="hover:text-slate-600">{t.terms}</Link>
        </div>
      </div>

      {/* Right Side - Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#F8F9FA] items-center justify-center p-12 xl:p-24">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10"
          >
            <div className="absolute -top-8 -left-6 text-slate-200/80 -z-10 select-none">
              <svg width="100" height="80" viewBox="0 0 120 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 100V44.4444C0 14.8148 16.6667 0 50 0V22.2222C38.8889 22.2222 33.3333 29.6296 33.3333 44.4444V55.5556H50V100H0ZM66.6667 100V44.4444C66.6667 14.8148 83.3333 0 116.667 0V22.2222C105.556 22.2222 100 29.6296 100 44.4444V55.5556H116.667V100H66.6667Z" />
              </svg>
            </div>

            <h2 className="mb-10 text-[24px] font-light leading-relaxed text-slate-700 italic tracking-tight">
              "{t.testimonialQuote}"
            </h2>
            
            <div className="flex items-center gap-4 mb-14">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100">
                <div className="h-5 w-5 text-[#0088AA]">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{t.testimonialAuthor}</p>
                <p className="text-xs font-bold text-[#0088AA]">{t.testimonialTag}</p>
              </div>
            </div>

            <div className="flex justify-between rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <div className="flex-1 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.kpiUptime}</p>
                <p className="text-xl font-extrabold text-[#0088AA]">99.9%</p>
              </div>
              <div className="w-px bg-slate-100"></div>
              <div className="flex-1 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.kpiPerformance}</p>
                <p className="text-xl font-extrabold text-[#0088AA]">1.2s</p>
              </div>
              <div className="w-px bg-slate-100"></div>
              <div className="flex-1 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.kpiUsers}</p>
                <p className="text-xl font-extrabold text-[#0088AA]">{userCount !== null ? `${userCount}` : "5"}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
