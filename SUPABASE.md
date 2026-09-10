# Supabase setup (done via MCP)

Project: `github-oauth-login-api-gateway`
Project ID: `zlprqchbjnokgpytmvnl`
URL: `https://zlprqchbjnokgpytmvnl.supabase.co`

## Vercel env (required)

```
NEXT_PUBLIC_SUPABASE_URL=https://zlprqchbjnokgpytmvnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon jwt from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service_role from dashboard Settings > API>
```

Table `public.projects` is created with RLS + read/write policies.
