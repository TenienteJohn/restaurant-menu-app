import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, UserPlus } from "lucide-react";
import { insertTenantSchema, insertUserSchema, type Tenant, type User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TenantsPage() {
  const { toast } = useToast();
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const tenantForm = useForm({
    resolver: zodResolver(insertTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      active: true,
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof tenantForm.getValues) => {
      const res = await apiRequest("POST", "/api/tenants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      tenantForm.reset();
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

  const createUserMutation = useMutation({
    mutationFn: async ({
      tenantId,
      data,
    }: {
      tenantId: number;
      data: typeof userForm.getValues;
    }) => {
      const res = await apiRequest("POST", `/api/tenants/${tenantId}/users`, data);
      return res.json();
    },
    onSuccess: (user: User) => {
      toast({
        title: "Usuario creado",
        description: `Se ha creado el usuario ${user.username}`,
      });
      userForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const userForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
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
              onSubmit={tenantForm.handleSubmit((data) =>
                createTenantMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Nombre del Comercio</Label>
                <Input id="name" {...tenantForm.register("name")} />
              </div>

              <div>
                <Label htmlFor="subdomain">Subdominio</Label>
                <Input id="subdomain" {...tenantForm.register("subdomain")} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" {...tenantForm.register("active")} />
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tenant.active}
                        disabled
                        aria-label="Estado del comercio"
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear Usuario para {tenant.name}</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={userForm.handleSubmit((data) =>
                              createUserMutation.mutate({ tenantId: tenant.id, data })
                            )}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="username">Nombre de Usuario</Label>
                              <Input
                                id="username"
                                {...userForm.register("username")}
                              />
                            </div>
                            <div>
                              <Label htmlFor="password">Contraseña</Label>
                              <Input
                                id="password"
                                type="password"
                                {...userForm.register("password")}
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={createUserMutation.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Crear Usuario
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
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