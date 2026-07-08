-- VoyageAI schema migration 002
-- Run this AFTER schema.sql. Adds: hotels, restaurants, packing_list_items, documents.

-- ─────────────────────────────────────────────────────────
-- HOTELS
-- ─────────────────────────────────────────────────────────
create table if not exists hotels (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  address text,
  check_in date,
  check_out date,
  price_per_night numeric(10, 2),
  confirmation_number text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotels_trip_id on hotels(trip_id);
alter table hotels enable row level security;

create policy "Users can manage hotels of their own trips"
  on hotels for all using (
    exists (select 1 from trips where trips.id = hotels.trip_id and trips.user_id = auth.uid())
  )
  with check (
    exists (select 1 from trips where trips.id = hotels.trip_id and trips.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- RESTAURANTS
-- ─────────────────────────────────────────────────────────
create table if not exists restaurants (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  cuisine text,
  address text,
  reservation_time timestamptz,
  price_range text,
  rating numeric(2, 1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_restaurants_trip_id on restaurants(trip_id);
alter table restaurants enable row level security;

create policy "Users can manage restaurants of their own trips"
  on restaurants for all using (
    exists (select 1 from trips where trips.id = restaurants.trip_id and trips.user_id = auth.uid())
  )
  with check (
    exists (select 1 from trips where trips.id = restaurants.trip_id and trips.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- PACKING LISTS (items belong directly to a trip; no separate "list" row needed)
-- ─────────────────────────────────────────────────────────
create table if not exists packing_list_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  item text not null,
  category text not null default 'general',
  is_packed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_packing_items_trip_id on packing_list_items(trip_id);
alter table packing_list_items enable row level security;

create policy "Users can manage packing items of their own trips"
  on packing_list_items for all using (
    exists (select 1 from trips where trips.id = packing_list_items.trip_id and trips.user_id = auth.uid())
  )
  with check (
    exists (select 1 from trips where trips.id = packing_list_items.trip_id and trips.user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────
-- DOCUMENTS (uploaded files + Groq Vision extraction results)
-- ─────────────────────────────────────────────────────────
create type document_category as enum (
  'passport', 'visa', 'ticket', 'hotel_booking', 'receipt', 'map', 'photo', 'other'
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  category document_category not null default 'other',
  extracted_text text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_trip_id on documents(trip_id);
create index if not exists idx_documents_user_id on documents(user_id);
alter table documents enable row level security;

create policy "Users can manage their own documents"
  on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage buckets used by document upload (passports/tickets in addition to schema.sql's set)
insert into storage.buckets (id, name, public) values ('passports', 'passports', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('tickets', 'tickets', false)
  on conflict (id) do nothing;
