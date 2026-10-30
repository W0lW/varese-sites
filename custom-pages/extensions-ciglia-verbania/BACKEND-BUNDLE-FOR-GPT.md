# FILE 1: custom-pages/extensions-ciglia-verbania/supabase/migrations/001_booking_schema.sql

```sql
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

```

---

# FILE 2: custom-pages/extensions-ciglia-verbania/supabase/functions/booking-api/index.ts

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
import { fromZonedTime, toZonedTime } from "npm:date-fns-tz@3";

const TZ = "Europe/Rome";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OWNER_KEY = Deno.env.get("OWNER_ACTION_API_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("SITE_ORIGIN") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = !origin || ALLOWED_ORIGINS.includes(origin);
  return {
    "access-control-allow-origin": allowed && origin ? origin : (ALLOWED_ORIGINS[0] ?? "null"),
    "access-control-allow-headers": "authorization, apikey, content-type, x-owner-api-key",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "vary": "Origin",
  };
}
function sameSecret(a: string, b: string) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let v = 0; for (let i = 0; i < x.length; i++) v |= x[i] ^ y[i];
  return v === 0;
}
function localDayRange(date: string) {
  const start = fromZonedTime(`${date}T00:00:00`, TZ);
  const nextLocal = new Date(`${date}T12:00:00Z`);
  nextLocal.setUTCDate(nextLocal.getUTCDate() + 1);
  const nextDate = nextLocal.toISOString().slice(0, 10);
  const end = fromZonedTime(`${nextDate}T00:00:00`, TZ);
  return { start, end, nextDate };
}
function validDate(s: string) { return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T12:00:00Z")); }
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) { return aStart < bEnd && bStart < aEnd; }

async function slotsFor(serviceId: string, date: string) {
  if (!validDate(date)) throw new Error("Data non valida: usare YYYY-MM-DD.");
  const { data: service, error: se } = await db.from("services").select("*").eq("id", serviceId).eq("is_active", true).single();
  if (se || !service) throw new Error("Servizio non disponibile.");
  const { start, end } = localDayRange(date);
  const weekday = toZonedTime(start, TZ).getDay();
  const { data: hours, error: he } = await db.from("opening_hours").select("*").eq("weekday", weekday).eq("is_active", true);
  if (he) throw he;
  const { data: appointments, error: ae } = await db.from("appointments").select("starts_at,ends_at").lt("starts_at", end.toISOString()).gt("ends_at", start.toISOString()).in("status", ["pending", "confirmed"]);
  if (ae) throw ae;
  const { data: blocks, error: be } = await db.from("calendar_blocks").select("starts_at,ends_at").lt("starts_at", end.toISOString()).gt("ends_at", start.toISOString());
  if (be) throw be;
  const busy = [...(appointments ?? []), ...(blocks ?? [])].map((x) => [new Date(x.starts_at), new Date(x.ends_at)] as const);
  const duration = (service.duration_minutes + service.buffer_minutes) * 60_000;
  const slots: { starts_at: string; ends_at: string }[] = [];
  for (const h of hours ?? []) {
    const opens = fromZonedTime(`${date}T${h.opens_at}`, TZ);
    const closes = fromZonedTime(`${date}T${h.closes_at}`, TZ);
    for (let t = opens.getTime(); t + duration <= closes.getTime(); t += 15 * 60_000) {
      const s = new Date(t), e = new Date(t + duration);
      if (!busy.some(([bs, be]) => overlaps(s, e, bs, be))) slots.push({ starts_at: s.toISOString(), ends_at: e.toISOString() });
    }
  }
  return { date, timezone: TZ, slots, service: { id: service.id, name: service.name, duration_minutes: service.duration_minutes } };
}

