"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, ArrowRight, Github } from "lucide-react"
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
    <div className="flex min-h-screen bg-surface">
      {/* Left Side - Auth Form */}
      <div className="flex w-full flex-col justify-center px-6 lg:w-1/2 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-on-surface">Mario Mojica</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-on-surface">Welcome back</h1>
          <p className="mb-8 text-on-surface-variant">Please enter your details to sign in.</p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low py-3 px-4 text-on-surface transition-all hover:bg-surface-container-high hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-outline-variant" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-on-surface-variant">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
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
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-error/10 p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Don't have an account?{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Create an account
            </a>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Brand/Testimonial */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-surface to-surface" />
        
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" 
        />

        <div className="relative h-full flex flex-col justify-center p-12 xl:p-24">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New Release v2.4
              </div>
              
              <h2 className="mb-8 text-5xl font-bold leading-tight text-on-surface">
                Manage your projects with <span className="text-primary italic">precision</span> and style.
              </h2>
              
              <div className="relative rounded-3xl border border-outline-variant bg-surface-container-low/50 p-8 backdrop-blur-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-tertiary fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 text-xl text-on-surface italic leading-relaxed">
                  "The interface is so intuitive and clean. It has transformed how our team collaborates on high-stake projects. Why did I wait so long to switch?"
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 p-1">
                    <img 
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
                      alt="Alex Rivera" 
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Alex Rivera</p>
                    <p className="text-sm text-on-surface-variant">Senior Product Designer, TechFlow</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-12 grid grid-cols-3 gap-8 border-t border-outline-variant pt-12">
                <div>
                  <p className="text-3xl font-bold text-on-surface">99.9%</p>
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider">Uptime</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-on-surface">600k+</p>
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider">Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-on-surface">2.4s</p>
                  <p className="text-sm text-on-surface-variant uppercase tracking-wider">Avg. Response</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
