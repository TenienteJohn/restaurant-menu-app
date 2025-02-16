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
import { Plus } from "lucide-react";

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

  const form = useForm({
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

  const updateConfigMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
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
    mutationFn: async (data: typeof categoryForm.getValues) => {
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

  const createProductMutation = useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: number; data: typeof productForm.getValues }) => {
      const res = await apiRequest(
        "POST",
        `/api/tenants/${user?.tenantId}/categories/${categoryId}/products`,
        data
      );
      return res.json();
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
              onSubmit={form.handleSubmit((data) => updateConfigMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email de Contacto</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("config.contactEmail")}
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...form.register("config.address")}
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...form.register("config.phone")}
                />
              </div>

              <Button 
                type="submit" 
                disabled={updateConfigMutation.isPending}
              >
                Guardar Cambios
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
                  onSubmit={categoryForm.handleSubmit((data) =>
                    createCategoryMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" {...categoryForm.register("name")} />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Input id="description" {...categoryForm.register("description")} />
                  </div>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending}
                  >
                    Crear Categoría
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
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Agregar Producto a {category.name}</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={productForm.handleSubmit((data) =>
                                createProductMutation.mutate({ categoryId: category.id, data })
                              )}
                              className="space-y-4"
                            >
                              <div>
                                <Label htmlFor="productName">Nombre</Label>
                                <Input id="productName" {...productForm.register("name")} />
                              </div>
                              <div>
                                <Label htmlFor="productDescription">Descripción</Label>
                                <Input
                                  id="productDescription"
                                  {...productForm.register("description")}
                                />
                              </div>
                              <div>
                                <Label htmlFor="basePrice">Precio Base</Label>
                                <Input
                                  id="basePrice"
                                  type="number"
                                  step="0.01"
                                  {...productForm.register("basePrice")}
                                />
                              </div>
                              <Button
                                type="submit"
                                disabled={createProductMutation.isPending}
                              >
                                Crear Producto
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {/* Lista de productos aquí */}
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