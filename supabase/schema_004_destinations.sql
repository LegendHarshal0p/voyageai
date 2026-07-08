-- VoyageAI schema migration 004
-- Run this AFTER schema_003. Adds: destinations (a personal wishlist, independent of trips).

create type destination_priority as enum ('someday', 'this_year', 'next_trip');

create table if not exists destinations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  country text,
  notes text,
  priority destination_priority not null default 'someday',
  target_month text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_destinations_user_id on destinations(user_id);
alter table destinations enable row level security;

create policy "Users can manage their own destination wishlist"
  on destinations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
