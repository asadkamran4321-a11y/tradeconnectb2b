# Manual Deployment Steps

Since the script requires password input, here are the manual steps you can run:

## Step 1: Upload the Archive
```bash
cd /Users/asadkamran/Downloads/Tradeconnectb2b.com
scp Tradeconnectb2b.com_20251117_134708.tar.gz cloudpanel@72.61.145.67:/tmp/tradeconnect_deploy.tar.gz
# Enter password when prompted
```

## Step 2: SSH into Server and Deploy
```bash
ssh cloudpanel@72.61.145.67
# Enter password when prompted
```

Then run these commands on the server:

```bash
# Add SSH key to authorized_keys (for future passwordless access)
PUB_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIV41TzOrUxhmLGm8Bmbi5RyriwQb8VN+Hqp25avL2LU tradeconnect-deploy"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$PUB_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Install Node.js if needed
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if needed
if ! command -v pm2 >/dev/null 2>&1; then
    sudo npm install -g pm2
fi

# Create app directory
sudo mkdir -p /var/www/tradeconnect
sudo chown cloudpanel:cloudpanel /var/www/tradeconnect
cd /var/www/tradeconnect

# Extract files
tar -xzf /tmp/tradeconnect_deploy.tar.gz --strip-components=1

# Install dependencies
npm ci

# Build application
npm run build

# Create .env file (you'll need to edit this with your actual values)
cat > .env << EOF
NODE_ENV=production
PORT=5000
DOMAIN=websurf.cloud
DATABASE_URL=your_database_url_here
SESSION_SECRET=$(openssl rand -hex 32)
BREVO_API_KEY=your_brevo_key_here
SENDGRID_API_KEY=your_sendgrid_key_here
EOF

# Run database migration
npm run db:push

# Start with PM2
pm2 start ecosystem.config.js --env production --name tradeconnect
pm2 save
pm2 startup
```

## Alternative: Use the Automated Script

If you prefer, you can run the script and enter your password when prompted:
```bash
cd /Users/asadkamran/Downloads/Tradeconnectb2b.com
./setup_and_deploy.sh
```

