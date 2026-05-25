/* eslint-disable react/no-unescaped-entities */
 
 
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side - Auth Form */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 xl:px-24 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md pb-16"
        >
          {/* Logo */}
          <div className="mb-10 flex items-center justify-center lg:justify-start">
            <img src="/Logo_vertical_color_en.svg" alt="Mario Mojica" className="h-8" />
          </div>

          <h1 className="mb-2 text-[32px] font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mb-8 text-slate-500 font-medium">Sign in to your account</p>

          <div className="space-y-4">
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
              <span className="font-semibold text-sm">Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-400 font-medium">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none focus:ring-1 focus:ring-[#0088AA] transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#0088AA] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0088AA] focus:outline-none focus:ring-1 focus:ring-[#0088AA] transition-all"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[#0088AA] py-3.5 px-4 font-semibold text-white transition-all hover:bg-[#007799] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="font-bold text-[#0088AA] hover:underline">
              Regístrate
            </a>
          </p>
        </motion.div>
        
        <div className="absolute bottom-6 left-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold lg:flex hidden gap-4">
          <p>© 2024 MARIO MOJICA</p>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[15%] text-[10px] text-slate-400 uppercase tracking-widest font-bold flex gap-4">
          <a href="#" className="hover:text-slate-600">PRIVACY</a>
          <a href="#" className="hover:text-slate-600">TERMS</a>
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

            <h2 className="mb-10 text-[32px] font-light leading-snug text-slate-700 italic tracking-tight">
              "Okay, I finally tried this platform today and wow... why did I wait so long? Went from 'how do I even start' to having everything running in minutes."
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
                <p className="font-bold text-slate-900 text-sm">Alex Rivera</p>
                <p className="text-xs font-bold text-[#0088AA]">#Innovation</p>
              </div>
            </div>

            <div className="flex justify-between rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">UPTIME</p>
                <p className="text-xl font-extrabold text-[#0088AA]">99.9%</p>
              </div>
              <div className="w-px bg-slate-100"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">PERFORMANCE</p>
                <p className="text-xl font-extrabold text-[#0088AA]">1.2s</p>
              </div>
              <div className="w-px bg-slate-100"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">USERS</p>
                <p className="text-xl font-extrabold text-[#0088AA]">40k+</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

