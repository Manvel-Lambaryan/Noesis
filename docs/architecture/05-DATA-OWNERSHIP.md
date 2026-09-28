# Data ownership

**Status:** PROPOSED. One PostgreSQL database. One schema per module. No cross-schema foreign keys.

## Why no cross-schema foreign keys

A foreign key from `orders` to `catalog.products` would let one module’s migration break another and would invite joins that become hidden writes. Integrity across modules is checked at the application port when the snapshot is taken, then rechecked by reconciliation. Orphan risk is accepted and monitored: a nightly job lists orders whose `product_id` is unknown to a catalog read-model copy inside `orders` (the snapshot includes title and slug, so the order still renders if catalog is down).

## Schema ownership

| Schema | Writer module | Tables (representative) | Others may |
| --- | --- | --- | --- |
| `iam` | iam | users, credentials, sessions, role_assignments, outbox | Read a session only through the iam port |
| `seller` | seller | profiles, verification_cases, payout_accounts, outbox | Read verification via port |
| `catalog` | catalog | products, stacks, tags, categories, outbox | Read public product via port or discovery index |
| `artifacts` | artifacts | versions, scan_reports, outbox | Read version state via port |
| `discovery` | discovery | documents, view_definitions | Nobody else writes |
| `pricing` | pricing | offers, license_texts, outbox | Quote via port |
| `checkout` | checkout | sessions, checkout idempotency keys, outbox | — |
| `orders` | orders | orders, order_lines, inbox, outbox | — |
| `payments` | payments | ledger_entries, accounts, webhook_inbox, payout_instructions, provider_events, refund and payout idempotency keys | No other writer |
| `entitlements` | entitlements | entitlements, download_grants, inbox | Check via port |
| `reviews` | reviews | reviews, inbox | — |
| `moderation` | moderation | decisions, appeals, outbox | — |
| `notifications` | notifications | messages, inbox | — |
| `admin` | admin | audit_events, break_glass_grants | Append audit via port from other modules |
| `analytics` | analytics | funnel_daily, inbox | Read-only to humans |

Audit append may be a port implemented as a same-transaction write into `admin.audit_events`. That is a **deliberate exception**: the audit port is shared infrastructure, like the outbox helper. It is not a general “write another module’s tables” permission. The port accepts an already-built audit record and inserts one row. It does not update business tables.

### Capture transaction

Payment capture is the other deliberate exception. The webhook composition root opens **one** database transaction and calls ports, in this order: `payments` (inbox, journal), `orders` (order row), `checkout` (session `completed`). Each port writes only its own schema. No module imports another module’s repository. There are still no cross-schema foreign keys. If any port fails, the whole transaction rolls back and the provider redelivers.

Entitlements are **not** in that transaction. They consume `orders.order_paid` from the outbox so a slow download-side failure cannot force the provider to retry a charge that was already recorded.

## Copy vs reference

| Fact | Where the copy lives | Why a copy |
| --- | --- | --- |
| Price, currency, commission bps | `checkout.sessions`, repeated on `orders` | Offer can be archived later |
| Product title, slug, version label | `orders.order_lines` | Listing edits must not rewrite history |
| sha256, object key | `artifacts` only | Entitlement stores ids; delivery asks artifacts for the current key if policy allows a newer version |
| Seller display name | snapshot on order | Profile renames |
| Email | `iam` only | Other modules store `user_id` |

## Read models

| Model | Built from | Used for |
| --- | --- | --- |
| `discovery.documents` | catalog + artifacts + pricing public fields | Search and lenses |
| Seller balance | `payments.ledger_entries` | Seller UI, payout eligibility |
| Admin queue | moderation + artifacts states | Review UI |
| Analytics funnel | domain events | Dashboards, never access control |

Rebuild procedure for every read model: truncate projection, replay inbox or re-read public events, idempotent upserts. Replay is a documented operation in slice 3 (discovery) and slice 10 (balances).

## Migration rules

- A module’s migration touches only its schema, plus the audit insert function if shared.
- Expanding a column is backward compatible. Renaming a public event field requires a new event version (`catalog.listing_published.v2`), not a silent edit.
- Ledger migrations may add accounts. They do not edit posted amounts.

## Retention (OPEN periods)

| Data | Default stance until counsel decides |
| --- | --- |
| Ledger, orders, payouts | Keep for the financial period required by the launch jurisdiction |
| Sessions | Delete or revoke on logout and after TTL |
| Quarantine objects after reject | Delete after a short window once the report is stored (**PROPOSED** 7 days, not approved) |
| Private artifacts | Keep while any entitlement might still be valid under update policy; then **OPEN** |
| Scan reports | Keep with the version |
| Webhook payloads | Keep for dispute evidence; redact card data (provider should never send PAN) |
| Account erasure | Anonymize `iam` profile, keep ledger with a detached subject id |

## Backup ownership

PostgreSQL backups include all schemas. A restore is all-or-nothing at the instance level for MVP. Module-level restore is **FUTURE** and easy to get wrong; do not promise it.

Object storage versioning: **PROPOSED** on the private bucket so an overwrite accident is recoverable. Application code still treats keys as immutable.
