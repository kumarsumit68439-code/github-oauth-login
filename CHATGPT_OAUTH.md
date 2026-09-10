# Sign in with ChatGPT (OpenAI OAuth)

## What we added

- NextAuth provider id: `openai`
- Login button: **Continue with ChatGPT**
- Callback URL:
  `https://github-oauth-login-nine.vercel.app/api/auth/callback/openai`

## OAuth endpoints used

| Step | URL |
|------|-----|
| Authorize | `https://auth.openai.com/authorize` |
| Token | `https://auth0.openai.com/oauth/token` |
| UserInfo | `https://auth0.openai.com/userinfo` |

Scopes: `openid profile email offline_access`

## Vercel environment variables

```
OPENAI_CLIENT_ID=your_client_id
OPENAI_CLIENT_SECRET=your_client_secret
```

Provider is only registered when **both** are set. Then **Redeploy**.

## Important (partner access)

Official **Sign in with ChatGPT** for third-party identity is currently for
participating partners (e.g. Vercel, Supabase, Notion, GitLab, HubSpot, Airtable).

You need an OpenAI-registered OAuth client for this product. Without a valid
`client_id` / `client_secret` from OpenAI, the button will error at authorize.

Help: https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt

## After credentials

1. Add env vars on Vercel
2. Register callback URL in OpenAI app settings
3. Redeploy
4. Test **Continue with ChatGPT** on `/login`
