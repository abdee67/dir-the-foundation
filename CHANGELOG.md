# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-07-12

Initial public release.

### Added

- Module registry with vertical presets: ecommerce, courses, services, real estate.
- Commerce: products/variants/categories, discounts, full order lifecycle with returns, in-store POS.
- Local delivery: zones, rider assignment with OTP handoff, COD settlement, courier adapters
  (manual working; Steadfast/Pathao real-shaped, config-gated), public order tracking.
- Receipts & printing: browser print support for store documents.
- CMS: 11-block page builder with drafts/publish/revisions, plus a public storefront (cart,
  checkout, order confirmation).
- Business ops: expense tracking, reports with CSV export (incl. Mushak 6.2 register), audit log,
  settings engine (~30 org-level toggles).
- Multi-tenancy: Postgres RLS on every table, six-tier role hierarchy, platform-admin tier.
- Full documentation set: architecture, conventions, design system, deployment, extending guide,
  operations runbook, phased SaaS-conversion roadmap.
- MIT license.
