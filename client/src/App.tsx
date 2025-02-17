import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TenantsPage from "@/pages/admin/tenants";
import TenantSettingsPage from "@/pages/tenant/settings";
import MenuPage from "@/pages/tenant/menu";
import PublicMenuPage from "@/pages/public-menu";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { ProtectedAdminRoute } from "./lib/protected-admin-route";
import { ProtectedTenantRoute } from "./lib/protected-tenant-route";

function Router() {
  // Verificar si estamos en un subdominio:
  // - En desarrollo: subdominio.localhost (3 partes)
  // - En producción: subdominio.repl-id.repl.dev (4 partes)
  const hostnameParts = window.location.hostname.split('.');
  const isSubdomain = hostnameParts.length > 2 && hostnameParts[0] !== 'www';

  // Si estamos en un subdominio, mostrar el menú público
  if (isSubdomain) {
    return <PublicMenuPage />;
  }

  // Si no estamos en un subdominio, mostrar la aplicación principal
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedAdminRoute path="/admin/tenants" component={TenantsPage} />
      <ProtectedTenantRoute path="/tenant/settings" component={TenantSettingsPage} />
      <ProtectedTenantRoute path="/tenant/menu" component={MenuPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}