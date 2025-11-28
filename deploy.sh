#!/bin/bash
set -e

echo "🚀 Starting TradeConnect deployment..."

# Create application directory
sudo mkdir -p /var/www/tradeconnect
sudo chown cloudpanel:cloudpanel /var/www/tradeconnect
cd /var/www/tradeconnect

# Extract the archive
echo "📦 Extracting application files..."
tar -xzf /tmp/tradeconnect_deploy.tar.gz --strip-components=1

# Install Node.js if not present
if ! command -v node >/dev/null 2>&1; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 >/dev/null 2>&1; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:push || echo "⚠️  Database migration skipped (may need manual setup)"

# Stop existing PM2 process if running
pm2 stop tradeconnect || true
pm2 delete tradeconnect || true

# Start the application with PM2
echo "🚀 Starting application with PM2..."
NODE_ENV=production pm2 start ecosystem.config.js --env production --name tradeconnect
pm2 save
pm2 startup systemd -u cloudpanel --hp /home/cloudpanel || true

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

