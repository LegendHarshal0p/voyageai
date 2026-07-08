-- VoyageAI schema migration 003
-- Run this AFTER schema_002. Adds: notifications, favorites.

-- ─────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────
create type notification_type as enum (
  'trip_reminder', 'packing_reminder', 'trip_shared', 'ai_ready', 'budget_alert', 'system'
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  trip_id uuid references trips(id) on delete cascade,
  type notification_type not null default 'system',
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_is_read on notifications(user_id, is_read);

alter table notifications enable row level security;

create policy "Users can manage their own notifications"
  on notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- FAVORITES (generic — can favorite a destination string, or a specific hotel/restaurant)
-- ─────────────────────────────────────────────────────────
create type favorite_type as enum ('destination', 'hotel', 'restaurant');

create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type favorite_type not null,
  reference_id uuid,
  label text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type, label)
);

create index if not exists idx_favorites_user_id on favorites(user_id);

alter table favorites enable row level security;

create policy "Users can manage their own favorites"
  on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- Trigger: notify user when a trip is created
-- ─────────────────────────────────────────────────────────
create or replace function notify_trip_created()
returns trigger as $$
begin
  insert into notifications (user_id, trip_id, type, title, message)
  values (
    new.user_id,
    new.id,
    'system',
    'Trip created',
    'Your trip to ' || new.destination || ' has been added.'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_trip_created_notify on trips;
create trigger on_trip_created_notify
  after insert on trips
  for each row execute function notify_trip_created();
