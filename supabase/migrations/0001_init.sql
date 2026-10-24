-- ════════════════════════════════════════════════════════════════
-- AI Bridal Atelier — initial schema
-- Run in Supabase SQL Editor, or with `supabase db push`.
-- Images live in Storage; tables only hold paths + metadata.
-- Every private table is protected by row level security (RLS):
-- a user can only read and write their own rows.
-- ════════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner can update"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── design_projects ──────────────────────────────────────────────
create table if not exists public.design_projects (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'My Bridal Design',
  status text not null default 'draft' check (status in ('draft', 'designed', 'approved')),
  overall_instruction text,
  overall_analysis jsonb,
  generated_design jsonb,
  current_version_id uuid,
  cover_path text,
  version_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists design_projects_user_updated_idx
  on public.design_projects (user_id, updated_at desc);

alter table public.design_projects enable row level security;

create policy "projects: owner select" on public.design_projects
  for select using (auth.uid() = user_id);
create policy "projects: owner insert" on public.design_projects
  for insert with check (auth.uid() = user_id);
create policy "projects: owner update" on public.design_projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects: owner delete" on public.design_projects
  for delete using (auth.uid() = user_id);

-- ── reference_images ─────────────────────────────────────────────
create table if not exists public.reference_images (
  id uuid primary key,
  project_id uuid not null references public.design_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('overall', 'component', 'edit')),
  component_type text check (component_type in ('bodice', 'skirt', 'sleeves', 'back', 'train', 'details')),
  component_id uuid,
  storage_path text not null,
  thumbnail_path text,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 15728640),
  user_instruction text,
  analysis jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reference_images_project_idx on public.reference_images (project_id);

alter table public.reference_images enable row level security;

create policy "refs: owner select" on public.reference_images
  for select using (auth.uid() = user_id);
create policy "refs: owner insert" on public.reference_images
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.design_projects p where p.id = project_id and p.user_id = auth.uid())
  );
create policy "refs: owner update" on public.reference_images
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "refs: owner delete" on public.reference_images
  for delete using (auth.uid() = user_id);

-- ── design_briefs (one per project) ──────────────────────────────
create table if not exists public.design_briefs (
  project_id uuid primary key references public.design_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  brief jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.design_briefs enable row level security;

create policy "briefs: owner select" on public.design_briefs
  for select using (auth.uid() = user_id);
create policy "briefs: owner insert" on public.design_briefs
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.design_projects p where p.id = project_id and p.user_id = auth.uid())
  );
create policy "briefs: owner update" on public.design_briefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "briefs: owner delete" on public.design_briefs
  for delete using (auth.uid() = user_id);

-- ── design_versions (append-only history) ────────────────────────
create table if not exists public.design_versions (
  id uuid primary key,
  project_id uuid not null references public.design_projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  width integer not null,
  height integer not null,
  source text not null check (source in ('ai', 'reference-preview')),
  instruction text not null,
  drawing jsonb,
  reference_image_ids uuid[],
  parent_version_id uuid references public.design_versions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index if not exists design_versions_project_idx on public.design_versions (project_id, version_number);

alter table public.design_versions enable row level security;

create policy "versions: owner select" on public.design_versions
  for select using (auth.uid() = user_id);
create policy "versions: owner insert" on public.design_versions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.design_projects p where p.id = project_id and p.user_id = auth.uid())
  );
-- Versions are never edited by clients except re-saving the same row (upsert).
create policy "versions: owner update" on public.design_versions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "versions: owner delete" on public.design_versions
  for delete using (auth.uid() = user_id);

-- ── shared reference library (future, read-only for clients) ─────
create table if not exists public.library_images (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in
    ('bodice','skirt','sleeves','back','train','lace','embroidery','applique','beading','veil')),
  storage_path text not null,
  thumbnail_path text not null,
  width integer not null,
  height integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists library_images_category_idx on public.library_images (category, sort_order);

alter table public.library_images enable row level security;

create policy "library: anyone can read" on public.library_images
  for select using (true);
-- No insert/update/delete policies: only the service role (server/admin) can manage the library.

-- ── keep updated_at fresh ────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists design_projects_touch on public.design_projects;
create trigger design_projects_touch before update on public.design_projects
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════
-- STORAGE
-- Private bucket for customer images. Path layout:
--   {user_id}/user-uploads/{project_id}/{file}
--   {user_id}/generated-designs/{project_id}/{file}
--   {user_id}/design-versions/{project_id}/{file}
--   {user_id}/thumbnails/{project_id}/{file}
--   {user_id}/ai-video/{project_id}/{file}        (future)
-- The first folder must equal the caller's user id.
-- ════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bridal-designs',
  'bridal-designs',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "designs bucket: owner read"
  on storage.objects for select to authenticated
  using (bucket_id = 'bridal-designs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "designs bucket: owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bridal-designs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] in ('user-uploads', 'generated-designs', 'design-versions', 'thumbnails', 'ai-video')
  );

create policy "designs bucket: owner update"
  on storage.objects for update to authenticated
  using (bucket_id = 'bridal-designs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'bridal-designs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "designs bucket: owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'bridal-designs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public, read-only bucket for the shared reference library (managed by admins).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bridal-library', 'bridal-library', true, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
