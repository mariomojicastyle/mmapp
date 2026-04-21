"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ChevronRight } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Columna Izquierda: Formulario */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-32 bg-background py-16">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="mb-12">
            <Link href="/">
              <Image
                src="/Logo_Header.svg"
                alt="Mario Mojica Logo"
                width={150}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-foreground/60">
              Ingresa a tu cuenta para gestionar tus proyectos.
            </p>
          </div>

          {/* Social Login */}
          <div className="space-y-4 mb-8">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-foreground/10 rounded-xl bg-white hover:bg-foreground/[0.02] transition-colors shadow-sm text-foreground/80 font-medium">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
          </div>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-foreground/10"></span>
            </div>
            <span className="relative px-4 bg-background text-sm text-foreground/40 font-medium uppercase tracking-wider">
              o
            </span>
          </div>

          {/* Formulario Tradicional */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-foreground/80 ml-1"
              >
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  id="email"
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-foreground/20"
                  placeholder="Tu correo electrónico"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-foreground/80"
                >
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  id="password"
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-foreground/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Iniciar Sesión
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-foreground/60">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/signup"
              className="font-bold text-primary hover:text-primary/80"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Columna Derecha: Testimonio / Social Proof */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-surface p-20 relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg"
        >
          <div className="mb-8">
            <svg
              className="w-12 h-12 text-primary/20"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M10 8v8h6v8h-8v-8h-4v-8h6zm14 0v8h6v8h-8v-8h-4v-8h6z" />
            </svg>
          </div>

          <blockquote className="text-2xl font-medium leading-relaxed text-foreground/80 mb-10 italic">
            "Finalmente probé esta plataforma y wow... ¿por qué esperé tanto?
            Pasé de no saber cómo empezar a tener todo funcionando en minutos.
            Elegancia y potencia en un solo lugar."
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              MM
            </div>
            <div>
              <p className="font-bold text-foreground">Mario Mojica</p>
              <p className="text-sm text-foreground/40 italic">
                @mariomojica_design
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
