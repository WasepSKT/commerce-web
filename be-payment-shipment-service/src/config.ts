import 'dotenv/config';

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  serviceApiKey: req('SERVICE_API_KEY'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  xendit: {
    secretKey: req('XENDIT_SECRET_KEY'),
    publicKey: process.env.XENDIT_PUBLIC_KEY || '',
    webhookToken: req('XENDIT_WEBHOOK_TOKEN'),
    basePublicUrl: process.env.BASE_PUBLIC_URL || '',
  },
  shipping: {
    jubelio: {
      apiBaseUrl: process.env.JUBELIO_API_BASE_URL || '',
      apiToken: process.env.JUBELIO_API_TOKEN || '',
      clientId: process.env.JUBELIO_CLIENT_ID || '',
      clientSecret: process.env.JUBELIO_CLIENT_SECRET || '',
      walletId: process.env.JUBELIO_WALLET_ID || '',
      username: process.env.JUBELIO_USERNAME || '',
      password: process.env.JUBELIO_PASSWORD || '',
      webhookToken: process.env.JUBELIO_WEBHOOK_TOKEN || '',
      defaultWarehouseId: process.env.DEFAULT_WAREHOUSE_ID || '',
      originName: process.env.ORIGIN_NAME || '',
      originEmail: process.env.ORIGIN_EMAIL || '',
      originPhone: process.env.ORIGIN_PHONE || '',
      originAddress: process.env.ORIGIN_ADDRESS || '',
      originZipcode: process.env.ORIGIN_ZIPCODE || '',
      originAreaId: process.env.ORIGIN_AREA_ID || '',
      defaultServiceCategoryId: parseInt(process.env.DEFAULT_SERVICE_CATEGORY_ID || '1', 10),
      carrierPreferences: (process.env.CARRIER_PREFERENCES || '').split(/[|,]/).map(s => s.trim()).filter(Boolean),
    },
  },
};
