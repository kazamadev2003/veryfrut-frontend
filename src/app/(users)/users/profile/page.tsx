"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Lock, Save, UserCircle } from "lucide-react"
import { usersService, useUpdatePasswordMutation, useUpdateUserMutation } from "@/lib/api"
import type { UpdateUserDto, User } from "@/types/users"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { toast } from "sonner"

const emptyProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
}

const emptyPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

export default function UsersProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [password, setPassword] = useState(emptyPassword)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const updateUserMutation = useUpdateUserMutation(user?.id ?? 0)
  const updatePasswordMutation = useUpdatePasswordMutation(user?.id ?? 0)

  useEffect(() => {
    let isMounted = true

    usersService
      .getMe()
      .then((currentUser) => {
        if (!isMounted) return
        if (!currentUser) {
          setLoadError("Necesitas iniciar sesion para ver tu perfil.")
          return
        }
        setUser(currentUser)
        setProfile({
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          address: currentUser.address || "",
        })
      })
      .catch(() => {
        if (!isMounted) return
        setLoadError("No se pudo cargar la informacion del perfil.")
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const hasProfileChanges = useMemo(() => {
    if (!user) return false
    return (
      profile.firstName.trim() !== (user.firstName || "") ||
      profile.lastName.trim() !== (user.lastName || "") ||
      profile.email.trim() !== (user.email || "") ||
      profile.phone.trim() !== (user.phone || "") ||
      profile.address.trim() !== (user.address || "")
    )
  }, [profile, user])

  const canUpdatePassword = useMemo(() => {
    return (
      password.currentPassword.trim().length > 0 &&
      password.newPassword.trim().length > 0 &&
      password.confirmPassword.trim().length > 0
    )
  }, [password])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast.error("No hay usuario autenticado.")
      return
    }

    const payload: UpdateUserDto = {}
    const firstName = profile.firstName.trim()
    const lastName = profile.lastName.trim()
    const email = profile.email.trim()
    const phone = profile.phone.trim()
    const address = profile.address.trim()

    if (firstName !== (user.firstName || "")) payload.firstName = firstName
    if (lastName !== (user.lastName || "")) payload.lastName = lastName
    if (email !== (user.email || "")) payload.email = email
    if (phone !== (user.phone || "")) payload.phone = phone
    if (address !== (user.address || "")) payload.address = address

    if (Object.keys(payload).length === 0) {
      toast.message("No hay cambios para guardar.")
      return
    }

    try {
      const updated = await updateUserMutation.mutateAsync(payload)
      if (updated) {
        setUser(updated)
        setProfile({
          firstName: updated.firstName || "",
          lastName: updated.lastName || "",
          email: updated.email || "",
          phone: updated.phone || "",
          address: updated.address || "",
        })
      }
      toast.success("Perfil actualizado.")
    } catch {
      toast.error("No se pudo actualizar el perfil.")
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!user) {
      toast.error("No hay usuario autenticado.")
      return
    }

    if (!canUpdatePassword) {
      toast.error("Completa todos los campos de contrasena.")
      return
    }

    if (password.newPassword !== password.confirmPassword) {
      toast.error("La nueva contrasena no coincide.")
      return
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      })
      setPassword(emptyPassword)
      toast.success("Contrasena actualizada.")
    } catch {
      toast.error("No se pudo actualizar la contrasena.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-full border border-gray-200" />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Perfil</p>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Perfil de usuario</h1>
              <p className="text-sm text-gray-500">Actualiza tu informacion personal.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Rol: {user?.role ?? "cliente"}</Badge>
            <Badge variant="secondary">ID: {user?.id ?? "--"}</Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        {isLoading ? (
          <div className="text-sm text-gray-500">Cargando perfil...</div>
        ) : loadError ? (
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{loadError}</CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <UserCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base text-gray-900">Datos personales</CardTitle>
                  <p className="text-xs text-gray-500">Gestiona tu informacion basica.</p>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Nombre</label>
                      <Input
                        value={profile.firstName}
                        onChange={(event) => setProfile((prev) => ({ ...prev, firstName: event.target.value }))}
                        className="h-11 border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Apellido</label>
                      <Input
                        value={profile.lastName}
                        onChange={(event) => setProfile((prev) => ({ ...prev, lastName: event.target.value }))}
                        className="h-11 border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                      className="h-11 border-gray-300"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Telefono</label>
                      <Input
                        value={profile.phone}
                        onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                        className="h-11 border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Direccion</label>
                      <Input
                        value={profile.address}
                        onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
                        className="h-11 border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      className="h-10 bg-green-600 text-white hover:bg-green-700"
                      disabled={!hasProfileChanges || updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                    {!hasProfileChanges ? (
                      <span className="text-xs text-gray-500">Sin cambios pendientes.</span>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base text-gray-900">Seguridad</CardTitle>
                  <p className="text-xs text-gray-500">Solo lectura.</p>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Contrasena actual</label>
                    <Input
                      type="password"
                      value={password.currentPassword}
                      onChange={(event) =>
                        setPassword((prev) => ({ ...prev, currentPassword: event.target.value }))
                      }
                      className="h-11 border-gray-300"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nueva contrasena</label>
                    <Input
                      type="password"
                      value={password.newPassword}
                      onChange={(event) => setPassword((prev) => ({ ...prev, newPassword: event.target.value }))}
                      className="h-11 border-gray-300"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Confirmar contrasena</label>
                    <Input
                      type="password"
                      value={password.confirmPassword}
                      onChange={(event) =>
                        setPassword((prev) => ({ ...prev, confirmPassword: event.target.value }))
                      }
                      className="h-11 border-gray-300"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Para cambiar la contrasena, contacta a soporte.
                  </p>
                  <Button
                    type="submit"
                    className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
                    disabled
                  >
                    Actualizar contrasena
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
