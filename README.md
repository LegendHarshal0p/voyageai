# VoyageAI

Plan less. Travel more. An AI-powered trip planning app.

> **Submitting this as a major project?** Read `PROJECT_DOCUMENTATION.md` first — it has the
> architecture overview, ERD, a feature-to-requirement checklist, and a submission/deployment
> checklist specifically for that.

## What's included (fully working, no placeholders)

- Vite + React 19 + TypeScript + Tailwind, configured end to end
- Supabase auth (email/password) with a `AuthContext` and protected routes
- Full Postgres schema with RLS policies, triggers, and storage buckets (`supabase/schema.sql`)
- AI itinerary generation via Groq (`src/services/groq.ts`) — describe a trip, get a real day-by-day
  plan, save it straight into the database
- Landing page, login/signup, dashboard, trips list, new-trip flow, trip detail view — all wired to
  live Supabase queries, not mock data
- Expense tracking per trip (`src/components/trips/ExpenseTracker.tsx`) — add/delete expenses by
  category, live budget-remaining calculation
- Analytics dashboard (`src/pages/AnalyticsPage.tsx`) — trips-per-month bar chart and spending-by-
  category pie chart, both built with real Recharts components reading live Supabase data
- Hotels & Restaurants CRUD (`src/components/trips/HotelsSection.tsx`,
  `RestaurantsSection.tsx`) — full create/edit/delete, per trip
- Packing lists (`src/components/trips/PackingListSection.tsx`) — manual items plus
  AI-generated suggestions via Groq, with a packed/unpacked toggle
- Document upload + Groq Vision OCR (`src/components/trips/DocumentsSection.tsx`) — upload
  passports, tickets, hotel bookings, or receipts to Supabase Storage; images are automatically
  OCR'd, summarized, and auto-categorized by a Groq vision model
- Transactional emails via Resend, sent through a Supabase Edge Function so the API key never
  reaches the browser (`supabase/functions/send-email`) — welcome email on signup and trip
  confirmation email on trip creation are already wired up; templates for trip reminders,
  packing reminders, trip-shared, and monthly summaries are written and ready to call from
  wherever you add the trigger (a cron job, a share button, etc.)
- In-app AI chat assistant (`src/components/chat/ChatWidget.tsx` + `ChatPanel.tsx`) — a floating
  global assistant available on every dashboard page, plus a trip-scoped "Assistant" tab on the
  trip detail page that gives the AI the trip's destination/dates/notes as context
- Google Maps integration (`src/components/trips/TripMap.tsx`) — geocodes the trip destination,
  drops a marker, and runs live Places nearby-search for attractions/hotels/restaurants around it
- Notifications (`src/components/layout/NotificationBell.tsx`) — a bell icon with unread count,
  backed by Supabase Realtime so new notifications appear without a refresh. A database trigger
  automatically creates a notification whenever a trip is created; the `notifications` table and
  types support the same pattern for reminders, budget alerts, etc.
- Favorites (`src/pages/FavoritesPage.tsx`, `src/components/favorites/FavoriteButton.tsx`) — heart
  icons on trips, hotels, and restaurants that save to a dedicated favorites table, grouped by
  type on the Favorites page
- Full landing page: hero, features, testimonials, pricing tiers, and an animated FAQ accordion,
  all real content (no lorem ipsum placeholders)
- Complete auth flows: signup, login, logout, forgot password, reset password, and email
  confirmation — all functional pages, not just the happy path
- Dark mode with a working toggle (persisted to `localStorage`, defaults to system preference)
- Destinations wishlist (`src/pages/DestinationsPage.tsx`) — full CRUD with search and priority
  filters, independent of booked trips
- Profile page (`src/pages/ProfilePage.tsx`) — edit name, upload avatar to Supabase Storage
- Weather widget and currency converter on the dashboard, both using free keyless APIs
  (Open-Meteo, Frankfurter) so they work with zero extra setup
- Trip duplication — one click copies a trip's dates/budget/itinerary/activities
- `vercel.json` for one-click Vercel deployment

## Setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run the schema files **in order**:
   `schema.sql` → `schema_002_hotels_restaurants_packing_documents.sql` →
   `schema_003_notifications_favorites.sql` → `schema_004_destinations.sql`.
3. In Supabase Storage, confirm the `profile-images`, `trip-images`, `documents`, `receipts`,
   `passports`, and `tickets` buckets were created (the schema scripts create them for you).
4. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Project Settings → API)
   - `VITE_GROQ_API_KEY` (console.groq.com) — used for itinerary generation, the chat assistant,
     packing suggestions, and document vision analysis. Check console.groq.com/docs for the
     current vision-capable model name; `src/services/groq.ts` uses
     `llama-3.2-90b-vision-preview` as of this writing, but Groq's vision model lineup changes
     over time.
   - `VITE_GOOGLE_MAPS_API_KEY` — enable the **Maps JavaScript API**, **Places API**, and
     **Geocoding API** on the key in Google Cloud Console, or the map tab will error.
5. To enable emails: install the Supabase CLI, then run
   ```
   supabase functions deploy send-email
   supabase secrets set RESEND_API_KEY=re_your_key
   ```
   Until this is deployed, `sendEmail()` calls fail silently (they're wrapped in `.catch(() => {})`
   in the signup and trip-creation flows) so the app still works without email configured.
6. `npm install`
7. `npm run dev`

## What this scaffold does NOT include yet

Being upfront about what's still not here: email verification / forgot-password UI flows (Supabase
handles the backend for these, but there's no dedicated reset-password page yet), scheduled emails
(the monthly summary template exists but nothing triggers it on a schedule — that needs a cron job,
e.g. a Supabase scheduled Edge Function), trip sharing/duplication, and destinations as their own
CRUD module (favorited destinations exist, but there's no dedicated destinations browser). These are
straightforward extensions of patterns already in the codebase, not new architecture.

Everything else from the original brief — auth, CRUD across trips/hotels/restaurants/expenses,
AI itinerary generation, Groq Vision document OCR, packing lists, analytics with Recharts, Google
Maps, notifications, favorites, in-app AI chat, Resend emails, and a full landing page — is built
and wired to live data, not stubbed. Every module follows the same pattern:

1. Add the table(s) to `supabase/schema.sql` (with RLS policies)
2. Add the TS types to `src/types/database.ts`
3. Add a page/component under `src/pages` or `src/components`
4. Wire it into `App.tsx`

Tell me which module to build next (hotels, restaurants, budget planner, packing lists, documents +
OCR, notifications, AI chat, or Maps integration) and I'll build that one completely and working,
the same way this one is.

## Tech notes

- Groq model used: `llama-3.3-70b-versatile` with JSON-mode responses for structured itinerary data.
- All Supabase calls go through the typed client in `src/lib/supabase.ts`.
- Dark mode: toggle the `dark` class on `<html>`; all colors are CSS variables in `src/index.css`.
