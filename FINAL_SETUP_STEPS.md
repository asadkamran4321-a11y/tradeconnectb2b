# Final Setup Steps for TradeConnect

## ✅ Already Completed
- [x] Application deployed to VPS (`/var/www/tradeconnect`)
- [x] Domain configured: `tradeconnectb2b.com`
- [x] DNS records configured (A record → 72.61.145.67, CNAME for www)
- [x] Session secret generated
- [x] PM2 installed and configured
- [x] Application built and ready

## 🔧 Remaining Steps to Go Live

### Step 1: Configure Environment Variables

SSH into your server:
```bash
ssh root@72.61.145.67
# Enter password when prompted
# Or use SSH key if configured: ssh -i deploy_ssh_key root@72.61.145.67
```

Edit the `.env` file:
```bash
cd /var/www/tradeconnect
nano .env
```

**Update these required values:**

1. **DATABASE_URL** - Your PostgreSQL connection string
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
   Or if using Neon/other providers:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

2. **BREVO_API_KEY** - Your Brevo (formerly Sendinblue) API key
   ```
   BREVO_API_KEY=your_actual_brevo_api_key_here
   ```

3. **SENDGRID_API_KEY** (Optional) - Fallback email service
   ```
   SENDGRID_API_KEY=your_sendgrid_key_here
   ```

**Current .env file location:** `/var/www/tradeconnect/.env`

### Step 2: Run Database Migration

```bash
cd /var/www/tradeconnect
npm run db:push
```

This will create all the necessary database tables.

### Step 3: Restart the Application

```bash
pm2 restart tradeconnect
pm2 save
```

### Step 4: Verify Application is Running

```bash
# Check status
pm2 status

# View logs
pm2 logs tradeconnect

# Test the application
curl http://localhost:5000
```

### Step 5: Configure Reverse Proxy (Optional but Recommended)

To serve on port 80/443 instead of 5000, configure Nginx via CloudPanel:

1. Access CloudPanel: `https://72.61.145.67:8443`
2. Create a new site for `tradeconnectb2b.com`
3. Configure as reverse proxy to `http://localhost:5000`
4. Enable SSL certificate (Let's Encrypt)

Or configure Nginx manually:
```nginx
server {
    listen 80;
    server_name tradeconnectb2b.com www.tradeconnectb2b.com;

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

## 🌐 Access Your Application

After completing the steps above:

- **Direct IP:** `http://72.61.145.67:5000`
- **Domain (port 5000):** `http://tradeconnectb2b.com:5000`
- **Domain (port 80):** `http://tradeconnectb2b.com` (after reverse proxy setup)
- **Domain (HTTPS):** `https://tradeconnectb2b.com` (after SSL setup)

## 🔍 Troubleshooting

### Application not starting?
```bash
# Check logs
pm2 logs tradeconnect --err

# Check if port is in use
netstat -tlnp | grep 5000
```

### Database connection issues?
- Verify DATABASE_URL is correct
- Check if database server is accessible
- Ensure database user has proper permissions

### Email not working?
- Verify BREVO_API_KEY is correct
- Check Brevo dashboard for API key status
- Verify sender email is verified in Brevo

## 📞 Quick Commands Reference

```bash
# SSH to server
ssh root@72.61.145.67

# View application status
pm2 status

# View logs
pm2 logs tradeconnect

# Restart application
pm2 restart tradeconnect

# Stop application
pm2 stop tradeconnect

# View environment variables
cd /var/www/tradeconnect && cat .env
```

