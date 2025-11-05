export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export const calculateDiscountedPrice = (price: number, discountPercent?: number): number => {
  const discount = discountPercent ?? 0;
  return discount > 0 ? Math.round(price * (1 - discount / 100)) : price;
};

export const hasDiscount = (discountPercent?: number): boolean => {
  return typeof discountPercent === 'number' && discountPercent > 0;
};
