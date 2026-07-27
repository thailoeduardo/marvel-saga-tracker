create table if not exists public.titles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sagas (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  era text not null,
  universe text not null,
  year text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issues (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  saga_id text not null references public.sagas(id) on delete cascade,
  title_id text references public.titles(id) on delete set null,
  series text not null,
  number text not null,
  volume integer check (volume between 1 and 10),
  is_annual boolean not null default false,
  reading_order integer,
  year text,
  notes text,
  story_type text not null default 'main',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists titles_user_id_idx on public.titles (user_id);
create index if not exists titles_user_name_idx on public.titles (user_id, name);
create unique index if not exists titles_user_lower_name_key on public.titles (user_id, lower(name));
create index if not exists sagas_user_id_idx on public.sagas (user_id);
create index if not exists issues_user_id_idx on public.issues (user_id);
create index if not exists issues_saga_id_idx on public.issues (saga_id);
create index if not exists issues_title_id_idx on public.issues (title_id);

alter table public.titles enable row level security;
alter table public.sagas enable row level security;
alter table public.issues enable row level security;

drop policy if exists "Users can manage own titles" on public.titles;
drop policy if exists "Users can manage own sagas" on public.sagas;
drop policy if exists "Users can manage own issues" on public.issues;

create policy "Users can manage own titles"
on public.titles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own sagas"
on public.sagas
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage own issues"
on public.issues
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
