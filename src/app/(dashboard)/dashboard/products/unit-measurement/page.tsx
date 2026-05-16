'use client';

import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUnitMeasurementsQuery, useCreateUnitMeasurementMutation, useUpdateUnitMeasurementMutation, useDeleteUnitMeasurementMutation } from '@/lib/api/hooks/useUnitMeasurement';
import { UnitMeasurement } from '@/types/unit-measurement';

interface FormData {
  name: string;
  description: string;
}

export default function UnitMeasurementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });

  const { data: unitMeasurements = [] } = useUnitMeasurementsQuery();
  const createMutation = useCreateUnitMeasurementMutation();
  const updateMutation = useUpdateUnitMeasurementMutation(editingId || 0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteUnitMeasurementMutation(deleteId || 0);

  const filteredUnitMeasurements = Array.isArray(unitMeasurements) ? unitMeasurements.filter((unit: UnitMeasurement) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.description && unit.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor completa el nombre de la unidad de medida');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          description: formData.description || undefined,
        });
      }

      // Reset form
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la unidad de medida');
    }
  };

  const handleEdit = (unit: UnitMeasurement) => {
    setFormData({
      name: unit.name,
      description: unit.description || '',
    });
    setEditingId(unit.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta unidad de medida?')) {
      try {
        setDeleteId(id);
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la unidad de medida');
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-background">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white border-b border-border">
        <div className="flex items-center gap-2 px-6 w-full justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <h1 className="text-base font-semibold">Unidades de Medida</h1>
          </div>
          <Button onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '' });
            setShowForm(!showForm);
          }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Unidad
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Actualiza los detalles de la unidad de medida'
                  : 'Crea una nueva unidad de medida para los productos'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Kg, L, Unidades, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={createMutation.isPending || updateMutation.isPending}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  placeholder="Ej: Kilogramos, Litros, Unidades, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', description: '' });
                  }}
                  type="button"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingId ? 'Actualizar' : 'Crear Unidad'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Welcome Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Gestión de Unidades de Medida</h2>
          <p className="text-lg text-muted-foreground">Administra todas las unidades de medida de tus productos</p>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar unidad de medida..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Unit Measurements Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lista de Unidades de Medida</CardTitle>
              <span className="text-sm text-muted-foreground">{filteredUnitMeasurements.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Descripción</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnitMeasurements.length === 0 ? (
                    <tr className="border-b border-border">
                      <td colSpan={3} className="py-12 px-4 text-center text-sm text-muted-foreground">
                        No hay unidades de medida disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredUnitMeasurements.map((unit: UnitMeasurement) => (
                      <tr key={unit.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-foreground">
                            {unit.name}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-muted-foreground">
                            {unit.description || '-'}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(unit)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(unit.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
