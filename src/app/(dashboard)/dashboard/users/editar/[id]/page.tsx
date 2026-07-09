'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAreasQuery } from '@/lib/api/hooks/useArea';
import { useCompaniesQuery } from '@/lib/api/hooks/useCompany';
import { useUpdateUserMutation, useUserQuery } from '@/lib/api/hooks/useUsers';
import type { Area } from '@/types/area';
import type { Company } from '@/types/company';
import type { UpdateUserDto, User, UserRole } from '@/types/users';

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  companyId: number | null;
  areaIds: number[];
  password: string;
  confirmPassword: string;
}

function buildInitialForm(user: User | undefined, allAreas: Area[]): EditUserForm {
  const userAreaIds = Array.isArray(user?.areaIds) ? user.areaIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [];
  const userAreas = (user as { areas?: Array<{ id: number; companyId?: number }> } | undefined)?.areas;

  const companyIdFromRelation = Array.isArray(userAreas)
    ? (() => {
        const companyId = Number(userAreas.find((area) => area.companyId !== undefined)?.companyId);
        return Number.isFinite(companyId) ? companyId : null;
      })()
    : null;

  const companyIdFromAreas =
    companyIdFromRelation ??
    (() => {
      const areasById = new Map(allAreas.map((area) => [area.id, area]));
      for (const areaId of userAreaIds) {
        const area = areasById.get(areaId);
        if (area?.companyId) return area.companyId;
      }
      return null;
    })();

  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || 'customer',
    companyId: companyIdFromAreas,
    areaIds: userAreaIds,
    password: '',
    confirmPassword: '',
  };
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);
  const safeUserId = Number.isFinite(userId) && userId > 0 ? userId : null;

  const { data: user, isLoading: loadingUser, error: userError } = useUserQuery(safeUserId);
  const { data: companiesData = [], isLoading: loadingCompanies, error: companiesError } = useCompaniesQuery({
    limit: 500,
  });
  const { data: allAreasData, isLoading: loadingAreas, error: areasError } = useAreasQuery({
    page: 1,
    limit: 500,
  });

  const allAreas = useMemo<Area[]>(() => {
    if (!allAreasData) return [];
    if (Array.isArray(allAreasData)) return allAreasData;
    return [];
  }, [allAreasData]);

  const companies = useMemo<Company[]>(() => {
    if (!Array.isArray(companiesData)) return [];
    return companiesData;
  }, [companiesData]);

  const initialForm = useMemo(() => buildInitialForm(user, allAreas), [allAreas, user]);

  if (!safeUserId) {
    return (
      <div className='min-h-screen p-6'>
        <Card className='max-w-3xl mx-auto'>
          <CardContent className='p-6 text-red-700'>ID de usuario invalido.</CardContent>
        </Card>
      </div>
    );
  }

  if (loadingUser || loadingAreas) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
        <div className='max-w-6xl mx-auto'>
          <Card className='shadow-lg'>
            <CardContent className='p-6 flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Cargando usuario...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <EditUserFormPanel
      safeUserId={safeUserId}
      loadingUser={loadingUser}
      loadingAreas={loadingAreas}
      loadingCompanies={loadingCompanies}
      userError={userError}
      companiesError={companiesError}
      areasError={areasError}
      companies={companies}
      allAreas={allAreas}
      initialForm={initialForm}
    />
  );
}

interface EditUserFormPanelProps {
  safeUserId: number;
  loadingUser: boolean;
  loadingAreas: boolean;
  loadingCompanies: boolean;
  userError: unknown;
  companiesError: unknown;
  areasError: unknown;
  companies: Company[];
  allAreas: Area[];
  initialForm: EditUserForm;
}

