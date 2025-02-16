import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateTenantConfigSchema, type Tenant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TenantSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: [`/api/tenants/${user?.tenantId}/settings`],
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

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Comercio</CardTitle>
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
    </div>
  );
}
