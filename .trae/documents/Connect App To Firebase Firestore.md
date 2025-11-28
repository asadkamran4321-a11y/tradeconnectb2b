## Prerequisites
- Firebase project created and Firestore enabled (Native mode)
- You have access to Project Settings → Service Accounts

## Create Credentials
1. Generate service account JSON
   - Firebase Console → Project Settings → Service Accounts → “Generate new private key”
   - Save the JSON locally
2. Option A (single env var, recommended for deployment): Base64-encode the JSON
   - macOS/Linux: `base64 -w 0 service-account.json > service-account.base64`
   - Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json")) > service-account.base64`
3. Option B (application default credentials): Use file path
   - Keep the JSON file on the server and set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json`

## Configure Environment
- Use ONE of the following configurations:

### Option A (Base64 service account)
- Set envs (local or server):
  - `FIREBASE_SERVICE_ACCOUNT=<contents of service-account.base64>`
  - `NODE_ENV=production`
  - `PORT=5000` (or preferred)
  - `BREVO_API_KEY=<your Brevo key>`
  - `SESSION_SECRET=<openssl rand -hex 32>`

### Option B (File path + project id)
- Set envs:
  - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json`
  - `FIREBASE_PROJECT_ID=<your-project-id>`
  - Plus `NODE_ENV`, `PORT`, `BREVO_API_KEY`, `SESSION_SECRET`

## Start The App
- Local: `PORT=5173 npm run start` (uses `.env` and env vars)
- Server (PM2):
  - `pm2 start ecosystem.config.js --env production --name tradeconnect`
  - `pm2 save`
  - `pm2 logs tradeconnect`

## What Connects Automatically
- The app auto-initializes Firestore when `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_PROJECT_ID` is present
- Firestore-backed operations currently include:
  - `createUser`, `getUserById`, `getUserByEmail`
  - `getUserByEmailVerificationToken`, `getUserByPasswordResetToken`
  - `updateUser`, `deleteUser`
- Email flows (verification, password reset) persist tokens in Firestore when enabled

## Verify Connectivity
1. Register a user:
   - `curl -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"test1234","role":"supplier"}'`
   - Check Firestore → `users` collection contains the new user
2. Password reset (development):
   - `curl -X POST http://localhost:5173/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`
   - Response includes `debugToken` and links; use `POST /api/auth/reset-password` with `{ token, newPassword }`
3. Production email: ensure Brevo IP is authorized and sender verified; logs show “✅ Brevo email sent successfully”

## Security Notes
- Keep service account private; do not commit JSON or base64 to git
- Use a strong `SESSION_SECRET`; rotating invalidates existing sessions
- If using file path, restrict permissions on the JSON file

## Optional Next Steps
- Extend Firestore to suppliers, buyers, products, inquiries, notifications for full persistence
- Add collection indexes for common queries (email, token lookups)

## Deliverables After Confirmation
- Configure env on your chosen environment (local or VPS)
- Start the app with Firestore enabled and verify user creation and password reset persistence
- If requested, migrate remaining entities to Firestore and provide data model/collection layout