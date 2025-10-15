import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StockStatusProps {
  stock: number;
  className?: string;
  showText?: boolean;
}

export function StockStatus({ stock, className, showText = true }: StockStatusProps) {
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        variant: 'destructive' as const,
        text: 'Habis',
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    } else if (stock <= 5) {
      return {
        variant: 'secondary' as const,
        text: 'Stok Menipis',
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    } else if (stock <= 20) {
      return {
        variant: 'secondary' as const,
        text: 'Stok Terbatas',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    } else {
      return {
        variant: 'secondary' as const,
        text: 'Tersedia',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
  };

  const status = getStockStatus(stock);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={status.variant}
        className={cn('text-xs font-medium', status.className)}
      >
        {stock} unit
      </Badge>
      {showText && (
        <span className={cn('text-xs font-medium', {
          'text-red-600': stock === 0,
          'text-orange-600': stock > 0 && stock <= 5,
          'text-yellow-600': stock > 5 && stock <= 20,
          'text-green-600': stock > 20
        })}>
          {status.text}
        </span>
      )}
    </div>
  );
}
