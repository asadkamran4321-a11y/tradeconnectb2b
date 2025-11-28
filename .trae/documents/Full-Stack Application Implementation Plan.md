## What You Will Add To `.env`

Use the file path method (simplest for large keys):

* GOOGLE\_APPLICATION\_CREDENTIALS=/Users/asadkamran/Downloads/tradeconnectb2b-firebase-adminsdk-fbsvc-603348fa3f.json

* FIREBASE\_PROJECT\_ID=tradeconnectb2b

* SESSION\_SECRET=<replace with a real random hex string>

* BREVO\_API\_KEY=<keep your existing key>

* PORT=5000

## Generate A Real Session Secret

* macOS:

  * Run: `openssl rand -hex 32`

  * Copy the output (64 hex chars) and paste into `.env`:

    * `SESSION_SECRET=<paste_here>`

## Sanity Check Your JSON (Important)

* Open the JSON and ensure URL fields are plain strings (no backticks):

  * "auth\_uri": "<https://accounts.google.com/o/oauth2/auth>"

  * "token\_uri": "<https://oauth2.googleapis.com/token>"

  * "auth\_provider\_x509\_cert\_url": "<https://www.googleapis.com/oauth2/v1/certs>"

  * "client\_x509\_cert\_url": "<https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40tradeconnectb2b.iam.gserviceaccount.com>"

* Keep the private key block exactly as provided (BEGIN/END PRIVATE KEY).

## Start The App

* Local: `PORT=5173 npm run start`

* Server (PM2): `pm2 restart tradeconnect`

## Verify Firestore Connectivity

1. Register a user:

* `curl -X POST http://localhost:5173/api/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"test1234","role":"supplier"}'`

1. In Firebase Console → Firestore, check the `users` collection for the new document.

## Password Reset (Dev Convenience)

* Request: `curl -X POST http://localhost:5173/api/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`

* Use `debugToken` from the response:

  * `curl -X POST http://localhost:5173/api/auth/reset-password -H "Content-Type: application/json" -d '{"token":"<debugToken>","newPassword":"newStrongPass"}'`

## Email Delivery (Brevo)

* Authorize your current public IP in Brevo Security → Authorized IPs

* Verify the sender used in code (default `marketing@gtsmt.com`)

* Logs should show “✅ Brevo email sent successfully” when allowed.

## If You Prefer Base64 Instead Of File Path

* Create base64: `base64 -w 0 /Users/asadkamran/Downloads/tradeconnectb2b-firebase-adminsdk-fbsvc-603348fa3f.json > ~/firebase-sa.base64`

* In `.env`: `FIREBASE_SERVICE_ACCOUNT=<paste entire contents of ~/firebase-sa.base64>`

* Keep `SESSION_SECRET`, `BREVO_API_KEY`, `PORT` as above.

## Deliverables After You Paste The Lines

* I will restart the app and run the register test, then confirm the Firestore document was created.

