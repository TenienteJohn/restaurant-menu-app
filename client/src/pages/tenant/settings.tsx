import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateTenantConfigSchema, insertCategorySchema, insertProductSchema, type Tenant, type Category, type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Loader2, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import React from 'react';

export default function TenantSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tenant, isLoading: isLoadingTenant } = useQuery<Tenant>({
    queryKey: [`/api/tenants/${user?.tenantId}/settings`],
    enabled: !!user?.tenantId,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [`/api/tenants/${user?.tenantId}/categories`],
    enabled: !!user?.tenantId,
  });

  const configForm = useForm({
    resolver: zodResolver(updateTenantConfigSchema),
    defaultValues: {
      config: tenant?.config || {
        theme: "light",
        logo: null,
        contactEmail: null,
        address: null,
        phone: null,
      },
    },
  });

  const categoryForm = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: null,
      order: 0,
      active: true,
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: { config: Tenant["config"] }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/tenants/${user?.tenantId}/settings`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${user?.tenantId}/settings`]
      });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: Category) => {
      const res = await apiRequest(
        "POST",
        `/api/tenants/${user?.tenantId}/categories`,
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${user?.tenantId}/categories`],
      });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente",
      });
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear categoría",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = (formData: any) => {
    if (!user?.tenantId) {
      toast({
        title: "Error",
        description: "No se encontró el ID del tenant",
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      ...formData,
      tenantId: user.tenantId,
      active: true,
      order: 0,
      description: formData.description || null,
      image: formData.image || null,
    };

    createCategoryMutation.mutate(categoryData);
  };

  const productForm = useForm({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      image: null,
      basePrice: "0",
      order: 0,
      active: true,
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "La imagen no puede ser mayor a 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        productForm.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createProductMutation = useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: number; data: any }) => {
      try {
        const formattedData = {
          ...data,
          basePrice: parseFloat(data.basePrice),
          tenantId: user?.tenantId,
          categoryId,
        };

        const res = await apiRequest(
          "POST",
          `/api/tenants/${user?.tenantId}/categories/${categoryId}/products`,
          formattedData
        );

        if (!res.ok) {
          throw new Error("Error al crear el producto");
        }

        return res.json();
      } catch (error) {
        console.error("Error creating product:", error);
        throw error;
      }
    },
    onSuccess: (_, { categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/tenants/${user?.tenantId}/categories/${categoryId}/products`],
      });
      toast({
        title: "Producto creado",
        description: "El producto se ha creado correctamente",
      });
      productForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear producto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingTenant || isLoadingCategories) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={configForm.handleSubmit((data) => updateConfigMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  {...configForm.register("config.contactEmail")}
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...configForm.register("config.address")}
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...configForm.register("config.phone")}
                />
              </div>

              <Button
                type="submit"
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Gestión del Menú */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gestión del Menú</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Categoría</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={categoryForm.handleSubmit(handleCreateCategory)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      {...categoryForm.register("name")}
                    />
                    {categoryForm.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {categoryForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      {...categoryForm.register("description")}
                    />
                    {categoryForm.formState.errors.description && (
                      <p className="text-sm text-red-500">
                        {categoryForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Categoría"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {categories.map((category) => (
                <AccordionItem key={category.id} value={`category-${category.id}`}>
                  <AccordionTrigger className="text-xl font-medium">
                    {category.name}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Productos</h3>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Nuevo Producto
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Agregar Producto a {category.name}</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={productForm.handleSubmit((data) =>
                                createProductMutation.mutate({
                                  categoryId: category.id,
                                  data: {
                                    ...data,
                                    basePrice: parseFloat(data.basePrice),
                                  } as Product
                                })
                              )}
                              className="space-y-4"
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="productName">Nombre del Producto</Label>
                                  <Input
                                    id="productName"
                                    {...productForm.register("name")}
                                    placeholder="Ej: Hamburguesa Clásica"
                                  />
                                  {productForm.formState.errors.name && (
                                    <p className="text-sm text-red-500">
                                      {productForm.formState.errors.name.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="basePrice">Precio Base</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5">$</span>
                                    <Input
                                      id="basePrice"
                                      type="number"
                                      step="0.01"
                                      className="pl-7"
                                      {...productForm.register("basePrice")}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="productDescription">Descripción</Label>
                                <Textarea
                                  id="productDescription"
                                  {...productForm.register("description")}
                                  placeholder="Breve descripción del producto..."
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="productImage">Imagen del Producto</Label>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleImageUpload} 
                                  className="hidden" 
                                  id="productImage"
                                />
                                <label htmlFor="productImage" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer">
                                  {productForm.watch("image") ? (
                                    <img src={productForm.watch("image")} alt="Vista previa" className="max-h-full max-w-full object-cover" />
                                  ) : (
                                    <>
                                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                      <p className="text-sm text-muted-foreground">
                                        Arrastra una imagen aquí o haz clic para seleccionar
                                      </p>
                                    </>
                                  )}
                                </label>
                              </div>

                              <Button
                                type="submit"
                                className="w-full"
                                disabled={createProductMutation.isPending}
                              >
                                {createProductMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creando Producto...
                                  </>
                                ) : (
                                  "Crear Producto"
                                )}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Lista de productos aquí */}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* ProductCard components will go here */}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}