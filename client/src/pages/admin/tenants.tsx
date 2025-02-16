import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { insertTenantSchema, type Tenant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TenantsPage() {
  const { toast } = useToast();
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const form = useForm({
    resolver: zodResolver(insertTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      active: true,
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/tenants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      form.reset();
      toast({
        title: "Tenant creado",
        description: "El tenant se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear tenant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Comercios</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Comercio</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => createTenantMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Nombre del Comercio</Label>
                <Input id="name" {...form.register("name")} />
              </div>
              
              <div>
                <Label htmlFor="subdomain">Subdominio</Label>
                <Input id="subdomain" {...form.register("subdomain")} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" {...form.register("active")} />
                <Label htmlFor="active">Activo</Label>
              </div>

              <Button type="submit" disabled={createTenantMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Comercio
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comercios Existentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Cargando...</div>
            ) : !tenants?.length ? (
              <div>No hay comercios registrados</div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded"
                  >
                    <div>
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tenant.subdomain}.ejemplo.com
                      </p>
                    </div>
                    <Switch
                      checked={tenant.active}
                      disabled
                      aria-label="Estado del comercio"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
