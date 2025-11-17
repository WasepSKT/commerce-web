import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
  value: number;
  stock: number;
  onChange: (value: number) => void;
}

export const QuantitySelector = ({ value, stock, onChange }: QuantitySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        -
      </Button>
      <div className="w-16 text-center">
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
        onClick={() => onChange(Math.min(stock, value + 1))}
        disabled={value >= stock}
      >
        +
      </Button>
    </div>
  );
};


