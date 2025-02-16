import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Welcome {user?.username}</h1>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>

        {user?.isSuperAdmin ? (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Tenant Management</h2>
            {/* Add tenant management UI here */}
          </div>
        ) : (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Tenant Dashboard</h2>
            {/* Add tenant-specific dashboard here */}
          </div>
        )}
      </div>
    </div>
  );
}
