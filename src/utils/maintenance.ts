// Maintenance mode utilities

export const isAuthMaintenanceMode = (): boolean => {
  const mode = import.meta.env.VITE_MAINTENANCE_AUTH;
  return mode === 'true' || mode === '1';
};

export const isProductMaintenanceMode = (): boolean => {
  const mode = import.meta.env.VITE_MAINTENANCE_PRODUCT;
  return mode === 'true' || mode === '1';
};

export const getMarketplaceLinks = () => {
  return {
    shopee: import.meta.env.VITE_SHOPEE_URL || 'https://shopee.co.id/regalpaw',
    tiktok: import.meta.env.VITE_TIKTOK_SHOP_URL || 'https://www.tiktok.com/@regalpaw',
  };
};
