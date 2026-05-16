'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliersQuery } from '@/lib/api';
import suppliersService, {
  type Suplier,
  type CreateSuplierDto,
  type UpdateSuplierDto,
  type PaginatedSupliersResponse,
} from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

const emptyForm: CreateSuplierDto = {
  name: '',
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
};

export default function SuppliersUsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, error, refetch } = useSuppliersQuery();
  const suppliers = useMemo(() => data?.data ?? [], [data]);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSuplierDto>(emptyForm);
  const [editData, setEditData] = useState<UpdateSuplierDto>(emptyForm);
  const [editingSupplier, setEditingSupplier] = useState<Suplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter((supplier) => {
      return [
        supplier.name,
        supplier.companyName,
        supplier.contactName,
        supplier.phone,
        supplier.email,
        supplier.address,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [search, suppliers]);

  const handleCreateChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const created = await suppliersService.create(formData);
      if (!created) throw new Error('No se pudo crear el proveedor');
      toast.success('Proveedor creado');
      setFormData(emptyForm);
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
    } catch (createError) {
      console.error(createError);
      toast.error('Error al crear proveedor');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (supplier: Suplier) => {
    setEditingSupplier(supplier);
    setEditData({
      name: supplier.name,
      companyName: supplier.companyName || '',
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    if (!editData.name?.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const updated = await suppliersService.update(editingSupplier.id, editData);
      if (!updated) throw new Error('No se pudo actualizar el proveedor');
      toast.success('Proveedor actualizado');
      setEditOpen(false);
      setEditingSupplier(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
    } catch (updateError) {
      console.error(updateError);
      toast.error('Error al actualizar proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier: Suplier) => {
    if (!confirm(`Eliminar proveedor "${supplier.name}"?`)) return;

    const previousLists = queryClient.getQueriesData<PaginatedSupliersResponse>({
      queryKey: queryKeys.suppliers.lists(),
    });

    queryClient.setQueriesData<PaginatedSupliersResponse>(
      { queryKey: queryKeys.suppliers.lists() },
      (current) => {
        if (!current || !Array.isArray(current.data)) return current;
        const nextData = current.data.filter((item) => item.id !== supplier.id);
        return {
          ...current,
          data: nextData,
          total: typeof current.total === 'number' ? Math.max(0, current.total - 1) : nextData.length,
        };
      }
    );

    try {
      setDeletingId(supplier.id);
      const result = await suppliersService.delete(supplier.id);
      if (!result?.success) throw new Error('No se pudo eliminar el proveedor');
      toast.success('Proveedor eliminado');
      await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
    } catch (deleteError) {
      previousLists.forEach(([key, value]) => {
        queryClient.setQueryData(key, value);
      });
      console.error(deleteError);
      toast.error('Error al eliminar proveedor');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-700">Proveedores</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/supliers/create">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Crear Proveedor</Button>
          </Link>
          <Link href="/dashboard/supliers/purchases">
            <Button size="sm" variant="outline">Registrar Compra</Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-4xl font-bold">Gestión de Proveedores</h1>
          <p className="max-w-2xl text-slate-300">
            Administra proveedores con creación, edición y eliminación en una sola vista.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Proveedores</h1>
            <p className="text-slate-600 mt-1">Gestiona tus proveedores con CRUD y tabla de datos.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Link href="/dashboard/supliers/create">
              <Button variant="outline">Crear en pagina completa</Button>
            </Link>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo proveedor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nuevo proveedor</DialogTitle>
                  <DialogDescription>Completa los datos para registrar el proveedor.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleCreateChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Empresa</Label>
                      <Input id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleCreateChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contacto</Label>
                      <Input id="contactName" name="contactName" value={formData.contactName || ''} onChange={handleCreateChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input id="phone" name="phone" value={formData.phone || ''} onChange={handleCreateChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleCreateChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Direccion</Label>
                    <Textarea id="address" name="address" value={formData.address || ''} onChange={handleCreateChange} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Guardar proveedor
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl text-slate-900">Listado de proveedores</CardTitle>
                <CardDescription>
                  {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} en el sistema
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, contacto, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Cargando proveedores...
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">Error al cargar proveedores.</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-sm text-slate-500">No hay proveedores para mostrar.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Proveedor</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Empresa</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Contacto</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Telefono</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Email</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Direccion</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="border-b last:border-b-0">
                        <td className="p-3 font-medium text-slate-900">{supplier.name}</td>
                        <td className="p-3 text-slate-600">{supplier.companyName || '-'}</td>
                        <td className="p-3 text-slate-600">{supplier.contactName || '-'}</td>
                        <td className="p-3 text-slate-600">{supplier.phone || '-'}</td>
                        <td className="p-3 text-slate-600">{supplier.email || '-'}</td>
                        <td className="p-3 text-slate-600">{supplier.address || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={deletingId === supplier.id}
                              onClick={() => handleDelete(supplier)}
                            >
                              {deletingId === supplier.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingSupplier(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
            <DialogDescription>
              {editingSupplier ? `Actualizando proveedor: ${editingSupplier.name}` : 'Selecciona un proveedor'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editData.name || ''}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-companyName">Empresa</Label>
                <Input
                  id="edit-companyName"
                  name="companyName"
                  value={editData.companyName || ''}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactName">Contacto</Label>
                <Input
                  id="edit-contactName"
                  name="contactName"
                  value={editData.contactName || ''}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefono</Label>
                <Input id="edit-phone" name="phone" value={editData.phone || ''} onChange={handleEditChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" type="email" value={editData.email || ''} onChange={handleEditChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Direccion</Label>
              <Textarea id="edit-address" name="address" value={editData.address || ''} onChange={handleEditChange} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !editingSupplier}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
