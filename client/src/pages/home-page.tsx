import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Bienvenido {user?.username}</h1>
          <div className="flex gap-4">
            {user?.isSuperAdmin && (
              <Button asChild>
                <Link href="/admin/tenants">
                  <Building2 className="w-4 h-4 mr-2" />
                  Gestionar Comercios
                </Link>
              </Button>
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
              Utiliza el botón "Gestionar Comercios" para crear y administrar los tenants.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Panel de Comercio</h2>
            <p className="text-muted-foreground">
              Bienvenido a tu panel de comercio. Aquí podrás gestionar tu negocio y acceder
              a todas las funcionalidades disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}