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
import { Plus, Loader2 } from "lucide-react";

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
      console.log("Enviando datos de categoría:", data);
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
      console.error("Error al crear categoría:", error);
      toast({
        title: "Error al crear categoría",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = (formData: any) => {
    console.log("Form data:", formData);
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

    console.log("Datos de categoría a enviar:", categoryData);
    createCategoryMutation.mutate(categoryData);
  };

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
                    <div className="pt-4">
                      <p className="text-muted-foreground">
                        {category.description}
                      </p>
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