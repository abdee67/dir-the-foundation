<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/wordmark-dark.svg">
    <img src="brand/wordmark-light.svg" alt="dir" height="72">
  </picture>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-black.svg"></a>
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-black.svg">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-black.svg">
  <a href="CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-black.svg"></a>
</p>

# DIR

**DIR is a free, open-source, self-hosted CMS, ecommerce, and business-management platform
built on Next.js and Supabase** — a multi-tenant alternative to Shopify, Medusa, and Payload for
running many independent businesses from one deployment.

Each organization toggles the modules it needs and picks a vertical preset — ecommerce, courses,
services, or real estate — instead of forking the codebase per business type. It's a practical base
for a SaaS starter, an agency's reusable per-client platform, or a single self-hosted store.

It also ships a deep Bangladesh-market layer most generic platforms skip: cash-on-delivery and
manual bKash/Nagad verification as first-class payment paths, district-based delivery zones with
local courier support (Steadfast, Pathao), Mushak 6.3-compliant invoices for VAT-registered
sellers, and Bangla-ready storefront copy.

## Who it's for

- **Developers** who want a working multi-tenant SaaS starter on Next.js + Supabase instead of
  building the org/module/RLS scaffolding from scratch.
- **Agencies** that build ecommerce or CMS sites for multiple clients and want one reusable,
  self-hosted codebase instead of a per-client rebuild.
- **Bangladeshi businesses and developers** who need COD, local courier delivery, and Mushak-
  compliant invoicing out of the box, not bolted on.
- **Anyone evaluating a self-hosted Shopify, Medusa, or Payload alternative** with commerce, CMS,
  and delivery management already wired together.

## Feature highlights

- **Commerce** — products, variants, categories, discounts, a full order lifecycle with returns, and
  an in-store POS terminal, all sharing one order-creation core.
- **Local delivery & COD** — delivery zones, rider assignment with OTP-confirmed handoff, COD
  settlement batches, courier adapters (manual today; Steadfast/Pathao real-shaped and config-gated),
  and public order tracking.
- **Receipts & printing** — browser-printable store documents without an external PDF service.
- **CMS & storefront** — an 11-block page builder (hero, rich text, product grid, banners, FAQ,
  testimonials, and more) with drafts, publish, and revision history, plus a fast storefront with
  cart, checkout, and order confirmation.
- **Business ops** — expense tracking, sales/delivery/financial reports with CSV export (including a
  Mushak 6.2 register), an audit log, and a settings engine covering ~30 org-level toggles.
- **Multi-vertical modularity** — the same admin shell serves ecommerce, online courses, service
  businesses, and real-estate listings by swapping which modules are enabled.
- **Multi-tenancy & roles** — org-scoped data with Postgres RLS on every table, and a five-level role
  hierarchy (owner/admin/manager/staff/rider/viewer) plus a separate platform-admin tier.

## Tech stack

Next.js 15 (App Router, TypeScript, RSC) + Supabase (Postgres, Auth, Storage, RLS) + Tailwind v4.

## Quickstart

1. **Prerequisites**: Node 20+.
2. `npm install`
3. Create a Supabase project, then apply the schema — SQL Editor → paste and run, in order:
   `supabase/migrations/0001_core.sql` → `0002_commerce.sql` → `0003_delivery_cms_ops.sql` →
   `0004_storefront_public_org_read.sql` (or `supabase db push` via the CLI).
4. Optional demo data — same approach, in order: `supabase/seed/01_core.sql` → `02_commerce.sql` →
   `03_delivery_cms.sql`. Creates a demo org (slug `demo`); see the file's tail comment to link your own
   account as its owner.
5. `cp .env.example .env.local` and fill in your Supabase project URL, anon key, and service role key.
6. `npm run dev`
7. Sign up at `/signup`, then complete the `/onboarding` wizard to create your organization.

## URL patterns

- Public storefront: `/s/[org-slug]`
- Delivery tracking: `/track/[code]`

## Project structure

```
src/app/          routes: (auth), onboarding, (admin)/admin, (store)/s/[org], (print)/print, track, api
src/modules/      one folder per module — module.config.ts + actions.ts + schemas.ts + components/
src/lib/          supabase clients, settings engine, money/audit/notify
src/components/ui shared component primitives
supabase/migrations   0001-0004, apply in order
supabase/seed         01-03, optional demo data (org slug "demo")
docs/             architecture.md, conventions.md, design-system.md, deployment.md (binding contracts)
```

## Docs

- `docs/architecture.md` — binding architecture contract.
- `docs/conventions.md` — binding build conventions.
- `docs/design-system.md` — design tokens and aesthetic.
- `docs/deployment.md` — Vercel + Supabase deploy steps.
- `docs/saas-roadmap.md` — template → commercial SaaS conversion plan (phased, effort-tagged).
- `docs/operations.md` — production runbook (migrations, tenant lifecycle, backups, incidents).
- `docs/extending.md` — developer guide: codebase tour + recipes for modules/blocks/verticals/adapters.
- `.memory/` — shared project memory: context, feature list, next steps, decisions, build log.
- [`CHANGELOG.md`](CHANGELOG.md) — release history.

## Contributing

Contributions are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) for the workflow and
[`docs/extending.md`](docs/extending.md) for step-by-step recipes (add a module, CMS block,
vertical, or courier/payment adapter). This project follows the
[Contributor Covenant](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) — free to use, modify, and self-host, including commercially. No attribution required
(though a star is always appreciated).
