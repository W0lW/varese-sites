-- Extensions Ciglia Verbania — initial booking schema
-- Apply only to a dedicated Supabase project after owner approval.
create extension if not exists btree_gist;

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 180),
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_active boolean not null default true,
  check (opens_at < closes_at),
  unique (weekday, opens_at, closes_at)
);

create table public.calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id),
  customer_name text not null,
  customer_email text,
  notes text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  source text not null default 'website' check (source in ('website','gpt','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  constraint no_overlapping_live_appointments
    exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&)
    where (status in ('pending','confirmed'))
);

create index appointments_starts_at_idx on public.appointments(starts_at);
create index blocks_starts_at_idx on public.calendar_blocks(starts_at);

alter table public.services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.calendar_blocks enable row level security;
alter table public.appointments enable row level security;

-- No anon/authenticated policies are intentionally created. Use the Edge Function
-- as the authorization and validation boundary. Never expose service_role.


create table public.booking_settings (
  id integer primary key default 1 check (id = 1),
  auto_confirm boolean not null default false,
  timezone text not null default 'Europe/Rome',
  slot_interval_minutes integer not null default 15 check (slot_interval_minutes between 5 and 60),
  max_days_ahead integer not null default 90 check (max_days_ahead between 1 and 365),
  min_notice_hours integer not null default 2 check (min_notice_hours between 0 and 168)
);
insert into public.booking_settings (id) values (1) on conflict (id) do nothing;
alter table public.booking_settings enable row level security;
