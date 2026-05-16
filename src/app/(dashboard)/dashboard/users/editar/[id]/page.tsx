'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useUpdateUserMutation, useUserQuery } from '@/lib/api/hooks/useUsers';
import type { Area } from '@/types/area';
import type { UpdateUserDto, UserRole } from '@/types/users';

interface EditUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  areaIds: number[];
}

const emptyForm: EditUserForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  role: 'customer',
  areaIds: [],
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);
  const safeUserId = Number.isFinite(userId) && userId > 0 ? userId : null;

  const [formData, setFormData] = useState<EditUserForm>(emptyForm);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data: user, isLoading: loadingUser, error: userError } = useUserQuery(safeUserId);
  const { data: allAreasData, isLoading: loadingAreas, error: areasError } = useAreasQuery({
    page: 1,
    limit: 500,
  });
  const updateUserMutation = useUpdateUserMutation(safeUserId ?? 0);

  const allAreas = useMemo<Area[]>(() => {
    if (!allAreasData) return [];
    if (Array.isArray(allAreasData)) return allAreasData;
    return [];
  }, [allAreasData]);

  const currentUserAreaIds = useMemo<number[]>(() => {
    if (!user) return [];

    const candidateIds = Array.isArray(user.areaIds) ? user.areaIds : [];
    if (candidateIds.length > 0) return candidateIds;

    const areasFromUser = (user as { areas?: Array<{ id: number }> }).areas;
    if (Array.isArray(areasFromUser) && areasFromUser.length > 0) {
      return areasFromUser.map((area) => area.id).filter((id) => Number.isFinite(id));
    }

    return [];
  }, [user]);

  useEffect(() => {
    if (!user || hasInitialized) return;
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'customer',
      areaIds: currentUserAreaIds,
    });
    setHasInitialized(true);
  }, [currentUserAreaIds, hasInitialized, user]);

  const associatedAreas = useMemo<Area[]>(() => {
    if (formData.areaIds.length === 0) return [];
    const byId = new Map<number, Area>();
    allAreas.forEach((area) => byId.set(area.id, area));
    return formData.areaIds
      .map((id) => byId.get(id))
      .filter((area): area is Area => Boolean(area));
  }, [allAreas, formData.areaIds]);

  const orphanAreaIds = useMemo(() => {
    const knownIds = new Set(associatedAreas.map((a) => a.id));
    return formData.areaIds.filter((id) => !knownIds.has(id));
  }, [associatedAreas, formData.areaIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
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
    if (formData.areaIds.length === 0) {
      toast.error('Debe quedar al menos un area asignada');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeUserId) {
      toast.error('ID de usuario invalido');
      return;
    }
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

  if (!safeUserId) {
    return (
      <div className='min-h-screen p-6'>
        <Card className='max-w-3xl mx-auto'>
          <CardContent className='p-6 text-red-700'>ID de usuario invalido.</CardContent>
        </Card>
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

        {userError && (
          <Card className='mb-6 border-red-200 bg-red-50'>
            <CardContent className='pt-6 text-sm text-red-700'>
              No se pudo cargar el usuario.
            </CardContent>
          </Card>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <Card className='lg:col-span-2 shadow-lg'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-blue-100 border-b'>
              <CardTitle className='text-2xl text-blue-900'>Datos del usuario</CardTitle>
              <CardDescription className='text-blue-700'>
                Edita toda la informacion disponible
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-8'>
              {loadingUser ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Cargando usuario...
                </div>
              ) : (
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

                  <div className='space-y-3'>
                    <Label className='text-sm font-semibold text-slate-700'>
                      Areas asociadas *
                    </Label>
                    {areasError && (
                      <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                        Error al cargar areas
                      </div>
                    )}
                    {loadingAreas ? (
                      <div className='text-sm text-muted-foreground'>Cargando areas...</div>
                    ) : associatedAreas.length === 0 ? (
                      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600'>
                        Este usuario no tiene areas asociadas.
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        {associatedAreas.map((area) => {
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
                        {orphanAreaIds.map((id) => (
                          <Button
                            key={id}
                            type='button'
                            variant='outline'
                            onClick={() => toggleArea(id)}
                            className='h-10 justify-start border-amber-300 text-amber-700'
                          >
                            <span className='truncate'>{`Area #${id}`}</span>
                          </Button>
                        ))}
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
              )}
            </CardContent>
          </Card>

          <Card className='shadow-lg h-fit'>
            <CardHeader className='bg-gradient-to-r from-amber-50 to-amber-100 border-b'>
              <CardTitle className='text-lg text-amber-900'>Informacion</CardTitle>
            </CardHeader>
            <CardContent className='pt-6 space-y-4'>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <h3 className='font-semibold text-blue-900 mb-2'>Campos editables</h3>
                <p className='text-sm text-blue-800'>
                  Puedes editar nombre, apellido, email, telefono, direccion, rol y areas del usuario.
                </p>
              </div>
              <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                <h3 className='font-semibold text-green-900 mb-2'>Areas</h3>
                <p className='text-sm text-green-800'>
                  Solo se muestran las areas actualmente asociadas al usuario.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
