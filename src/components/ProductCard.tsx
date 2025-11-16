import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  title: string;
  price: string;
  image_url: string;
  product_url: string;
  store_name: string;
  item_type: string;
  suggestion_text: string;
}

export const ProductCard = ({ 
  title, 
  price, 
  image_url, 
  product_url, 
  store_name,
  item_type,
  suggestion_text 
}: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group">
      <div className="aspect-square relative bg-muted overflow-hidden">
        <img
          src={image_url}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          {price}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground capitalize text-sm mb-1">{item_type}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{title}</p>
        </div>
        <p className="text-sm text-muted-foreground">{suggestion_text}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{store_name}</span>
          <Button 
            size="sm" 
            onClick={() => window.open(product_url, '_blank')}
            className="gap-2"
          >
            <ShoppingBag className="h-3 w-3" />
            Shop Now
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
