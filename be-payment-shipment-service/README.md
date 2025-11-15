# Payment & Shipment Service API

Backend API service untuk handle payment (Xendit) dan shipment (RajaOngkir).

## Tech Stack

- Node.js 20+
- TypeScript
- Express.js
- Xendit Payment Gateway
- RajaOngkir Shipping API

## Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment (cPanel)

1. Setup subdomain: `api-payment.regalpaw.id`
2. Setup Node.js App di cPanel (Node 20+)
3. Set environment variables di cPanel
4. Push ke GitHub (auto-deploy via .cpanel.yml)

## API Endpoints

### Health Check

```
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>
```
