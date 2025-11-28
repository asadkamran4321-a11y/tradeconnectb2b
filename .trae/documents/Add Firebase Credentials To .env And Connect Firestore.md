## What I Will Do
1. Update `.env` to include Firebase credentials and a real `SESSION_SECRET`
2. Sanitize your service account JSON (remove backticks from URL fields) if needed
3. Start the app and verify Firestore persistence (user creation)

## .env Changes (File Path Method)
- Add these lines:
- `GOOGLE_APPLICATION_CREDENTIALS=/Users/asadkamran/Downloads/tradeconnectb2b-firebase-adminsdk-fbsvc-603348fa3f.json`
- `FIREBASE_PROJECT_ID=tradeconnectb2b`
- `SESSION_SECRET=<generated_hex_32>`
- `BREVO_API_KEY=<existing>`
- `PORT=5000`

## JSON Sanitization
- Ensure these keys use plain strings:
- `"auth_uri": "https://accounts.google.com/o/oauth2/auth"`
- `"token_uri": "https://oauth2.googleapis.com/token"`
- `"auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"`
- `"client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tradeconnectb2b.iam.gserviceaccount.com"`

## Start & Verify
- Start locally: `PORT=5173 npm run start`
- Verify with:
- `curl -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"test1234","role":"supplier"}'`
- Check Firestore Console → `users` collection shows the new doc

## Security
- Keep the JSON file private (do not commit to git)
- Replace `<generated_hex_32>` with a real value (I will generate and set it)

## If You Prefer Base64 Env
- I can create a base64 string from your JSON and set `FIREBASE_SERVICE_ACCOUNT=<base64>` in `.env` instead of the file path.

## Deliverables
- Apply `.env` changes
- Generate and set `SESSION_SECRET`
- Start app and provide success logs confirming Firestore writes