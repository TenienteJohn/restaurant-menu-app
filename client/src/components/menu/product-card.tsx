import { Plus } from "lucide-react";
import { Product } from "@shared/schema";
import { Card } from "@/components/ui/card";

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  isEditable?: boolean;
}

export default function ProductCard({ product, onAddToCart, isEditable }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group relative">
      {/* Botón de agregar al carrito - solo se muestra si no es editable */}
      {!isEditable && onAddToCart && (
        <button
          onClick={onAddToCart}
          className="absolute top-4 right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground transform transition-transform hover:scale-110 z-10"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Contenedor de imagen */}
      <div className="aspect-video relative overflow-hidden">
        {product?.image ? (
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
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
            {product.description}
          </p>
        )}

        {/* Precio */}
        <div className="flex justify-between items-center">
          <span className="font-medium">
            $ {parseFloat(product.basePrice).toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}