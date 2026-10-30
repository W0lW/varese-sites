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
