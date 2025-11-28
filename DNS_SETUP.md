# DNS Configuration for tradeconnectb2b.com

## Current Status
- ✅ Domain configured in application: `tradeconnectb2b.com`
- ✅ VPS IP: `72.61.145.67`
- ⚠️ DNS records need to be configured

## Required DNS Records

To make `tradeconnectb2b.com` point to your VPS, you need to configure these DNS records:

### A Record (Main Domain)
```
Type: A
Name: @ (or tradeconnectb2b.com)
Value: 72.61.145.67
TTL: 3600 (or default)
```

### A Record (WWW Subdomain)
```
Type: A
Name: www
Value: 72.61.145.67
TTL: 3600 (or default)
```

### Optional: CNAME Record (Alternative)
```
Type: CNAME
Name: www
Value: tradeconnectb2b.com
TTL: 3600
```

## How to Configure DNS

### Option 1: If domain is in Hostinger
1. Go to Hostinger hPanel
2. Navigate to Domains → DNS Zone Editor
3. Add the A records above
4. Wait for DNS propagation (usually 5-30 minutes)

### Option 2: If domain is with another registrar
1. Log into your domain registrar's control panel
2. Find DNS Management / Nameservers section
3. Add the A records pointing to `72.61.145.67`
4. Or update nameservers to Hostinger's if you want to manage DNS there

## Verify DNS Configuration

After setting up DNS, verify with:
```bash
# Check A record
dig tradeconnectb2b.com A
# or
nslookup tradeconnectb2b.com

# Should return: 72.61.145.67
```

## Next Steps After DNS is Configured

1. **Configure Nginx/Reverse Proxy** (recommended for port 80/443):
   ```bash
   # Access via CloudPanel or configure manually
   # Point domain to port 5000
   ```

2. **Set up SSL Certificate**:
   - Use CloudPanel's SSL feature
   - Or use Let's Encrypt with certbot

3. **Update Firewall** (if needed):
   - Ensure ports 80, 443, and 5000 are open
   - Configure in CloudPanel or via firewall rules

## Current Application Status

- Application is deployed and ready
- Running on port 5000
- Accessible at: `http://72.61.145.67:5000` (until DNS is configured)
- Will be accessible at: `http://tradeconnectb2b.com:5000` (after DNS)
- Should be accessible at: `https://tradeconnectb2b.com` (after DNS + SSL setup)

