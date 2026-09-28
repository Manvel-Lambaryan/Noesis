# Data ownership

**Status:** ACCEPTED on 2026-09-28. One PostgreSQL database. Four schemas: `identity`, `catalog`, `commerce`, `ops`. Modules still own their tables. No foreign keys across modules. No cross-schema foreign keys.

## Why no cross-schema foreign keys

A foreign key from `orders` to `catalog.products` would let one module’s migration break another and would invite joins that become hidden writes. Integrity across modules is checked at the application port when the snapshot is taken, then rechecked by reconciliation. Orphan risk is accepted and monitored: a nightly job lists orders whose `product_id` is unknown to a catalog read-model copy inside `orders` (the snapshot includes title and slug, so the order still renders if catalog is down).

## Schema ownership

| Schema | Writing modules | Tables (representative) | Others may |
| --- | --- | --- | --- |
| `identity` | `iam`, `seller` | users, credentials, sessions, role_assignments; seller profiles, verification cases, payout-account refs; each module’s outbox | Session reads go through the iam port. Verification reads go through the seller port |
| `catalog` | `catalog`, `artifacts`, `discovery`, `pricing` | products, stacks, tags, categories; versions, scan reports; discovery documents; offers, license texts; each module’s outbox | Public product via the catalog port or the discovery index. Version state via the artifacts port. Quotes via the pricing port. Nobody else writes discovery documents |
| `commerce` | `checkout`, `orders`, `payments`, `entitlements`, `reviews` | checkout sessions and checkout idempotency keys; orders; ledger, webhook inbox, payouts, refund idempotency; entitlements, download grants; reviews | Payments is the only ledger writer |
| `ops` | `moderation`, `notifications`, `admin`, `analytics` | decisions, appeals; notification messages; audit events, break-glass grants; funnel read models | Audit append is the shared insert port. Analytics is not a source of money or access |

Sharing a schema does not allow one module to write another module’s tables. Slice 1 creates the schemas. Slice 2 adds `identity.users`, `identity.sessions`, `identity.role_assignments`, `identity.admin_permissions`, `identity.auth_tokens` (iam) and `identity.seller_profiles` (seller). `seller_profiles.user_id` has no foreign key because iam and seller are different modules. Session and token rows may reference `users` because those tables belong to iam.

Slice 3 adds catalog-owned `categories`, `products`, `product_stacks`, `product_tags`, `preview_images`, and `preview_intents`. `products.seller_id` has no foreign key to `users`. Preview object keys must start with `previews/` and must not contain `quarantine`. Discovery owns `discovery_views` and `discovery_documents` in the same PostgreSQL schema, with no foreign key to `products`. `discovery_documents.product_id` is the primary key. A trigger maintains `search_vector` because `to_tsvector` is not immutable and cannot be a generated column. Rebuild reads the catalog port and the artifacts sellability port, then upserts or deletes discovery rows.

Slice 4 adds artifacts-owned `product_versions`, `upload_intents`, and `scan_reports` in the catalog schema. `product_versions.product_id` and `seller_id` have no foreign keys. `upload_intents.version_id` references `product_versions` inside the artifacts module. A check constraint keeps `object_key` under `quarantine/` and out of `previews/`.

Slice 5 adds `catalog.artifact_outbox` and `catalog.catalog_outbox` (indexed, not unique on subject and type, so a later takedown or appeal can emit another event). A check constraint keeps `private_key` null or shaped as `private/{productId}/{versionId}/{sha256}` and rejects `..`, `quarantine`, and `previews`. Ops-owned `moderation_decisions`, `appeals`, and `audit_events` have no foreign keys. One open appeal per product is a partial unique index. The commerce schema is unchanged.

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
