# GitHub OAuth Login (Next.js + NextAuth)

Simple working GitHub login page ready for Vercel.

## Setup

1. Create a GitHub OAuth App at https://github.com/settings/developers
   - Homepage URL: your Vercel URL
   - Authorization callback URL: `https://YOUR-VERCEL-URL/api/auth/callback/github`

2. In Vercel project → Settings → Environment Variables add:
   - `GITHUB_ID` = your Client ID
   - `GITHUB_SECRET` = your Client Secret
   - `NEXTAUTH_SECRET` = any random long string (e.g. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = your production URL (https://....vercel.app)

3. Redeploy after adding env vars.

## Pages
- `/login` – Login page
- `/` – Home (shows user info after login)
