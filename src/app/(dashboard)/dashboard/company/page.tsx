'use client';

import React, { Suspense, useState } from 'react';
import { Building2, Edit2, Palette, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useAreasQuery,
  useCreateAreaMutation,
  useDeleteAreaMutation,
  useUpdateAreaMutation,
} from '@/lib/api/hooks/useArea';
import {
  useCompaniesQuery,
  useCreateCompanyMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
} from '@/lib/api/hooks/useCompany';
import { colorOptions } from '@/lib/constants/color-options';
import { Area } from '@/types/area';
import { Company } from '@/types/company';

interface CompanyFormData {
  companyName: string;
  companyColor: string;
}

interface AreaFormData {
  areaName: string;
  areaColor: string;
  companyId: string;
}

type ModalType = 'company-create' | 'company-edit' | 'area-create' | 'area-edit' | null;

const Loading = () => null;

export default function AreasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({
    companyName: '',
    companyColor: '#8CC63F',
  });

  const [areaFormData, setAreaFormData] = useState<AreaFormData>({
    areaName: '',
    areaColor: '#1976D2',
    companyId: '',
  });

  const { data: areas = [] } = useAreasQuery();
  const { data: companies = [] } = useCompaniesQuery();

  const createAreaMutation = useCreateAreaMutation();
  const createCompanyMutation = useCreateCompanyMutation();
  const updateCompanyMutation = useUpdateCompanyMutation(editingCompany?.id ?? 0);
  const updateAreaMutation = useUpdateAreaMutation(editingArea?.id ?? 0);
  const deleteCompanyMutation = useDeleteCompanyMutation(companyToDelete?.id ?? 0);
  const deleteAreaMutation = useDeleteAreaMutation(areaToDelete?.id ?? 0);

  const allColorsFlat = Object.values(colorOptions).flat();

  const filteredAreas = Array.isArray(areas)
    ? areas.filter((area: Area) => area.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const filteredCompanies = Array.isArray(companies)
    ? companies.filter((company: Company) => {
      const companyNameMatch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
      const areaNameMatch = areas.some(
        (area: Area) =>
          area.companyId === company.id &&
          area.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return companyNameMatch || areaNameMatch;
    })
    : [];

  const resetCompanyForm = () => {
    setCompanyFormData({
      companyName: '',
      companyColor: '#8CC63F',
    });
  };

  const resetAreaForm = (selectedCompanyId?: number) => {
    setAreaFormData({
      areaName: '',
      areaColor: '#1976D2',
      companyId: selectedCompanyId ? String(selectedCompanyId) : '',
    });
  };

  const closeModal = () => {
    setModalType(null);
    setEditingCompany(null);
    setEditingArea(null);
    resetCompanyForm();
    resetAreaForm();
  };

  const handleOpenCompanyCreate = () => {
    setModalType('company-create');
    setEditingCompany(null);
    resetCompanyForm();
  };

  const handleOpenAreaCreate = (companyId?: number) => {
    setModalType('area-create');
    setEditingArea(null);
    resetAreaForm(companyId);
  };

  const handleOpenCompanyEdit = (company: Company) => {
    setEditingCompany(company);
    setCompanyFormData({
      companyName: company.name,
      companyColor: company.color,
    });
    setModalType('company-edit');
  };

  const handleOpenAreaEdit = (area: Area) => {
    setEditingArea(area);
    setAreaFormData({
      areaName: area.name,
      areaColor: area.color ?? '#1976D2',
      companyId: String(area.companyId),
    });
    setModalType('area-edit');
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalType === 'company-edit' && editingCompany) {
        await updateCompanyMutation.mutateAsync({
          name: companyFormData.companyName.trim(),
          color: companyFormData.companyColor,
        });
        toast.success('Empresa actualizada');
        closeModal();
        return;
      }

      const newCompany = await createCompanyMutation.mutateAsync({
        name: companyFormData.companyName.trim(),
        color: companyFormData.companyColor,
      });

      toast.success('Empresa creada');

      if (newCompany?.id) {
        handleOpenAreaCreate(newCompany.id);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('No se pudo guardar la empresa');
    }
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!areaFormData.companyId) {
      toast.error('Selecciona una empresa para el area');
      return;
    }

    try {
      if (modalType === 'area-edit' && editingArea) {
        await updateAreaMutation.mutateAsync({
          name: areaFormData.areaName.trim(),
          color: areaFormData.areaColor,
          companyId: Number(areaFormData.companyId),
        });

        toast.success('Area actualizada');
        closeModal();
        return;
      }

      await createAreaMutation.mutateAsync({
        name: areaFormData.areaName.trim(),
        color: areaFormData.areaColor,
        companyId: Number(areaFormData.companyId),
      });

      toast.success('Area creada');
      setAreaFormData({
        areaName: '',
        areaColor: areaFormData.areaColor,
        companyId: areaFormData.companyId,
      });
    } catch (error) {
      console.error('Error saving area:', error);
      toast.error('No se pudo guardar el area');
    }
  };

  const handleDeleteArea = async (area: Area) => {
    try {
      setAreaToDelete(area);
      await deleteAreaMutation.mutateAsync();
      toast.success('Area eliminada');
    } catch (error) {
      console.error('Error deleting area:', error);
      toast.error('No se pudo eliminar el area');
    } finally {
      setAreaToDelete(null);
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    const hasAreas = areas.some((area) => area.companyId === company.id);
    if (hasAreas) {
      toast.error('Primero elimina o mueve las areas de esta empresa');
      return;
    }

    try {
      setCompanyToDelete(company);
      await deleteCompanyMutation.mutateAsync();
      toast.success('Empresa eliminada');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('No se pudo eliminar la empresa');
    } finally {
      setCompanyToDelete(null);
    }
  };

  const isSavingCompany = createCompanyMutation.isPending || updateCompanyMutation.isPending;
  const isSavingArea = createAreaMutation.isPending || updateAreaMutation.isPending;

  const selectedCompanyForArea = companies.find((company) => String(company.id) === areaFormData.companyId);

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col gap-6 bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
          <div className="flex items-center gap-2 px-6 w-full justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <h1 className="text-base font-semibold">Areas</h1>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleOpenCompanyCreate} variant="outline" className="gap-2">
                <Building2 className="w-4 h-4" />
                Nueva Empresa
              </Button>
              <Button onClick={() => handleOpenAreaCreate()} className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Area
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground">Gestion de Empresas y Areas</h2>
            <p className="text-lg text-muted-foreground">
              Flujo recomendado: Paso 1 crea la empresa, Paso 2 crea todas sus areas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">{filteredCompanies.length}</div>
                <p className="text-xs text-muted-foreground">Registradas en el sistema</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Areas</CardTitle>
                <div className="p-3 bg-green-100 rounded-full">
                  <Palette className="w-5 h-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-foreground">{filteredAreas.length}</div>
                <p className="text-xs text-muted-foreground">Activas en empresas</p>
              </CardContent>
            </Card>
          </div>

          {modalType && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <Card className="w-full max-w-2xl border shadow-lg my-auto">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-background border-b">
                  <CardTitle>
                    {modalType === 'company-create' && 'Paso 1: Crear Empresa'}
                    {modalType === 'company-edit' && 'Editar Empresa'}
                    {modalType === 'area-create' && 'Paso 2: Crear Area'}
                    {modalType === 'area-edit' && 'Editar Area'}
                  </CardTitle>
                  <button
                    onClick={closeModal}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </CardHeader>

                <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {(modalType === 'company-create' || modalType === 'company-edit') && (
                    <form onSubmit={handleCompanySubmit} className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Informacion de Empresa
                        </h3>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nombre</label>
                          <Input
                            placeholder="Ej: Fruteria Central"
                            value={companyFormData.companyName}
                            onChange={(e) => setCompanyFormData({ ...companyFormData, companyName: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Selecciona Color</label>
                          <div className="grid grid-cols-8 gap-2">
                            {allColorsFlat.map((color, index) => (
                              <button
                                key={`company-color-${index}`}
                                type="button"
                                onClick={() => setCompanyFormData({ ...companyFormData, companyColor: color })}
                                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                                  companyFormData.companyColor === color
                                    ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground'
                                    : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: companyFormData.companyColor }} />
                            <span className="text-sm text-muted-foreground">{companyFormData.companyColor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={closeModal} type="button">
                          Cancelar
                        </Button>
                        <Button type="submit" className="gap-2" disabled={isSavingCompany}>
                          <Plus className="w-4 h-4" />
                          {modalType === 'company-edit' ? 'Guardar Empresa' : 'Crear y continuar al Paso 2'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {(modalType === 'area-create' || modalType === 'area-edit') && (
                    <form onSubmit={handleAreaSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Informacion de Area
                        </h3>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Empresa</label>
                          <select
                            className="w-full h-10 rounded-md border border-input px-3 text-sm"
                            value={areaFormData.companyId}
                            onChange={(e) => setAreaFormData({ ...areaFormData, companyId: e.target.value })}
                            required
                          >
                            <option value="">Selecciona una empresa</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                          {selectedCompanyForArea ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: selectedCompanyForArea.color }} />
                              <span>{selectedCompanyForArea.name}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nombre</label>
                          <Input
                            placeholder="Ej: Logistica"
                            value={areaFormData.areaName}
                            onChange={(e) => setAreaFormData({ ...areaFormData, areaName: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Selecciona Color</label>
                          <div className="grid grid-cols-8 gap-2">
                            {allColorsFlat.map((color, index) => (
                              <button
                                key={`area-color-${index}`}
                                type="button"
                                onClick={() => setAreaFormData({ ...areaFormData, areaColor: color })}
                                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                                  areaFormData.areaColor === color
                                    ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-foreground'
                                    : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: areaFormData.areaColor }} />
                            <span className="text-sm text-muted-foreground">{areaFormData.areaColor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={closeModal} type="button">
                          Cancelar
                        </Button>
                        <Button type="submit" className="gap-2" disabled={isSavingArea}>
                          <Plus className="w-4 h-4" />
                          {modalType === 'area-edit' ? 'Guardar Area' : 'Guardar Area y crear otra'}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas o areas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>Empresas Registradas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No hay empresas registradas</div>
                ) : (
                  filteredCompanies.map((company: Company) => {
                    const companyAreas = areas.filter((area) => area.companyId === company.id);
                    const totalAreas = companyAreas.length;
                    return (
                      <div
                        key={company.id}
                        className="p-4 border border-border rounded-lg hover:shadow-md transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className="w-6 h-6 rounded flex-shrink-0"
                                style={{ backgroundColor: company.color }}
                              />
                              <div>
                                <h4 className="font-semibold">{company.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {totalAreas} area{totalAreas === 1 ? '' : 's'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {companyAreas.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Sin areas registradas</p>
                            ) : (
                              companyAreas.map((area) => (
                                <div
                                  key={area.id}
                                  className="flex items-center justify-between rounded-md border px-2 py-1.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: area.color }} />
                                    <span className="text-sm">{area.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => handleOpenAreaEdit(area)}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteArea(area)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleOpenCompanyEdit(company)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleOpenAreaCreate(company.id)}
                            >
                              <Plus className="w-4 h-4" />
                              Agregar Area
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCompany(company)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Suspense>
  );
}
