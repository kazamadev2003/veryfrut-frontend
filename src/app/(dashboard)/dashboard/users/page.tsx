'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, Mail, Phone, MapPin, Calendar, ArrowUpRight, Plus, Search, Eye, Trash2, Loader2, Pencil } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeleteUserMutation, useUsersQuery } from '@/lib/api/hooks/useUsers';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'createdAt' | 'firstName' | 'lastName' | 'email' | 'role' | 'id'>('createdAt');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const deleteMutation = useDeleteUserMutation();

  const { data: usersData, error, isLoading } = useUsersQuery({ 
    page: currentPage,
    limit,
    q: searchTerm || undefined,
    sortBy,
    order,
  });
  const isArrayResponse = Array.isArray(usersData);
  const users = useMemo(() => (isArrayResponse ? usersData : usersData?.items ?? []), [isArrayResponse, usersData]);

  const filteredUsers = useMemo(() => {
    if (!isArrayResponse) return users;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user: User) =>
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.phone || '').toLowerCase().includes(term)
    );
  }, [isArrayResponse, searchTerm, users]);

  const total = isArrayResponse ? filteredUsers.length : usersData?.total ?? users.length;
  const totalPages = isArrayResponse
    ? Math.max(1, Math.ceil(total / limit))
    : usersData?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  const pagedUsers = isArrayResponse
    ? filteredUsers.slice((currentPage - 1) * limit, currentPage * limit)
    : users;

  const handleView = (user: User) => {
    setSelectedUser(user);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Estas seguro de eliminar a ${user.firstName} ${user.lastName}?`)) return;
    try {
      setDeletingId(user.id);
      await deleteMutation.mutateAsync(user.id);
    } catch (err) {
      console.error('[UsersPage] Error deleting user:', err);
      alert('Error al eliminar el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-6 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-semibold">Usuarios</h1>
          </div>
          <Link href="/dashboard/users/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error cargando datos</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
          </div>
        )}

        {/* Welcome Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Gestión de Usuarios</h2>
          <p className="text-lg text-muted-foreground">Administra y controla todos los usuarios del sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total de Usuarios */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usuarios
              </CardTitle>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-chart-1" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" /> Activos en el sistema
              </p>
            </CardContent>
          </Card>

          {/* Usuarios Activos */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos Hoy
              </CardTitle>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{Math.floor(total * 0.7)}</div>
              <p className="text-xs text-muted-foreground">En última sesión</p>
            </CardContent>
          </Card>

          {/* Nuevos Esta Semana */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nuevos Esta Semana
              </CardTitle>
              <div className="p-3 bg-purple-100 rounded-full">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">{Math.floor(total * 0.15)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" /> Registrados
              </p>
            </CardContent>
          </Card>

          {/* Tasa de Retención */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Retención
              </CardTitle>
              <div className="p-3 bg-orange-100 rounded-full">
                <MapPin className="w-5 h-5 text-vibrant-orange" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-foreground">94%</div>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value as typeof sortBy);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">createdAt</SelectItem>
              <SelectItem value="firstName">firstName</SelectItem>
              <SelectItem value="lastName">lastName</SelectItem>
              <SelectItem value="email">email</SelectItem>
              <SelectItem value="role">role</SelectItem>
              <SelectItem value="id">id</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={order}
            onValueChange={(value) => {
              setOrder(value as typeof order);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">desc</SelectItem>
              <SelectItem value="asc">asc</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Limite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lista de Usuarios</CardTitle>
              <span className="text-sm text-muted-foreground">
                {pagedUsers.length} de {total} registros
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading && (
              <div className="mb-4 text-sm text-muted-foreground">Cargando usuarios...</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Teléfono</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Fecha Registro</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.length === 0 ? (
                    <tr className="border-b border-border">
                      <td colSpan={5} className="py-12 px-4 text-center text-sm text-muted-foreground">
                        No hay usuarios disponibles
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((user: User) => (
                      <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {user.phone ? (
                              <>
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ver"
                              aria-label="Ver"
                              onClick={() => handleView(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Link href={`/dashboard/users/editar/${user.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Editar"
                                aria-label="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                              aria-label="Eliminar"
                              onClick={() => handleDelete(user)}
                              disabled={deleteMutation.isPending && deletingId === user.id}
                            >
                              {deleteMutation.isPending && deletingId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {total === 0 ? (
                  <>Mostrando 0 a 0 de 0 usuarios</>
                ) : (
                  <>Mostrando {(currentPage - 1) * limit + 1} a {Math.min(currentPage * limit, total)} de {total} usuarios</>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-medium">
                    Pag {currentPage} de {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="h-8 text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de usuario</DialogTitle>
            <DialogDescription>Informacion basica del usuario seleccionado</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefono</p>
                <p className="font-medium">{selectedUser.phone || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Direccion</p>
                <p className="font-medium">{selectedUser.address || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha registro</p>
                <p className="font-medium">
                  {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
