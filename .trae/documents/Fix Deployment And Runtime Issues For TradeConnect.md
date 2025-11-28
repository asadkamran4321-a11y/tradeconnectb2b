## Scope
- Make the app run locally on the VPS and expose via IP/port
- Configure reverse proxy and (optionally) HTTPS
- Correct DNS so the domain resolves to your VPS
- Ensure email functions with Brevo key and secure env handling
- Set up PM2 for persistence and monitoring

## Actions I Will Perform
1. SSH connect to `root@72.61.145.67` (password auth)
2. System setup
   - Install Node.js 20, PM2
   - Install Nginx
   - Open firewall for HTTP/HTTPS (if UFW enabled)
3. App setup in `/var/www/tradeconnectb2b`
   - Verify git remote and pull latest from `main`
   - `npm ci` and `npm run build`
4. Start app locally on server
   - Inject env vars (no .env files):
     - `BREVO_API_KEY` (provided)
     - `SESSION_SECRET` (generate unless you provide one)
     - Optional: `SENDGRID_API_KEY`, `DATABASE_URL`
     - `PORT=5000`
   - Start with PM2: `pm2 start ecosystem.config.js --env production --name tradeconnect` and `pm2 save`
   - Verify: `pm2 logs`, `curl -I http://127.0.0.1:5000/`
5. Nginx reverse proxy
   - Create site config for IP or domain -> `127.0.0.1:5000`
   - `nginx -t` and reload Nginx
6. DNS fix (domain not connected)
   - Update DNS at registrar:
     - `A` @ -> `72.61.145.67`
     - `CNAME` www -> `tradeconnectb2b.com` (or `A` -> `72.61.145.67`)
   - After propagation, update Nginx `server_name` and (optional) enable HTTPS via Certbot

## Verification
- Local: `curl -I http://127.0.0.1:5000/` returns 200/redirect
- External: `curl -I http://72.61.145.67:5000/` works if port open
- Domain: resolves to VPS and serves via Nginx
- PM2 logs show `serving on http://localhost:5000` with no errors
- Email: registration/password reset send using Brevo

## Security
- Use password only for SSH session; do not store
- Keep secrets out of source; inject via environment
- Recommend rotating any secrets shared in chat and storing in a password manager or GitHub Secrets for CI

## Optional CI Deployment
- Use the existing GitHub Actions workflow to deploy on push to `main`
- Store VPS creds and envs as GitHub Secrets (no exposure)

## Needed To Proceed
- Confirm: run on IP first, then domain
- Confirm: generate `SESSION_SECRET`
- Confirm: SSH port is 22

On confirmation, I will log in and execute the steps end-to-end, then report back with verification results.