async function createAppointment(body: Record<string, unknown>, source: "website" | "gpt" | "admin") {
  const serviceId = String(body.service_id ?? "");
  const startsAt = new Date(String(body.starts_at ?? ""));
  const customerName = String(body.customer_name ?? "").trim();
  if (!serviceId || !customerName || customerName.length < 2 || Number.isNaN(startsAt.getTime())) throw new Error("Dati appuntamento incompleti o non validi.");
  if (customerName.length > 120 || String(body.notes ?? "").length > 1000) throw new Error("Dati troppo lunghi.");
  const { data: service, error: se } = await db.from("services").select("*").eq("id", serviceId).eq("is_active", true).single();
  if (se || !service) throw new Error("Servizio non disponibile.");
  const endsAt = new Date(startsAt.getTime() + (service.duration_minutes + service.buffer_minutes) * 60_000);
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(startsAt);
  const available = await slotsFor(serviceId, localDate);
  if (!available.slots.some((s) => new Date(s.starts_at).getTime() === startsAt.getTime())) {
    return { conflict: true };
  }
  const { data: settings } = await db.from("booking_settings").select("auto_confirm").eq("id", 1).maybeSingle();
  const status = source === "website" && !settings?.auto_confirm ? "pending" : "confirmed";
  const { data, error } = await db.from("appointments").insert({
    service_id: serviceId, customer_name: customerName,
    customer_email: body.customer_email ? String(body.customer_email).slice(0, 254) : null,
    notes: body.notes ? String(body.notes).slice(0, 1000) : null,
    starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status, source,
  }).select("id,service_id,customer_name,customer_email,starts_at,ends_at,status").single();
  if (error?.code === "23P01") return { conflict: true };
  if (error) throw error;
  return { appointment: data };
}

Deno.serve(async (req) => {
  const headers = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  const origin = req.headers.get("origin") ?? "";
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "Origin non autorizzata." }, 403, headers);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/booking-api/, "") || "/";
  const owner = OWNER_KEY.length > 0 && sameSecret(req.headers.get("x-owner-api-key") ?? "", OWNER_KEY);
  try {
    if (path === "/public/services" && req.method === "GET") {
      const { data, error } = await db.from("services").select("id,name,description,price_cents,duration_minutes").eq("is_active", true).order("sort_order");
      if (error) throw error; return json({ services: data }, 200, headers);
    }
    if ((path === "/public/availability" || path === "/availability") && req.method === "GET") {
      if (path === "/availability" && !owner) return json({ error: "Non autorizzato." }, 401, headers);
      return json(await slotsFor(url.searchParams.get("service_id") ?? "", url.searchParams.get("date") ?? ""), 200, headers);
    }
    if (path === "/public/appointments" && req.method === "POST") {
      const result = await createAppointment(await req.json(), "website");
      if ("conflict" in result) return json({ error: "Lo slot non è più disponibile. Aggiorna le disponibilità." }, 409, headers);
      return json(result, 201, headers);
    }
    if (path === "/appointments" && req.method === "GET") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const from = url.searchParams.get("from") ?? "", to = url.searchParams.get("to") ?? "";
      if (!validDate(from) || !validDate(to) || to < from) return json({ error: "Intervallo date non valido." }, 400, headers);
      const range = localDayRange(to);
      let q = db.from("appointments").select("id,service_id,customer_name,customer_email,notes,starts_at,ends_at,status,source,services(name)").gte("starts_at", localDayRange(from).start.toISOString()).lt("starts_at", range.end.toISOString()).order("starts_at");
      const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
      const { data, error } = await q; if (error) throw error;
      return json({ appointments: data }, 200, headers);
    }
    if (path === "/appointments" && req.method === "POST") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const result = await createAppointment(await req.json(), "gpt");
      if ("conflict" in result) return json({ error: "Lo slot non è più disponibile." }, 409, headers);
      return json(result, 201, headers);
    }
    const appointmentMatch = path.match(/^\/appointments\/([0-9a-f-]+)$/i);
    if (appointmentMatch && req.method === "PATCH") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const body = await req.json(); if (!["pending", "confirmed", "cancelled"].includes(body.status)) return json({ error: "Stato non valido." }, 400, headers);
      const { data, error } = await db.from("appointments").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", appointmentMatch[1]).select("*").single();
      if (error) throw error; return json({ appointment: data }, 200, headers);
    }
    if (path === "/blocks" && req.method === "GET") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const from = url.searchParams.get("from") ?? "", to = url.searchParams.get("to") ?? "";
      if (!validDate(from) || !validDate(to) || to < from) return json({ error: "Intervallo date non valido." }, 400, headers);
      const { data, error } = await db.from("calendar_blocks").select("*").lt("starts_at", localDayRange(to).end.toISOString()).gt("ends_at", localDayRange(from).start.toISOString()).order("starts_at");
      if (error) throw error; return json({ blocks: data }, 200, headers);
    }
    if (path === "/blocks" && req.method === "POST") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const body = await req.json(), start = new Date(String(body.starts_at ?? "")), end = new Date(String(body.ends_at ?? ""));
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end || !String(body.reason ?? "").trim()) return json({ error: "Intervallo o motivo non valido." }, 400, headers);
      const { data: booked, error: checkError } = await db.from("appointments").select("id").in("status", ["pending", "confirmed"]).lt("starts_at", end.toISOString()).gt("ends_at", start.toISOString()).limit(1);
      if (checkError) throw checkError; if (booked?.length) return json({ error: "Esistono appuntamenti in questo intervallo: gestiscili prima di bloccarlo." }, 409, headers);
      const { data, error } = await db.from("calendar_blocks").insert({ starts_at: start.toISOString(), ends_at: end.toISOString(), reason: String(body.reason).slice(0, 240) }).select("*").single();
      if (error) throw error; return json({ block: data }, 201, headers);
    }
    const blockMatch = path.match(/^\/blocks\/([0-9a-f-]+)$/i);
    if (blockMatch && req.method === "DELETE") {
      if (!owner) return json({ error: "Non autorizzato." }, 401, headers);
      const { error } = await db.from("calendar_blocks").delete().eq("id", blockMatch[1]);
      if (error) throw error; return new Response(null, { status: 204, headers });
    }
    return json({ error: "Endpoint non trovato." }, 404, headers);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Errore interno." }, 500, headers);
  }
});

