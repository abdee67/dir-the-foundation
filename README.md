# DIR (ድር) THE FOUNDATION

![DIR logo](public/brand/dir-logo.jpeg)

DIR (ድር) THE FOUNDATION is a premium single-store clothing ecommerce application for Ethiopia. It combines a polished customer storefront with a focused operations panel for catalog, stock, order, payment, delivery-cost, media, and storefront management.

Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## What is included

### Customer storefront

- Responsive editorial storefront at `/`
- Women, men, and kids collections
- Product galleries, size variants, live availability, sale and expected-restock messaging
- Persistent shopping bag and guest checkout
- Addis Ababa and nationwide delivery-area selection with server-calculated delivery costs
- Manual payment-proof upload and customer order tracking
- About and contact pages, navigation menus, announcement bar, and WhatsApp contact link

### Admin operations

- Premium responsive admin workspace at `/admin`
- Product, category, image, variant, price, and size-stock management
- Inventory adjustments and movement history
- Order review and fulfilment status controls
- Payment-proof verification queue
- Delivery-zone pricing configuration
- Media library with bulk upload support (20 MB per file)
- Staff, audit log, organization settings, and dedicated storefront identity settings
- Homepage hero image, public logo, business details, payment instructions, and menus

## Technology

- Next.js 15 App Router and React Server Components
- TypeScript
- Tailwind CSS v4 and Radix UI primitives
- Supabase Postgres, Auth, Storage, and Row Level Security
- React Hook Form and Zod

## Project structure

```text
src/app/
  (store)/                 Public storefront routes
  (admin)/admin/           Protected admin workspace
  admin/login/             Admin sign-in
src/components/store/      Storefront UI and checkout
src/components/admin/      Admin shell, navigation, media tools
src/modules/               Catalog, orders, settings, CMS, delivery workflows
src/lib/                   Supabase clients, auth, pricing, settings, utilities
supabase/migrations/       Database schema, policies, and hardening migrations
supabase/seed.sql          Single-store starter catalog and delivery data
public/brand/              Public DIR logo used for browser and SEO metadata
```

## Local setup

### 1. Prerequisites

- Node.js 20 or newer
- A Supabase project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local`, then set the values from Supabase Project Settings → API.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORE_SLUG=dir-the-foundation
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it to the browser or commit `.env.local`.

### 4. Apply the database migrations

For a fresh Supabase project, run the SQL files in this exact order through the Supabase SQL Editor or the Supabase CLI:

```text
supabase/migrations/0001_core.sql
supabase/migrations/0002_commerce.sql
supabase/migrations/0003_delivery_cms_ops.sql
supabase/migrations/0004_storefront_public_org_read.sql
supabase/migrations/0005_clothing_store.sql
supabase/migrations/0006_clothing_store_hardening.sql
```

### 5. Load the starter store data

Run [supabase/seed.sql](supabase/seed.sql) after all migrations. It creates:

- The `dir-the-foundation` active store
- Women’s, men’s, and kids’ categories
- Nine clothing products with size-level inventory
- Header and footer menus
- Homepage, About us, and Contact us CMS records
- Addis Ababa and outside-Addis delivery zones
- Example payment instructions and storefront settings

The seed is idempotent: it uses fixed IDs and safe upserts. Replace the placeholder phone number, email address, Telebirr, and CBE details before using it in production.

### 6. Create the first administrator

Create an email/password user in Supabase Authentication, then run the commented `org_members` statement at the end of `supabase/seed.sql` with that user’s UUID. Use the `owner` role for the first account.

### 7. Start the application

```bash
npm run dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin sign-in: `http://localhost:3000/admin/login`

## Store configuration

After signing in as an owner or admin:

1. Go to **Admin → Storefront**.
2. Upload or choose the homepage hero image and logo.
3. Update the business name, phone, email, address, announcement, WhatsApp number, and payment instructions.
4. Go to **Admin → Delivery zones** to set the delivery rates and areas you serve.

The checkout selector reads active delivery-zone areas directly from Supabase, so delivery-zone edits automatically become available to customers.

## Inventory and payment behaviour

- Variant stock is authoritative for products with sizes.
- The product stock total is the aggregate display value of its variants.
- Checkout validates current server-side prices and stock; the client cannot set totals or delivery charges.
- Stock is consumed only when an authorized payment verification successfully progresses the order. Stock can never go below zero.
- `restock_at` is customer communication only. It never changes inventory automatically.

## Commands

```bash
npm run dev        # Start development server
npm run typecheck  # Run TypeScript validation
npm run build      # Create a production build
npm run start      # Start the production build
```

## Production checklist

- Set real Supabase and application URL environment variables.
- Apply all migrations and the reviewed seed data to the target project.
- Create and assign at least one owner account.
- Replace seeded payment-account placeholders.
- Add production product and hero imagery through Admin → Media.
- Confirm storage buckets and RLS policies were created by the migrations.
- Run `npm run typecheck` and `npm run build` before deployment.

## Brand and SEO

The approved logo lives at [public/brand/dir-logo.jpeg](public/brand/dir-logo.jpeg). It is used as the default visible logo, browser icon, PWA manifest icon, social-preview image, and ClothingStore structured-data logo. A store-specific logo selected in Admin → Storefront overrides it in the header and footer.

## License

See [LICENSE](LICENSE).
