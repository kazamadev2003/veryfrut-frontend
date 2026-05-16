'use client';

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateSupplierInput } from '@/types/supplier';
import suppliersService, { type Suplier } from '@/lib/api/services/suppliers-service';
import { useQueryClient } from '@tanstack/react-query';
import queryKeys from '@/lib/api/queryKeys';

export default function CreateSupplierPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Suplier[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [formData, setFormData] = useState<CreateSupplierInput>({
    name: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    setIsLoading(true);
    try {
      const newSupplier = await suppliersService.create(formData);

      if (newSupplier) {
        setSuppliers((prev) => [newSupplier, ...prev]);
        await queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.lists() });
        await queryClient.refetchQueries({ queryKey: queryKeys.suppliers.lists(), type: 'all' });
        toast.success('Proveedor creado exitosamente');

        setFormData({
          name: '',
          companyName: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
        });
        router.push('/dashboard/supliers/users');
      } else {
        throw new Error('No se pudo crear el proveedor');
      }
    } catch (error) {
      toast.error('Error al crear el proveedor');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Estas seguro de eliminar este proveedor?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success('Proveedor eliminado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex min-h-14 flex-col gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="text-sm font-semibold text-slate-700">Proveedores</span>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link href="/dashboard/supliers/users" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto">
              Ver Proveedores
            </Button>
          </Link>
          <Link href="/dashboard/supliers/purchases" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto">
              Registrar Compra
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-3 text-2xl font-bold sm:text-4xl">Crear Proveedor</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Registra nuevos proveedores y centraliza su informacion de contacto para futuras compras.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="shadow-lg lg:col-span-2">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-xl text-blue-900 sm:text-2xl">Formulario de Registro</CardTitle>
              <CardDescription className="text-sm text-blue-700 sm:text-base">
                Completa los datos del nuevo proveedor
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 sm:pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Nombre del Proveedor *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ej: Acme Corp"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-semibold text-slate-700">
                      Nombre de Empresa
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="Ej: Acme Manufacturing Inc."
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-sm font-semibold text-slate-700">
                      Nombre de Contacto
                    </Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      type="text"
                      placeholder="Ej: Juan Perez"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Telefono
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Ej: +34 912 345 678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ej: contacto@acme.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                    Direccion
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Ej: Calle Principal 123, Madrid, Espana"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="min-h-24 resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Proveedor
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        name: '',
                        companyName: '',
                        contactName: '',
                        phone: '',
                        email: '',
                        address: '',
                      })
                    }
                    className="h-10 w-full sm:w-auto"
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100">
              <CardTitle className="text-lg text-amber-900">Informacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">Campo Requerido</h3>
                <p className="text-sm text-blue-800">
                  El <strong>Nombre del Proveedor</strong> es obligatorio para crear un nuevo registro.
                </p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="mb-2 font-semibold text-green-900">Campos Opcionales</h3>
                <p className="text-sm text-green-800">
                  Los demas campos puedes completarlos segun la informacion disponible del proveedor.
                </p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-2 font-semibold text-purple-900">Proximo Paso</h3>
                <p className="mb-3 text-sm text-purple-800">
                  Una vez creado el proveedor, podras registrar compras asociadas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {suppliers.length > 0 && (
          <Card className="mt-8 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Proveedores Creados</CardTitle>
              <CardDescription>
                {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{supplier.name}</h3>
                      {supplier.email && <p className="text-sm text-slate-600">{supplier.email}</p>}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
                      className="w-full sm:w-auto"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
