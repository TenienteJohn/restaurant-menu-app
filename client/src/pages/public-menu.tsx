import { useQuery } from "@tanstack/react-query";
import { Category, Product, Tenant } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProductCard from "@/components/menu/product-card";

export default function PublicMenuPage() {
  // Obtener el subdominio de la URL actual
  const subdomain = window.location.hostname.split('.')[0];

  // Obtener información del tenant por subdominio
  const { data: tenant, isLoading: isLoadingTenant } = useQuery<Tenant>({
    queryKey: [`/api/public/tenant-by-subdomain/${subdomain}`],
    enabled: !!subdomain,
  });

  // Obtener categorías del tenant
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [`/api/public/categories/${tenant?.id}`],
    enabled: !!tenant?.id,
  });

  // Obtener todos los productos del tenant
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: [`/api/public/products/${tenant?.id}`],
    enabled: !!tenant?.id,
  });

  if (isLoadingTenant || isLoadingCategories || isLoadingProducts) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Cargando menú...</h2>
        <p className="text-muted-foreground">
          Por favor espere mientras cargamos la información.
        </p>
      </div>
    </div>;
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Comercio no encontrado</h2>
          <p className="text-muted-foreground">
            El comercio que buscas no existe o no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const { config } = tenant;

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">{tenant.name}</h1>
        {config.contactEmail && (
          <p className="text-muted-foreground mt-2">
            Contacto: {config.contactEmail}
          </p>
        )}
        {config.address && (
          <p className="text-muted-foreground">
            Dirección: {config.address}
          </p>
        )}
        {config.phone && (
          <p className="text-muted-foreground">
            Teléfono: {config.phone}
          </p>
        )}
      </div>

      {!categories.length ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-semibold mb-2">Menú no disponible</h2>
          <p className="text-muted-foreground">
            Este comercio aún no ha configurado su menú.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {categories.map((category) => {
            const categoryProducts = allProducts.filter(
              (product) => product.categoryId === category.id && product.active
            );

            if (!categoryProducts.length) {
              return null; // No mostrar categorías vacías
            }

            return (
              <AccordionItem key={category.id} value={`category-${category.id}`}>
                <AccordionTrigger className="text-xl font-medium">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent>
                  {category.description && (
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                  )}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
                    {categoryProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}