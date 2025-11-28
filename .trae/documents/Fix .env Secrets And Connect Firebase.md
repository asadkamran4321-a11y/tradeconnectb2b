## Problems To Fix
- `SESSION_SECRET` is set to literal `<openssl rand -hex 32>` — it must be a real random string, not the command
- Firebase credentials are not wired into `.env` yet
- Your service account JSON may have backticks in URL fields — they must be plain strings

## What We Will Do
1. Generate a real session secret and put it in `.env`
2. Choose a Firebase credential method (file path or base64) and add correct env vars
3. Sanitize the service account JSON (remove backticks in URL values)
4. Restart the app and verify Firestore persistence (user creation, password reset)

## Step 1: Generate And Set SESSION_SECRET
- macOS/Linux: `openssl rand -hex 32`
- Copy the output and replace the line in `.env`:
  - `SESSION_SECRET=PASTE_HEX_STRING_HERE`

## Step 2: Add Firebase Credentials To `.env`
### Option A (File Path, recommended for big keys)
- Place JSON securely (example): `/etc/secrets/firebase-sa.json`
- Add to `.env`:
  - `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-sa.json`
  - `FIREBASE_PROJECT_ID=tradeconnectb2b`
  - `PORT=5000`
  - Keep existing `BREVO_API_KEY`

### Option B (Base64 Single Variable)
- Create base64 of the JSON:
  - macOS/Linux: `base64 -w 0 /absolute/path/service-account.json > /absolute/path/service-account.base64`
- Add to `.env`:
  - `FIREBASE_SERVICE_ACCOUNT=<paste entire base64 string>`
  - `PORT=5000`

## Step 3: Sanitize Service Account JSON (If Needed)
- Ensure URL fields are plain strings without backticks:
  - `"auth_uri": "https://accounts.google.com/o/oauth2/auth"`
  - `"token_uri": "https://oauth2.googleapis.com/token"`
  - `"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"`
  - `"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tradeconnectb2b.iam.gserviceaccount.com"`
- Keep the private key block exactly as provided

## Step 4: Restart And Verify
- Local: `PORT=5173 npm run start`
- Server (PM2): `pm2 restart tradeconnect`

### Verify Firestore
- Register user:
  - `curl -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"test1234","role":"supplier"}'`
- Check Firebase Console → Firestore → `users` shows the new doc

### Verify Password Reset (Development)
- Request: `curl -X POST http://localhost:5173/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`
- Use `debugToken` from response to reset:
  - `curl -X POST http://localhost:5173/api/auth/reset-password -H "Content-Type: application/json" -d '{"token":"<debugToken>","newPassword":"newStrongPass"}'`

## Notes
- `.env` values must be literal strings — no angle brackets or commands
- Do not commit the service account JSON or base64; keep it out of version control
- For email sending, authorize your public IP in Brevo and verify the sender address used in code