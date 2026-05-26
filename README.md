Chef's Kitchen 🍔
A full-stack Progressive Web App for Chef's Kitchen — a fast-food restaurant in Navrongo, Ghana. Customers can browse the menu, place orders, pay with Mobile Money or card via Paystack, and track their order in real-time. Kitchen staff manage orders through a live Kanban display; managers handle menus, staff, and settings.

Features
Area	Highlights
Customer	Menu browsing, cart, checkout, pre-ordering, order tracking
Payments	Paystack — MTN MoMo, Vodafone Cash, AirtelTigo Money, card (GHS)
Notifications	FCM push notifications on order status changes
Kitchen	Real-time Kanban board with timers and audio alerts
Manager	Dashboard stats, menu CRUD, order management, staff management
PWA	Installable, offline banner, service worker
Tech Stack
Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
Backend: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
Payments: Paystack
Push Notifications: Firebase Cloud Messaging (FCM)
Local Development
Prerequisites
Node.js ≥ 18
pnpm (npm i -g pnpm)
Supabase CLI (brew install supabase/tap/supabase or see docs)
Setup
# 1. Clone and install
pnpm install

# 2. Copy ironment variables
cp .env.example .env.local
# Then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start dev server
pnpm dev
Supabase Setup
Create a project at supabase.com or use the existing one.
Copy your Project URL and anon key from Settings → API into .env.local.
The database schema is already applied via migrations. To re-apply locally:
supabase db push
Edge Functions are pre-deployed. To redeploy manually:
supabase functions deploy create-paystack-charge
supabase functions deploy verify-paystack-payment
supabase functions deploy send-order-notification
Environment Variables
Frontend (.env.local)
Variable	Description
VITE_SUPABASE_URL	Supabase project URL
VITE_SUPABASE_ANON_KEY	Supabase public anon key
VITE_FCM_VAPID_KEY	(Optional) FCM Web Push VAPID public key
VITE_FIREBASE_*	(Optional) Firebase project config for FCM
Supabase Edge Function Secrets
Set these via the Supabase dashboard (Settings → Edge Functions → Secrets) or CLI:

supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
Secret	Description
PAYSTACK_SECRET_KEY	Paystack secret key (never expose client-side)
FCM_SERVER_KEY	FCM Legacy Server Key for push notifications
Paystack Setup
Sign up / log in at dashboard.paystack.com.
Go to Settings → API Keys & Webhooks.
Copy your Secret Key (use sk_test_... for testing, sk_live_... for production).
Add it as a Supabase secret:
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_key_here
Paystack automatically supports MTN Mobile Money, Vodafone Cash, AirtelTigo Money, and card for GHS transactions — no extra configuration needed.
Firebase Cloud Messaging (FCM) Setup
FCM is optional — the app works fully without it; customers just won't receive push notifications.

Create a Firebase project at console.firebase.google.com.
Add a Web app and copy the config values into .env.local (VITE_FIREBASE_*).
Go to Project Settings → Cloud Messaging and copy the Server Key → set as Supabase secret FCM_SERVER_KEY.
Under Web Push certificates, generate a VAPID key pair and copy the public key → VITE_FCM_VAPID_KEY.
Deployment
Vercel (recommended)
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
Set the following environment variables in your Vercel project settings:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_FCM_VAPID_KEY (optional)
VITE_FIREBASE_* (optional)
Netlify
pnpm build
# Upload the `dist/` folder, or connect via Git
Add the same environment variables in Site Settings → Environment Variables.

Seeded Demo Data
The database is pre-seeded with 17 menu items across 5 categories (Burgers, Sides, Drinks, Desserts, Combos). An admin account can be created by setting the role column in the profiles table to admin after signing up.

Troubleshooting
Issue	Fix
Payment button does nothing	Check PAYSTACK_SECRET_KEY is set in Supabase secrets
Push notifications not arriving	Verify FCM_SERVER_KEY and that the user granted notification permission
Orders not appearing on Kitchen Display	Ensure supabase_realtime publication includes the orders table
Build fails	Run pnpm lint first and fix TypeScript errors