function EditUserFormPanel({
  safeUserId,
  loadingUser,
  loadingAreas,
  loadingCompanies,
  userError,
  companiesError,
  areasError,
  companies,
  allAreas,
  initialForm,
}: EditUserFormPanelProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EditUserForm>(initialForm);
  const updateUserMutation = useUpdateUserMutation(safeUserId);

  const companyAreas = useMemo<Area[]>(() => {
    if (!formData.companyId) return [];
    return allAreas.filter((area) => area.companyId === formData.companyId);
  }, [allAreas, formData.companyId]);

  const selectedAreas = useMemo<Area[]>(() => {
    if (companyAreas.length === 0 || formData.areaIds.length === 0) return [];
    const selected = new Set(formData.areaIds);
    return companyAreas.filter((area) => selected.has(area.id));
  }, [companyAreas, formData.areaIds]);

  const currentCompanyName = useMemo(() => {
    return companies.find((company) => company.id === formData.companyId)?.name ?? '';
  }, [companies, formData.companyId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };

  const handleCompanyChange = (value: string) => {
    const nextCompanyId = value ? Number(value) : null;
    setFormData((prev) => ({
      ...prev,
      companyId: nextCompanyId,
      areaIds: [],
    }));
  };

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
    if (!formData.companyId) {
      toast.error('La empresa es requerida');
      return false;
    }
    if (formData.areaIds.length === 0) {
      toast.error('Debe quedar al menos un area asignada');
      return false;
    }

    const hasPasswordInput = formData.password.trim().length > 0 || formData.confirmPassword.trim().length > 0;
    if (hasPasswordInput) {
      if (!formData.password.trim() || !formData.confirmPassword.trim()) {
        toast.error('Completa y confirma la nueva contrasena');
        return false;
      }
      if (formData.password.trim().length < 8) {
        toast.error('La contrasena debe tener al menos 8 caracteres');
        return false;
      }
      if (formData.password.trim() !== formData.confirmPassword.trim()) {
        toast.error('Las contrasenas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload: UpdateUserDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        role: formData.role,
        areaIds: formData.areaIds,
        password: formData.password.trim() || undefined,
      };
      const updated = await updateUserMutation.mutateAsync(payload);
      if (!updated) throw new Error('No se pudo actualizar el usuario');
      toast.success('Usuario actualizado');
      router.push('/dashboard/users');
    } catch (error) {
      console.error('[EditUserPage] update error:', error);
      toast.error('Error al actualizar usuario');
    }
  };

  if (loadingUser) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
        <div className='max-w-6xl mx-auto'>
          <Card className='shadow-lg'>
            <CardContent className='p-6 flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Cargando usuario...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-4'>
            <Link href='/dashboard/users'>
              <Button variant='ghost' size='icon' aria-label='Volver a usuarios'>
                <ArrowLeft className='h-5 w-5' />
              </Button>
            </Link>
            <div>
              <h1 className='text-4xl font-bold text-slate-900'>Editar Usuario</h1>
              <p className='text-slate-600 mt-1'>Actualiza la informacion del usuario seleccionado</p>
            </div>
          </div>
        </div>

        {Boolean(userError) && (
          <Card className='mb-6 border-red-200 bg-red-50'>
            <CardContent className='pt-6 text-sm text-red-700'>No se pudo cargar el usuario.</CardContent>
          </Card>
        )}

        {Boolean(companiesError) && (
          <Card className='mb-6 border-amber-200 bg-amber-50'>
            <CardContent className='pt-6 text-sm text-amber-800'>
              No se pudieron cargar las empresas.
            </CardContent>
          </Card>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <Card className='lg:col-span-2 shadow-lg'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-blue-100 border-b'>
              <CardTitle className='text-2xl text-blue-900'>Datos del usuario</CardTitle>
              <CardDescription className='text-blue-700'>Edita toda la informacion disponible</CardDescription>
            </CardHeader>
            <CardContent className='pt-8'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName' className='text-sm font-semibold text-slate-700'>
                      Nombre *
                    </Label>
                    <Input
                      id='firstName'
                      name='firstName'
                      type='text'
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName' className='text-sm font-semibold text-slate-700'>
                      Apellido *
                    </Label>
                    <Input
                      id='lastName'
                      name='lastName'
                      type='text'
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-sm font-semibold text-slate-700'>
                    Email *
                  </Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                    required
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='phone' className='text-sm font-semibold text-slate-700'>
                      Telefono
                    </Label>
                    <Input
                      id='phone'
                      name='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={handleInputChange}
                      className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='role' className='text-sm font-semibold text-slate-700'>
                      Rol *
                    </Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger className='h-10 border-slate-200'>
                        <SelectValue placeholder='Selecciona un rol' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='admin'>admin</SelectItem>
                        <SelectItem value='customer'>customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='companyId' className='text-sm font-semibold text-slate-700'>
                    Empresa *
                  </Label>
                  <Select
                    value={formData.companyId ? formData.companyId.toString() : ''}
                    onValueChange={handleCompanyChange}
                    disabled={loadingCompanies}
                  >
                    <SelectTrigger className='h-10 border-slate-200'>
                      <SelectValue placeholder={loadingCompanies ? 'Cargando empresas...' : 'Selecciona una empresa'} />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address' className='text-sm font-semibold text-slate-700'>
                    Direccion
                  </Label>
                  <Textarea
                    id='address'
                    name='address'
                    value={formData.address}
                    onChange={handleInputChange}
                    className='border-slate-200 focus:border-blue-500 focus:ring-blue-500 min-h-24 resize-none'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-sm font-semibold text-slate-700'>
                      Nueva contrasena
                    </Label>
                    <Input
                      id='password'
                      name='password'
                      type='password'
                      value={formData.password}
                      onChange={handleInputChange}
                      className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      autoComplete='new-password'
                      placeholder='Deja en blanco para mantenerla'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword' className='text-sm font-semibold text-slate-700'>
                      Confirmar contrasena
                    </Label>
                    <Input
                      id='confirmPassword'
                      name='confirmPassword'
                      type='password'
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className='h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      autoComplete='new-password'
                      placeholder='Repite la nueva contrasena'
                    />
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-slate-700'>
                    Areas asociadas *
                  </Label>
                  {Boolean(areasError) && (
                    <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                      Error al cargar areas
                    </div>
                  )}
                  {!formData.companyId ? (
                    <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                      Selecciona una empresa para ver sus areas.
                    </div>
                  ) : loadingAreas ? (
                    <div className='text-sm text-muted-foreground'>Cargando areas...</div>
                  ) : companyAreas.length === 0 ? (
                    <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                      Esta empresa no tiene areas disponibles.
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {companyAreas.map((area) => {
                        const selected = formData.areaIds.includes(area.id);
                        return (
                          <Button
                            key={area.id}
                            type='button'
                            variant='outline'
                            onClick={() => toggleArea(area.id)}
                            className={
                              selected
                                ? 'h-10 justify-start border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                                : 'h-10 justify-start border-slate-200'
                            }
                          >
                            <span
                              className='mr-2 inline-block h-2.5 w-2.5 rounded-full'
                              style={{ backgroundColor: area.color || '#64748b' }}
                            />
                            <span className='truncate'>{area.name}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className='flex gap-3 pt-4'>
                  <Button
                    type='submit'
                    disabled={updateUserMutation.isPending}
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10'
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.push('/dashboard/users')}
                    className='h-10'
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className='shadow-lg h-fit'>
            <CardHeader className='bg-gradient-to-r from-amber-50 to-amber-100 border-b'>
              <CardTitle className='text-lg text-amber-900'>Informacion</CardTitle>
            </CardHeader>
            <CardContent className='pt-6 space-y-4'>
              <div>
                <p className='text-sm text-slate-500'>ID de usuario</p>
                <p className='font-semibold text-slate-900'>#{safeUserId}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Empresa</p>
                <p className='font-semibold text-slate-900'>{currentCompanyName || 'Sin empresa'}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Areas seleccionadas</p>
                <p className='font-semibold text-slate-900'>{selectedAreas.length}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Contraseña</p>
                <p className='font-semibold text-slate-900'>
                  {formData.password.trim() ? 'Se actualizara' : 'Sin cambios'}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Campos editables</p>
                <p className='text-sm text-slate-700'>
                  Puedes editar nombre, apellido, email, telefono, direccion, rol, empresa, areas y contraseña.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
