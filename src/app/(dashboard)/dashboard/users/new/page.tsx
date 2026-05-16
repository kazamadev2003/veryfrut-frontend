'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateUserMutation } from '@/lib/api/hooks/useUsers';
import { useAreasByCompanyQuery } from '@/lib/api/hooks/useArea';
import { useCompaniesQuery } from '@/lib/api/hooks/useCompany';
import type { Area } from '@/types/area';
import type { Company } from '@/types/company';
import type { CreateUserDto, UserRole } from '@/types/users';

const emptyForm: CreateUserDto = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  role: 'customer',
  areaIds: [],
  password: '',
};

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateUserDto>(emptyForm);
  const [companyId, setCompanyId] = useState<number | null>(null);

  const createUserMutation = useCreateUserMutation();
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useCompaniesQuery({ limit: 100 });
  const {
    data: areas = [],
    isLoading: areasLoading,
    error: areasError,
  } = useAreasByCompanyQuery(companyId, { limit: 100 });

  const areaList = useMemo(() => (Array.isArray(areas) ? areas : []), [areas]);
  const visibleAreas = useMemo(() => {
    if (!companyId) return [];
    return areaList.filter((area) => area.companyId === companyId);
  }, [areaList, companyId]);
  const companyList = useMemo(() => (Array.isArray(companies) ? companies : []), [companies]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };

  const handleCompanyChange = (value: string) => {
    const nextCompanyId = value ? Number(value) : null;
    setCompanyId(nextCompanyId);
    setFormData((prev) => ({ ...prev, areaIds: [] }));
  };

  useEffect(() => {
    if (!companyId) return;
    setFormData((prev) => {
      const nextAreaIds = prev.areaIds.filter((id) => visibleAreas.some((area) => area.id === id));
      if (nextAreaIds.length === prev.areaIds.length && nextAreaIds.every((id, index) => id === prev.areaIds[index])) {
        return prev;
      }
      return { ...prev, areaIds: nextAreaIds };
    });
  }, [companyId, visibleAreas]);

  const toggleArea = (areaId: number) => {
    setFormData((prev) => {
      const exists = prev.areaIds.includes(areaId);
      return {
        ...prev,
        areaIds: exists ? prev.areaIds.filter((id) => id !== areaId) : [...prev.areaIds, areaId],
      };
    });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('El apellido es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }
    if (!formData.password.trim()) {
      toast.error('La contrasena es requerida');
      return false;
    }
    if (!companyId) {
      toast.error('Selecciona una empresa');
      return false;
    }
    if (formData.areaIds.length === 0) {
      toast.error('Selecciona al menos un area');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const createdUser = await createUserMutation.mutateAsync(formData);
      if (!createdUser) {
        throw new Error('No se pudo crear el usuario');
      }
      toast.success('Usuario creado exitosamente');
      setFormData(emptyForm);
      router.push('/dashboard/users');
    } catch (error) {
      console.error('[CreateUserPage] create error:', error);
      toast.error('Error al crear el usuario');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/users">
              <Button variant="ghost" size="icon" aria-label="Volver a usuarios">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Crear Usuario</h1>
              <p className="text-slate-600 mt-1">Registra un nuevo usuario en el sistema</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="text-2xl text-blue-900">Datos del usuario</CardTitle>
              <CardDescription className="text-blue-700">
                Completa la informacion basica y asigna areas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                      Nombre *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Ej: Maria"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                      Apellido *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Ej: Lopez"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ej: maria@empresa.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Telefono
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Ej: +1 555 123 4567"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-slate-700">
                      Rol *
                    </Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className="h-10 border-slate-200">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="customer">customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyId" className="text-sm font-semibold text-slate-700">
                    Empresa *
                  </Label>
                  {companiesError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Error al cargar empresas
                    </div>
                  )}
                  <Select
                    value={companyId ? companyId.toString() : ''}
                    onValueChange={handleCompanyChange}
                    disabled={companiesLoading}
                  >
                    <SelectTrigger className="h-10 border-slate-200">
                      <SelectValue placeholder={companiesLoading ? 'Cargando empresas...' : 'Selecciona una empresa'} />
                    </SelectTrigger>
                    <SelectContent>
                      {companyList.map((company: Company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-slate-700">
                    Direccion
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Ej: Calle Principal 123, Ciudad"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 min-h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Contrasena *
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimo 8 caracteres"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">
                    Areas asignadas *
                  </Label>
                  {areasError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      Error al cargar areas
                    </div>
                  )}
                  {!companyId ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      Selecciona una empresa para ver sus areas.
                    </div>
                  ) : areasLoading ? (
                    <div className="text-sm text-muted-foreground">Cargando areas...</div>
                  ) : visibleAreas.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      No hay areas disponibles.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visibleAreas.map((area: Area) => {
                        const selected = formData.areaIds.includes(area.id);
                        return (
                          <Button
                            key={area.id}
                            type="button"
                            variant="outline"
                            onClick={() => toggleArea(area.id)}
                            className={
                              selected
                                ? 'h-10 justify-start border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                                : 'h-10 justify-start border-slate-200'
                            }
                          >
                            <span
                              className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: area.color || '#64748b' }}
                            />
                            <span className="truncate">{area.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10"
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Usuario
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(emptyForm)}
                    className="h-10"
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lg h-fit">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b">
              <CardTitle className="text-lg text-amber-900">Informacion</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Campos requeridos</h3>
                <p className="text-sm text-blue-800">
                  Nombre, apellido, email, contrasena y al menos un area son obligatorios.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Roles</h3>
                <p className="text-sm text-green-800">
                  Usa <strong>admin</strong> para administradores y <strong>customer</strong> para usuarios finales.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
