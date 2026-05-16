"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Space_Grotesk, Inter } from "next/font/google"
import { Loader2, Lock, Mail, Phone, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLoginMutation } from "@/lib/api"
import { decodeJwtPayload } from "@/lib/api/auth"
import { toast } from "sonner"

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
})

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const loginMutation = useLoginMutation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage("")
    if (!canSubmit) {
      const message = "Completa el email y la clave"
      toast.error(message)
      setErrorMessage(message)
      return
    }

    try {
      const response = await loginMutation.mutateAsync({ email, password })
      const token =
        typeof response === "string"
          ? response
          : response?.accessToken || response?.access_token || response?.token

      if (!token) {
        const message = "No se recibio token de acceso"
        toast.error(message)
        setErrorMessage(message)
        return
      }

      const payload = decodeJwtPayload(token)
      const role = payload?.role

      queryClient.clear()

      if (role === "admin") {
        router.replace("/dashboard")
        router.refresh()
        return
      }

      router.replace("/users")
      router.refresh()
    } catch {
      const message = "Credenciales invalidas"
      toast.error(message)
      setErrorMessage(message)
    }
  }

  return (
    <div className={`${body.className} relative min-h-screen w-full`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ed] via-white to-[#faf8f5] pointer-events-none" />
      
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8ed765]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8ed765]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main container */}
      <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl grid gap-12 lg:grid-cols-2 items-center">
          
          {/* Left section - Info */}
          <div className="hidden lg:block space-y-12">
            <div>
              <div className="inline-flex items-center gap-2 mb-8">
                <div className="text-3xl font-bold text-gray-900">VeryFrut</div>
                <div className="h-1 w-16 bg-[#8ed765] rounded-full" />
              </div>
              
              <h1 className={`${display.className} text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6`}>
                Acceso Exclusivo
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Gestiona tus órdenes, revisa productos exclusivos y accede a entregas precisas en tu zona asignada.
              </p>
            </div>

            {/* Contact cards */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-100">
                <div className="flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#8ed765]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                  <a href="tel:987801148" className="text-[#1a1a1a] hover:text-[#8ed765] transition-colors flex font-normal text-lg items-center gap-0 leading-7 tracking-normal">
                    987 801 148
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-100">
                <div className="flex-shrink-0">
                  <Mail className="w-6 h-6 text-[#8ed765]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Correo</p>
                  <a href="mailto:veryfrut.fernanda@gmail.com" className="text-[#1a1a1a] hover:text-[#8ed765] transition-colors flex font-normal text-lg items-center gap-0 leading-7 tracking-normal">
                    veryfrut.fernanda@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">Para solicitar acceso, contacta con nuestro equipo comercial</p>
              <p className="text-xs text-gray-400 mt-2">Atención: Lunes a Viernes | 8:00 AM - 6:00 PM</p>
            </div>
          </div>

          {/* Right section - Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#8ed765] hover:text-[#5ea437]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver
              </Link>
            </div>

            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <div className="text-2xl font-bold text-gray-900 mb-1">VeryFrut</div>
              <p className="text-[#8ed765] font-semibold text-sm">Acceso Exclusivo para Clientes</p>
            </div>

            {/* Login card */}
            <div className="rounded-3xl bg-white/80 backdrop-blur border border-gray-100 p-8 shadow-sm">
              <h2 className={`${display.className} text-3xl font-bold text-gray-900 mb-2`}>
                Iniciar Sesión
              </h2>
              <p className="text-gray-600 mb-8 text-sm">Usa tu email y contraseña personal</p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@empresa.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="email"
                      className="h-11 rounded-xl border border-gray-200 bg-white/50 pl-12 text-gray-900 placeholder:text-gray-400 focus:border-[#8ed765] focus:ring-2 focus:ring-[#8ed765]/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="h-11 rounded-xl border border-gray-200 bg-white/50 pl-12 text-gray-900 placeholder:text-gray-400 focus:border-[#8ed765] focus:ring-2 focus:ring-[#8ed765]/20 transition-colors"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit || loginMutation.isPending}
                  className="w-full h-11 rounded-xl bg-[#8ed765] text-gray-900 font-semibold hover:bg-[#7fc955] active:bg-[#75b84a] transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Mobile contact section */}
              <div className="lg:hidden mt-8 pt-8 border-t border-gray-200 space-y-3">
                <p className="text-sm font-semibold text-gray-900">¿Necesitas acceso?</p>
                <a 
                  href="tel:987801148" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#8ed765]/10 hover:bg-[#8ed765]/20 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-[#8ed765] group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-900 font-medium">987 801 148</span>
                </a>
                <a 
                  href="mailto:veryfrut.fernanda@gmail.com" 
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#8ed765]/10 hover:bg-[#8ed765]/20 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-[#8ed765] group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-900 font-medium">veryfrut.fernanda@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Footer text */}
            <p className="text-xs text-gray-500 text-center mt-6">© 2024 VeryFrut. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  )
}


