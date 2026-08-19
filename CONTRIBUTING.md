# Contributing to Scarpar

Thanks for considering a contribution. Scarpar is a template/platform project — issues, bug fixes,
new modules, adapter implementations (real Steadfast/Pathao/UddoktaPay/FraudBD calls), and docs
fixes are all welcome.

## Before you code

Read the three binding contracts — they're not optional style guides, they're how every existing
file is written:

- [`docs/architecture.md`](docs/architecture.md) — data model, routes, module system, settings engine.
- [`docs/conventions.md`](docs/conventions.md) — server actions, data access, money handling, UI patterns.
- [`docs/design-system.md`](docs/design-system.md) — tokens and aesthetic rules.
- [`docs/extending.md`](docs/extending.md) — step-by-step recipes for adding a module, CMS block,
  vertical, or third-party adapter, each pointing at the smallest real example to copy.

## Workflow

1. Fork, branch off `master`.
2. Follow the conventions above — new code should be indistinguishable from existing code in style.
3. `npm run typecheck && npm run build` must pass before you open a PR (no test suite exists yet;
   these are the gates).
4. Keep PRs scoped to one module/feature. Update the relevant `docs/` file if you change a contract,
   and note the change in `.memory/logs.md` if it's a structural decision.
5. Open a PR describing what changed and why. Screenshots for UI changes are appreciated.

## Reporting bugs / requesting features

Open a GitHub issue. For security issues, do not open a public issue — see
[`SECURITY.md`](SECURITY.md) (or email the maintainer directly if that file doesn't exist yet).

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
