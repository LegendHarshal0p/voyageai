-- VoyageAI database schema
-- Run this in the Supabase SQL editor. Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).

-- ─────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────────────────
-- TRIPS
-- ─────────────────────────────────────────────────────────
create type trip_status as enum ('planning', 'upcoming', 'active', 'completed', 'cancelled');

create table if not exists trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  status trip_status not null default 'planning',
  cover_image_url text,
  budget_total numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_date_range check (end_date >= start_date)
);

create index if not exists idx_trips_user_id on trips(user_id);
create index if not exists idx_trips_status on trips(status);
create index if not exists idx_trips_dates on trips(start_date, end_date);

alter table trips enable row level security;

create policy "Users can view their own trips"
  on trips for select using (auth.uid() = user_id);
create policy "Users can insert their own trips"
  on trips for insert with check (auth.uid() = user_id);
create policy "Users can update their own trips"
  on trips for update using (auth.uid() = user_id);
create policy "Users can delete their own trips"
  on trips for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- TRIP DAYS
-- ─────────────────────────────────────────────────────────
create table if not exists trip_days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null,
  date date not null,
  summary text,
  unique (trip_id, day_number)
);

create index if not exists idx_trip_days_trip_id on trip_days(trip_id);

alter table trip_days enable row level security;

create policy "Users can view days of their own trips"
  on trip_days for select using (
    exists (select 1 from trips where trips.id = trip_days.trip_id and trips.user_id = auth.uid())
  );
create policy "Users can insert days into their own trips"
  on trip_days for insert with check (
    exists (select 1 from trips where trips.id = trip_days.trip_id and trips.user_id = auth.uid())
  );
create policy "Users can update days of their own trips"
  on trip_days for update using (
    exists (select 1 from trips where trips.id = trip_days.trip_id and trips.user_id = auth.uid())
  );
create policy "Users can delete days of their own trips"
  on trip_days for delete using (
    exists (select 1 from trips where trips.id = trip_days.trip_id and trips.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────────────────
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  trip_day_id uuid not null references trip_days(id) on delete cascade,
  title text not null,
  description text,
  start_time text,
  location text,
  cost numeric(10, 2),
  category text not null default 'general',
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_trip_day_id on activities(trip_day_id);

alter table activities enable row level security;

create policy "Users can view activities of their own trips"
  on activities for select using (
    exists (
      select 1 from trip_days
      join trips on trips.id = trip_days.trip_id
      where trip_days.id = activities.trip_day_id and trips.user_id = auth.uid()
    )
  );
create policy "Users can insert activities into their own trips"
  on activities for insert with check (
    exists (
      select 1 from trip_days
      join trips on trips.id = trip_days.trip_id
      where trip_days.id = activities.trip_day_id and trips.user_id = auth.uid()
    )
  );
create policy "Users can update activities of their own trips"
  on activities for update using (
    exists (
      select 1 from trip_days
      join trips on trips.id = trip_days.trip_id
      where trip_days.id = activities.trip_day_id and trips.user_id = auth.uid()
    )
  );
create policy "Users can delete activities of their own trips"
  on activities for delete using (
    exists (
      select 1 from trip_days
      join trips on trips.id = trip_days.trip_id
      where trip_days.id = activities.trip_day_id and trips.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  amount numeric(10, 2) not null,
  description text,
  spent_at date not null default current_date
);

create index if not exists idx_expenses_trip_id on expenses(trip_id);

alter table expenses enable row level security;

create policy "Users can manage their own expenses"
  on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- AI HISTORY
-- ─────────────────────────────────────────────────────────
create table if not exists ai_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  prompt text not null,
  response text not null,
  feature text not null,
  created_at timestamptz not null default now()
);

alter table ai_history enable row level security;

create policy "Users can view their own AI history"
  on ai_history for select using (auth.uid() = user_id);
create policy "Users can insert their own AI history"
  on ai_history for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- updated_at TRIGGER for trips
-- ─────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trips_set_updated_at on trips;
create trigger trips_set_updated_at
  before update on trips
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────
-- Auto-create profile row on signup
-- ─────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('profile-images', 'profile-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('trip-images', 'trip-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own files"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);
