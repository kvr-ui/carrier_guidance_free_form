# Career Guidance Meet — registration

Same page as focasedu.com/career-guidance, with free registration. Each
registration is stored in MongoDB, and the team views the leads at `/admin`.

| Route      | What it is                                             |
| ---------- | ------------------------------------------------------ |
| `/`        | Landing page + registration form                       |
| `/success` | Confirmation page shown after a successful registration |
| `/admin`   | Password-protected leads table (search, filters, CSV)  |

## Setup

```bash
cp .env.example .env   # fill in MONGODB_URI, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET
npm install
```

**Development:** `npm run dev`. This runs the API on :7002 and the site on http://localhost:8080, and proxies `/api` to the API.

**Production:** `npm run build && npm start`. One Node process serves the built site and the API on `PORT`.
On Coolify, use Nixpacks with build command `npm run build`, start command `npm start`, and set the env vars from `.env.example`.

## Data

Leads go to `MONGODB_DB.MONGODB_COLLECTION` (default `focas.career_guidance_leads`).
There is one document per WhatsApp number. If someone registers again, the
server updates their details and increments `submissions`, and keeps the
original `createdAt` and first-touch `utm`.
# carrier_guidance_free_form
