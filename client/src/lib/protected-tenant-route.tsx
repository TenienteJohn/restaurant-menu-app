import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";

export function ProtectedTenantRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user } = useAuth();

  if (!user?.tenantId) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
