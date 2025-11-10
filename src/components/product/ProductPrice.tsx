interface ProductPriceProps {
  price: number;
  discountPercent: number;
  formatPrice: (price: number) => string;
}

export const ProductPrice = ({ price, discountPercent, formatPrice }: ProductPriceProps) => {
  const hasDiscount = typeof discountPercent === 'number' && discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discountPercent / 100)) : price;

  return (
    <div className="mb-4">
      {hasDiscount ? (
        <div>
          <div className="text-lg text-muted-foreground line-through font-medium">
            {formatPrice(price)}
          </div>
          <div className="text-4xl font-bold text-primary">
            {formatPrice(discountedPrice)}
          </div>
          <div className="text-sm text-red-600 font-semibold">
            Diskon {discountPercent}%
          </div>
        </div>
      ) : (
        <div className="text-4xl font-bold text-primary">
          {formatPrice(price)}
        </div>
      )}
    </div>
  );
};