```

---

# FILE 3: custom-pages/extensions-ciglia-verbania/supabase/config.toml

```toml
[functions.booking-api]
verify_jwt = false

```

---

# FILE 4: custom-pages/extensions-ciglia-verbania/openapi/gpt-actions.yaml

```yaml
openapi: 3.1.0
info:
  title: Extensions Ciglia Verbania — Booking API
  version: 0.1.0
  description: Private assistant API for Lola. Reads real availability, lists appointments and manages calendar blocks. All dates use Europe/Rome.
servers:
  - url: https://YOUR_PROJECT_REF.supabase.co/functions/v1/booking-api
security:
  - OwnerApiKey: []
paths:
  /availability:
    get:
      operationId: getAvailability
      summary: Check real available appointment slots
      parameters:
        - name: date
          in: query
          required: true
          schema: { type: string, format: date }
          description: Local date in Europe/Rome, YYYY-MM-DD.
        - name: service_id
          in: query
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Available slots
          content:
            application/json:
              schema:
                type: object
                properties:
                  date: { type: string, format: date }
                  timezone: { type: string, example: Europe/Rome }
                  slots:
                    type: array
                    items:
                      type: object
                      properties:
                        starts_at: { type: string, format: date-time }
                        ends_at: { type: string, format: date-time }
  /appointments:
    get:
      operationId: listAppointments
      summary: List appointments in a date range
      parameters:
        - name: from
          in: query
          required: true
          schema: { type: string, format: date }
        - name: to
          in: query
          required: true
          schema: { type: string, format: date }
        - name: status
          in: query
          schema: { type: string, enum: [pending, confirmed, cancelled] }
      responses:
        "200": { description: Appointments in the requested range }
    post:
      operationId: createAppointment
      summary: Create an appointment after rechecking availability
      description: Rejects overlaps. Use only after an explicit booking request or owner instruction.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [service_id, starts_at, customer_name]
              properties:
                service_id: { type: string, format: uuid }
                starts_at: { type: string, format: date-time }
                customer_name: { type: string, minLength: 2, maxLength: 120 }
                customer_email: { type: string, format: email }
                notes: { type: string, maxLength: 1000 }
      responses:
        "201": { description: Appointment created }
        "409": { description: Slot no longer available }
  /blocks:
    get:
      operationId: listCalendarBlocks
      summary: List owner calendar blocks
      parameters:
        - name: from
          in: query
          required: true
          schema: { type: string, format: date }
        - name: to
          in: query
          required: true
          schema: { type: string, format: date }
      responses:
        "200": { description: Calendar blocks }
    post:
      operationId: createCalendarBlock
      summary: Block a date or time range for the owner
      description: Only after Lola explicitly asks to block the stated period.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [starts_at, ends_at, reason]
              properties:
                starts_at: { type: string, format: date-time }
                ends_at: { type: string, format: date-time }
                reason: { type: string, maxLength: 240 }
      responses:
        "201": { description: Calendar block created }
  /blocks/{block_id}:
    delete:
      operationId: deleteCalendarBlock
      summary: Remove an existing owner block
      parameters:
        - name: block_id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "204": { description: Block removed }
