import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, LogOut, Settings, MenuSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Tenant } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
    enabled: user?.isSuperAdmin,
  });

  const handleTenantChange = (subdomain: string) => {
    // Guardar el subdominio seleccionado
    localStorage.setItem("selected-tenant", subdomain);
    // Recargar la página para aplicar el nuevo subdominio
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Bienvenido {user?.username}</h1>
          <div className="flex gap-4">
            {user?.isSuperAdmin && (
              <>
                <Select
                  onValueChange={handleTenantChange}
                  defaultValue={localStorage.getItem("selected-tenant") || "development"}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar comercio" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.subdomain}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild>
                  <Link href="/admin/tenants">
                    <Building2 className="w-4 h-4 mr-2" />
                    Gestionar Comercios
                  </Link>
                </Button>
              </>
            )}
            {user?.tenantId && (
              <>
                <Button asChild variant="secondary">
                  <Link href="/tenant/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración del Comercio
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/tenant/menu">
                    <MenuSquare className="w-4 h-4 mr-2" />
                    Ver Menú
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {user?.isSuperAdmin ? (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Panel de Administración</h2>
            <p className="text-muted-foreground">
              Como superadministrador, puedes gestionar todos los comercios de la plataforma.
              Utiliza el selector arriba para cambiar entre comercios o el botón "Gestionar Comercios" 
              para crear y administrar los tenants.
            </p>
          </div>
        ) : user?.tenantId ? (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Panel de Comercio</h2>
            <p className="text-muted-foreground">
              Bienvenido a tu panel de comercio. Aquí podrás gestionar tu negocio y acceder
              a todas las funcionalidades disponibles. Usa el botón "Ver Menú" para acceder
              al menú digital de tu comercio.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Usuario sin Comercio Asignado</h2>
            <p className="text-muted-foreground">
              Actualmente no estás asignado a ningún comercio. Contacta con un administrador
              para que te asigne a tu comercio correspondiente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}