import { Plus } from "lucide-react";
import { Product, ProductVariant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  variants?: ProductVariant[];
  onAddToCart?: () => void;
}

export default function ProductCard({ product, variants, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group relative">
      {/* Botón de agregar al carrito */}
      <button
        onClick={onAddToCart}
        className="absolute top-4 right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground transform transition-transform hover:scale-110 z-10"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Contenedor de imagen */}
      <div className="aspect-video relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-medium text-lg truncate">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
          {product.description}
        </p>

        {/* Precios */}
        <div className="space-y-1">
          {variants?.length ? (
            variants.map((variant) => (
              <div key={variant.id} className="flex justify-between items-center text-sm">
                <span>{variant.name}:</span>
                <span className="font-medium">$ {variant.price.toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between items-center">
              <span className="font-medium">
                $ {product.basePrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}