components:
  securitySchemes:
    OwnerApiKey:
      type: apiKey
      in: header
      name: x-owner-api-key

```

---

# FILE 5: custom-pages/extensions-ciglia-verbania/BOOKING-ARCHITECTURE.md

```markdown
# Booking and GPT architecture — Extensions Ciglia Verbania

## Template decision
Use **Sorrel Lite** as the free, commercial-use salon foundation (Mike Smith Design): https://github.com/mikesmithdesign/sorrel-lite
- Responsive one-page salon layout, editorial typography, booking-first section and smooth scrolling.
- Its licence allows commercial client work and modifications without attribution. Keep the original README and LICENSE with the adapted source.
- It is not a 3D storyscroll template by itself. Add a GSAP ScrollTrigger product story with a 3D CSS/WebGL product stage rather than pretending the base template already has it.
- Remove all original demo imagery, business details, opening hours and phone number. Use only client-owned product photos and approved lash-work imagery.

## Booking architecture
**Source of truth:** Supabase Postgres, timezone Europe/Rome.
**API:** Supabase Edge Function `booking-api`.
**Public site:** lists active services and real available slots; creates a booking request/booking. No phone field.
**Private owner interface:** authenticated admin can create date/time blocks, set opening hours, update services and confirm/cancel appointments.
**GPT:** a private Custom GPT Action calls the same API with a dedicated secret API key. It can read availability and appointments, create owner blocks, and manage bookings. It must never use a browser-side key or the Supabase service-role key.

## Rules
- Availability is computed server-side from active services, opening hours, existing non-cancelled appointments and owner blocks.
- Booking creation re-checks availability inside the database transaction and rejects overlapping reservations; a slot shown earlier is not a guarantee.
- Store timestamps in UTC; calculate/display in Europe/Rome.
- Distinguish `pending`, `confirmed`, `cancelled`, and `blocked`.
- GPT may create a block only for an explicit owner instruction; it must repeat the date/time being blocked before executing destructive or broad actions.
- No phone number is collected or published. Email is optional/used only if Lola chooses it for confirmations.
- Add rate limiting, CORS allowlist, audit log, minimal data retention, privacy notice and GDPR deletion process before public launch.

## Not configured yet
No live database, API key, owner account, calendar, booking hours or services have been created. Those require the owner's Supabase connection and business rules. Do not claim the booking system is live until deployment and end-to-end tests pass.

## Information needed from Lola later
- Service names, prices, durations and buffer times.
- Weekly opening hours, breaks, holidays and booking horizon.
- Whether reservations auto-confirm or remain pending for approval.
- Whether email confirmations are desired.
- Owner email for private admin access.

## GPT Action
OpenAPI draft: `openapi/gpt-actions.yaml`. After deployment, replace the placeholder server URL and configure a dedicated API key in the Custom GPT Action authentication settings.

```

---

# FILE 6: custom-pages/extensions-ciglia-verbania/README-BOOKING.md

```markdown
# Booking integration — implementation notes

This is a scaffold, not a live booking service.

## Server-side secrets only
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OWNER_ACTION_API_KEY
- SITE_ORIGIN (CORS allowlist)

Never commit real values or place service-role/owner keys in website JavaScript.

## Public endpoints to implement
- GET /public/services
- GET /public/availability?service_id=...&date=YYYY-MM-DD
- POST /public/appointments

## Owner/GPT endpoints in openapi/gpt-actions.yaml
- GET /availability
- GET /appointments
- POST /appointments
- GET /blocks
- POST /blocks
- DELETE /blocks/{block_id}

Owner routes require x-owner-api-key. Public routes need input validation, rate limiting and anti-bot protection. The Edge Function must re-check the exclusion constraint on insert and return HTTP 409 on conflicts.

## Before launch
1. Create a dedicated Supabase project and apply the migration.
2. Implement/deploy the Edge Function.
3. Configure the site origin and secrets.
4. Set the deployed server URL in openapi/gpt-actions.yaml.
5. Create a private GPT and paste the OpenAPI schema into Actions; set API key auth to custom header x-owner-api-key.
6. End-to-end test availability, booking, owner block, conflict rejection and cancellation.

```
