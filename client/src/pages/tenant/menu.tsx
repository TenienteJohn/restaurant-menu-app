import { useQuery } from "@tanstack/react-query";
import { Category, Product } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import ProductCard from "@/components/menu/product-card";

export default function MenuPage() {
  const { user } = useAuth();

  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [`/api/tenants/${user?.tenantId}/categories`],
    enabled: !!user?.tenantId,
  });

  const getProducts = (categoryId: number) => {
    return useQuery<Product[]>({
      queryKey: [`/api/tenants/${user?.tenantId}/categories/${categoryId}/products`],
      enabled: !!user?.tenantId && !!categoryId,
    });
  };

  if (isLoadingCategories) {
    return <div>Cargando menú...</div>;
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2">No hay categorías disponibles</h2>
        <p className="text-muted-foreground">
          Agrega categorías desde el panel de configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Nuestro Menú</h1>

      <Accordion type="single" collapsible className="w-full">
        {categories.map((category) => {
          const { data: products = [], isLoading: isLoadingProducts } = getProducts(category.id);

          return (
            <AccordionItem key={category.id} value={`category-${category.id}`}>
              <AccordionTrigger className="text-xl font-medium">
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
                  {isLoadingProducts ? (
                    <div>Cargando productos...</div>
                  ) : !products.length ? (
                    <div>No hay productos en esta categoría</div>
                  ) : (
                    products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product}
                      />
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}