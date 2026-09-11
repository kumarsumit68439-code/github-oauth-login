# Google + GitHub OAuth — Vercel deploy guide

Production domain: `https://github-oauth-login-nine.vercel.app`

## Callback URLs

| Provider | Callback |
|----------|----------|
| Google | `https://github-oauth-login-nine.vercel.app/api/auth/callback/google` |
| GitHub | `https://github-oauth-login-nine.vercel.app/api/auth/callback/github` |

Homepage: `https://github-oauth-login-nine.vercel.app`

## Env vars (Vercel Dashboard)

```
NEXTAUTH_URL=https://github-oauth-login-nine.vercel.app
NEXTAUTH_SECRET=<openssl rand -base64 32>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

## Google setup
1. https://console.cloud.google.com/apis/credentials
2. OAuth client ID → Web application
3. Origins: production domain
4. Redirect URI: Google callback above

## GitHub setup
1. https://github.com/settings/developers
2. New OAuth App
3. Homepage + Authorization callback URL as above

## In-app dashboard
After login: `/developer` — copy callbacks, env checklist, live session.

## Note on Auth.js v5
This production app uses **next-auth v4** (stable with current codebase).
Auth.js v5 (`next-auth@5` / `auth.ts` export pattern) can be migrated later;
providers and callback paths stay the same.
