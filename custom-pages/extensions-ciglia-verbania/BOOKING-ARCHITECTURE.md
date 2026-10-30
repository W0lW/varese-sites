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
