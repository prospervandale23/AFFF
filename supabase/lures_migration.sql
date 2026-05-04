-- ============================================================
-- Lures & Recommendations Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Lure pool — one record per unique lure per fishing type
create table public.lures (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  fishing_type  text        not null check (fishing_type in ('freshwater', 'saltwater')),
  price_range   text        not null default '',
  photo_url     text,
  created_by    uuid        references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  unique (name, fishing_type)
);

-- 2. Recommendations — one per user per lure per species
create table public.lure_recommendations (
  id          uuid        primary key default gen_random_uuid(),
  lure_id     uuid        not null references public.lures(id) on delete cascade,
  species_id  text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  unique (lure_id, species_id, user_id)
);

-- 3. Row Level Security
alter table public.lures enable row level security;
alter table public.lure_recommendations enable row level security;

-- Lures: any authenticated user can read; only the creator can insert
create policy "lures_select"
  on public.lures for select
  to authenticated using (true);

create policy "lures_insert"
  on public.lures for insert
  to authenticated with check (auth.uid() = created_by);

-- Recommendations: any authenticated user can read; users manage their own rows
create policy "recommendations_select"
  on public.lure_recommendations for select
  to authenticated using (true);

create policy "recommendations_insert"
  on public.lure_recommendations for insert
  to authenticated with check (auth.uid() = user_id);

create policy "recommendations_delete"
  on public.lure_recommendations for delete
  to authenticated using (auth.uid() = user_id);

-- ============================================================
-- Storage bucket
-- Run this separately in Supabase Storage settings, or via:
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('lure-photos', 'lure-photos', true);
--
-- create policy "lure_photos_select"
--   on storage.objects for select
--   to authenticated using (bucket_id = 'lure-photos');
--
-- create policy "lure_photos_insert"
--   on storage.objects for insert
--   to authenticated with check (bucket_id = 'lure-photos');
--
-- create policy "lure_photos_update"
--   on storage.objects for update
--   to authenticated using (bucket_id = 'lure-photos');
