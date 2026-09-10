-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text,
  title text not null default 'Untitled',
  html text not null,
  files jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

-- Public read of published HTML by id (for /p/[id])
alter table public.projects enable row level security;

create policy "Public can read projects by id"
  on public.projects for select
  using (true);

-- Writes via service role from Next.js API (bypasses RLS).
-- If using anon key only, add authenticated policies as needed.
