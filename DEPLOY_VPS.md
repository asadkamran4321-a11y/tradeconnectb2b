# TradeConnect VPS Deployment Guide

## Quick Deployment Steps

### Option 1: Using CloudPanel Web Interface (Recommended)

1. **Access CloudPanel**
   - Go to: `https://72.61.145.67:8443` (or your CloudPanel URL)
   - Login with your CloudPanel credentials

2. **Create Node.js Site**
   - Click "Sites" → "Add Site"
   - Choose "Node.js"
   - Domain: `websurf.cloud` (or your domain)
   - Document Root: `/var/www/tradeconnect`

3. **Upload Application Files**
   - Use CloudPanel's File Manager or SFTP
   - Upload the contents of the archive to `/var/www/tradeconnect`
   - Or use the archive file: `Tradeconnectb2b.com_20251117_134708.tar.gz`

4. **Extract and Setup**
   ```bash
   cd /var/www/tradeconnect
   tar -xzf /path/to/Tradeconnectb2b.com_20251117_134708.tar.gz --strip-components=1
   npm ci
   npm run build
   ```

5. **Configure Environment Variables**
   Create `.env` file in `/var/www/tradeconnect`:
   ```bash
   NODE_ENV=production
   PORT=5000
   DOMAIN=websurf.cloud
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_secure_random_session_secret
   BREVO_API_KEY=your_brevo_api_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

6. **Run Database Migration**
   ```bash
   npm run db:push
   ```

7. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js --env production --name tradeconnect
   pm2 save
   pm2 startup
   ```

### Option 2: Using SSH (After Key Setup)

If you can SSH into the server, use the deployment script:

```bash
# Upload the archive
scp Tradeconnectb2b.com_20251117_134708.tar.gz cloudpanel@72.61.145.67:/tmp/

# SSH into server
ssh cloudpanel@72.61.145.67

# Run deployment
cd /var/www
sudo mkdir -p tradeconnect
sudo chown cloudpanel:cloudpanel tradeconnect
cd tradeconnect
tar -xzf /tmp/Tradeconnectb2b.com_20251117_134708.tar.gz --strip-components=1

# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies and build
npm ci
npm run build

# Configure environment variables (create .env file)
# Then run migrations and start
npm run db:push
npm install -g pm2
pm2 start ecosystem.config.js --env production --name tradeconnect
pm2 save
pm2 startup
```

## Required Environment Variables

Make sure to set these in your `.env` file or CloudPanel environment:

- `NODE_ENV=production`
- `PORT=5000`
- `DOMAIN=websurf.cloud`
- `DATABASE_URL=your_database_url`
- `SESSION_SECRET=generate_with_openssl_rand_hex_32`
- `BREVO_API_KEY=your_brevo_key`
- `SENDGRID_API_KEY=your_sendgrid_key` (optional fallback)

## Generate Session Secret

```bash
openssl rand -hex 32
```

## Verify Deployment

1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs tradeconnect`
3. Visit your domain: `http://websurf.cloud:5000` (or configure reverse proxy)

## Configure Reverse Proxy (Nginx)

If you want to use port 80/443, set up Nginx:

```nginx
server {
    listen 80;
    server_name websurf.cloud;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

- **SSH Key Issues**: The SSH key has been added to your Hostinger account. You may need to manually add it to `~/.ssh/authorized_keys` on the server.
- **Port Issues**: Make sure port 5000 is open in the firewall
- **Database**: Ensure your DATABASE_URL is correct and accessible
- **PM2**: Check logs with `pm2 logs tradeconnect`

