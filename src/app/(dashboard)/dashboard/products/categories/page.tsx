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
import { useCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '@/lib/api/hooks/useCategory';
import { Category } from '@/types/category';

interface FormData {
  name: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });

  const { data: categories = [] } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation(editingId || 0);
  const deleteMutation = useDeleteCategoryMutation(deleteId || 0);

  const filteredCategories = Array.isArray(categories) ? categories.filter((category: Category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor completa el nombre de la categoría');
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ name: formData.name });
      } else {
        await createMutation.mutateAsync({ name: formData.name });
      }

      // Reset form
      setFormData({ name: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        setDeleteId(id);
        await deleteMutation.mutateAsync();
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la categoría');
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
            <h1 className="text-base font-semibold">Categorías</h1>
          </div>
          <Button onClick={() => {
            setEditingId(null);
            setFormData({ name: '' });
            setShowForm(!showForm);
          }} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 p-8 bg-background">
        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editingId 
                  ? 'Actualiza los detalles de la categoría'
                  : 'Crea una nueva categoría de productos'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de Categoría *</label>
                <Input
                  placeholder="Ej: Frutas, Verduras, Lácteos..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={createMutation.isPending || updateMutation.isPending}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '' });
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
                    editingId ? 'Actualizar' : 'Crear Categoría'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Welcome Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-foreground">Gestión de Categorías</h2>
          <p className="text-lg text-muted-foreground">Administra todas las categorías de productos</p>
        </div>

        {/* Search */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoría..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Lista de Categorías</CardTitle>
              <span className="text-sm text-muted-foreground">{filteredCategories.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr className="border-b border-border">
                      <td colSpan={2} className="py-12 px-4 text-center text-sm text-muted-foreground">
                        No hay categorías disponibles
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category: Category) => (
                      <tr key={category.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-foreground">
                            {category.name}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
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
