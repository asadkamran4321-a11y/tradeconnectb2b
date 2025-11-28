## What I Will Check
- DNS A/AAAA records resolve and point to your VPS IP `72.61.145.67`
- DNS propagation across multiple resolvers (global check)
- Optional: HTTP/HTTPS response status at `http://tradeconnectb2b.com/` and `https://tradeconnectb2b.com/`
- Presence of `www` CNAME or A record (`www.tradeconnectb2b.com`)
- MX and TXT records (SPF/DKIM/DMARC) if mail is planned via Brevo/SendGrid

## Tools/Methods
- Perform DNS lookups via public DNS checkers (A, AAAA, CNAME, NS)
- Verify HTTP response headers for reachability

## Success Criteria
- A record returns `72.61.145.67` (or your intended IP)
- Site responds with 200/301/302 at `http://tradeconnectb2b.com/`
- If HTTPS is enabled, valid certificate chains
- `www` redirects or resolves correctly

## If Not Connected
- Provide exact DNS changes to make at your registrar:
  - Set A record for `@` to `72.61.145.67`
  - Set CNAME for `www` to `tradeconnectb2b.com` (or A to `72.61.145.67`)
- After DNS propagation, configure Nginx virtual host for the domain and enable HTTPS with Certbot

## Deliverables
- A short report: DNS records found, propagation status, and web reachability
- Recommended changes if records are missing or misconfigured

Confirm and I’ll perform the checks now and provide the report.