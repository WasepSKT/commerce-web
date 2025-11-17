interface ProductPriceProps {
  price: number;
  discountPercent: number;
  formatPrice: (price: number) => string;
}

export const ProductPrice = ({ price, discountPercent, formatPrice }: ProductPriceProps) => {
  const hasDiscount = typeof discountPercent === 'number' && discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discountPercent / 100)) : price;

  return (
    <div className="mb-2">
      {hasDiscount ? (
        <div className="flex items-center gap-2">
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
            {formatPrice(discountedPrice)}
          </div>
          <div className="text-base md:text-lg text-muted-foreground line-through">
            {formatPrice(price)}
          </div>
        </div>
      ) : (
        <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
          {formatPrice(price)}
        </div>
      )}
    </div>
  );
};


