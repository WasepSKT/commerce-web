#!/bin/bash
# Manual deployment script for cPanel

echo "🚀 Deploying Backend to cPanel..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Create tmp directory for restart
echo "📁 Creating restart marker..."
mkdir -p tmp

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Upload these files to cPanel via FTP:"
echo "   - dist/"
echo "   - node_modules/"
echo "   - package.json"
echo "   - package-lock.json"
echo "   - .htaccess"
echo "   - public/"
echo ""
echo "2. Or use the automated GitHub Actions deployment"
echo ""
echo "3. Restart app: touch ~/api-payment.regalpaw.id/tmp/restart.txt"
