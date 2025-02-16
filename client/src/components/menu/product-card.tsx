import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface ProductCardProps {
  categoryId: number;
}

export default function ProductCard({ categoryId }: ProductCardProps) {
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [`/api/tenants/${user?.tenantId}/categories/${categoryId}/products`],
    enabled: !!user?.tenantId,
  });

  if (isLoading) {
    return <div>Cargando productos...</div>;
  }

  if (!products?.length) {
    return (
      <div className="col-span-full text-center py-4">
        <p className="text-muted-foreground">
          No hay productos en esta categoría.
        </p>
      </div>
    );
  }

  return (
    <>
      {products.map((product) => (
        <Card key={product.id}>
          {product.image && (
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <img
                src={product.image}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex justify-between items-start">
              <span>{product.name}</span>
              <span className="text-lg font-normal">
                ${product.basePrice}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {product.description}
            </p>
            <Button variant="outline" className="w-full">
              Ver detalles
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
