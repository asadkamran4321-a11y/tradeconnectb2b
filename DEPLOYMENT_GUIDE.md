# TradeConnect Production Deployment Guide

## ✅ Email Verification System Status (Updated July 24, 2025)

**Email Service Configuration:**
- Primary: Brevo API with verified sender `marketing@gtsmt.com`
- Fallback: SendGrid (when needed)
- Domain: gtsmt.com (fully verified in Brevo)

**Automatic Approval System:**
- Email verification is MANDATORY (no skip option)
- Upon email verification → Account automatically approved
- No manual admin approval required for suppliers/buyers
- Auto-approved by system (admin ID 999)

**Current Status:** ✅ WORKING
- Email delivery: ✅ Confirmed working via Brevo
- Verification tokens: ✅ Generated and stored correctly
- Auto-approval: ✅ Implemented and tested

## Critical Deployment Fix

**Issue:** "Verification Failed - No verification token provided" error occurs when:
1. Email links lose tokens during deployment
2. Frontend routing doesn't handle tokens properly
3. URL encoding/decoding issues

**Solution:** Enhanced error handling and logging implemented

## Prerequisites for Production

### 1. Domain Configuration
- Purchase and configure your domain (e.g., `yourcompany.com`)
- Set up DNS records pointing to your hosting provider
- Configure SSL certificate for HTTPS

### 2. Environment Variables Required

#### Core Application
```bash
NODE_ENV=production
PORT=5000
DOMAIN=yourcompany.com
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_random_session_secret
```

#### Email Services
```bash
# Primary email service (Brevo)
BREVO_API_KEY=your_brevo_api_key

# Fallback email service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 3. Email Service Setup

#### Brevo Configuration
1. Create account at https://www.brevo.com
2. Go to SMTP & API → API Keys
3. Generate new API key and add to `BREVO_API_KEY`
4. Add `noreply@yourdomain.com` as verified sender
5. Configure domain authentication:
   - Add SPF record: `v=spf1 include:spf.sendinblue.com ~all`
   - Add DKIM records provided by Brevo
   - Add DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
6. Whitelist your production server IP addresses

#### SendGrid Configuration (Fallback)
1. Create account at https://sendgrid.com
2. Go to Settings → API Keys
3. Generate API key with full access and add to `SENDGRID_API_KEY`
4. Go to Settings → Sender Authentication
5. Authenticate your domain with DNS records
6. Add `noreply@yourdomain.com` as verified sender

### 4. Database Setup

#### PostgreSQL Production Database
```sql
-- Create production database
CREATE DATABASE tradeconnect_production;

-- Create user with limited permissions
CREATE USER tradeconnect_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE tradeconnect_production TO tradeconnect_user;
```

#### Database Migration
```bash
# Install dependencies
npm install

# Push schema to production database
npm run db:push

# Verify tables created successfully
```

### 5. Security Configuration

#### Session Management
- Generate secure session secret: `openssl rand -hex 32`
- Configure session cookie settings for production
- Set up Redis for session storage (recommended for scaling)

#### HTTPS Setup
- Configure SSL/TLS certificate
- Redirect HTTP to HTTPS
- Set secure cookie flags

### 6. Production Server Setup

#### Server Requirements
- Node.js 18+ 
- PostgreSQL 13+
- At least 2GB RAM
- SSL certificate

#### Process Management
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start npm --name "tradeconnect" -- run start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 7. Verification Checklist

#### Email Functionality
- [ ] Brevo API key configured and working
- [ ] SendGrid API key configured as fallback
- [ ] Domain authentication completed for both services
- [ ] SPF, DKIM, DMARC records configured
- [ ] Test emails delivered to Gmail, Outlook, Yahoo
- [ ] Emails not going to spam folder

#### Application Security
- [ ] HTTPS enabled and working
- [ ] Session secret generated and configured
- [ ] Database connection secure
- [ ] Environment variables properly set
- [ ] Admin account created and accessible

#### Production Testing
- [ ] User registration and email verification working
- [ ] Password reset functionality working
- [ ] All user roles (supplier, buyer, admin) working
- [ ] Product management and approval workflow working
- [ ] Inquiry system working end-to-end

### 8. DNS Records Example

```dns
# A Record
tradeconnect.com.    A    192.168.1.100

# CNAME Record
www.tradeconnect.com.    CNAME    tradeconnect.com.

# MX Record (if handling email)
tradeconnect.com.    MX    10 mail.tradeconnect.com.

# SPF Record
tradeconnect.com.    TXT    "v=spf1 include:spf.sendinblue.com include:sendgrid.net ~all"

# DKIM Record (from Brevo)
brevo._domainkey.tradeconnect.com.    TXT    "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"

# DMARC Record
_dmarc.tradeconnect.com.    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@tradeconnect.com"
```

### 9. Monitoring and Maintenance

#### Application Monitoring
- Set up logging (Winston, Morgan)
- Monitor API response times
- Track email delivery rates
- Monitor database performance

#### Regular Maintenance
- Update dependencies regularly
- Monitor email service quotas
- Backup database regularly
- Monitor SSL certificate expiration

### 10. Deployment Commands

```bash
# Production build
npm run build

# Database migration
npm run db:push

# Start production server
npm run start

# Or with PM2
pm2 start ecosystem.config.js
```

## Common Issues and Solutions

### Email Delivery Issues
1. **Emails going to spam**: Configure SPF, DKIM, DMARC properly
2. **Brevo IP restrictions**: Contact Brevo support to whitelist your server IP
3. **SendGrid authentication**: Ensure domain is verified in SendGrid dashboard

### Database Issues
1. **Connection timeouts**: Configure connection pooling
2. **Migration errors**: Ensure database user has proper permissions
3. **Performance issues**: Add indexes for frequently queried fields

### Security Issues
1. **Session management**: Use Redis for production session storage
2. **HTTPS configuration**: Ensure all cookies have secure flag
3. **Environment variables**: Never commit sensitive data to version control

## Support Contacts

- **Brevo Support**: https://help.brevo.com
- **SendGrid Support**: https://support.sendgrid.com
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/