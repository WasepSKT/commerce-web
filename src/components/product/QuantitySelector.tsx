import { Button } from '@/components/ui/button';

interface Props {
  value: number;
  stock: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, stock, onChange }: Props) {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(stock, value + 1));
  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm font-medium">Jumlah:</span>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-transparent hover:text-primary"
          onClick={dec}
        >
          -
        </Button>
        <span className="w-12 text-center font-medium">{value}</span>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-transparent hover:text-primary"
          onClick={inc}
        >
          +
        </Button>
      </div>
    </div>
  );
}


