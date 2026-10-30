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
