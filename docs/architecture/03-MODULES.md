# Modules

**Status:** PROPOSED boundaries inside one deployable API. The scan process has object-storage and queue credentials only. The worker applies scan verdicts through the artifacts port (audit AF-4).

## How a module is shaped

Each module exposes:

- **Application port** — the only way another module may call it in-process.
- **Repository** — private. Other modules do not import it.
- **Outbox** — same schema, same transaction as the aggregate write.
- **HTTP controller** — translates OpenAPI to the application port and applies guards.

A lint or architecture test (slice 1 onward) fails if module A imports module B’s repository or schema client. The test is part of the slice 1 acceptance, not optional style.

## Shared kernel

Library only. No tables.

- Identifiers: `UserId`, `SellerId`, `ProductId`, `ProductVersionId`, `OfferId`, `CheckoutId`, `OrderId`, `EntitlementId`, `LedgerEntryId`.
- `Money`: integer `amountMinor`, `currency` (ISO 4217). No floats.
- `CorrelationId`, `IdempotencyKey`, `CausationId`.
- Clock interface for tests.
- Error codes shared with the HTTP layer.

Kernel must not import a module.

## Catalog rule inside modules

`catalog` owns the product. `discovery` owns indexes and **view definitions**. A view definition is configuration:

| view_id | Meaning | Filter (proposed) |
| --- | --- | --- |
| `general` | All public products | visibility public |
| `javascript` | JS/TS lens | **ACCEPTED.** Stacks intersect `{javascript, typescript}` |
| `business_apps` | Business applications | `product_kind = business_application` |

`javascript` is not a product type. `business_application` **is** a product kind because the brief defines that lens by what the product is, while still keeping one row. A business app written in TypeScript has kind `business_application` and stacks that include `typescript`, so both views can list it.

## Module notes

### iam

Invariants: unique email; session revocable; roles `buyer`, `seller`, `admin`; a user may hold buyer and seller together. Admin is not implied by seller. Passwords hashed with a memory-hard algorithm (argon2id **PROPOSED**). Lockout and rate limit on login.

### seller

Invariants: at most one seller profile per user in MVP (studios are **FUTURE**). Payout account stores a provider reference token, never a raw bank account number in our tables if the provider tokenizes. Verification status does not by itself publish listings. Payout submission requires the approved status once policy exists.

### catalog

Invariants: one product, one owner seller, one kind. Slug stable after publish (**PROPOSED**). Unpublish hides the listing. It does not delete versions or orders.

### artifacts

Invariants: version number unique per product; checksum and storage key immutable after upload completion; status follows [state machine](06-STATE-MACHINES.md). Promotion to the private bucket only from `approved` or from “approved and listing published” — bytes move only after scan pass **and** approval. Public bucket never receives the archive.

### discovery

Invariants: document id equals `product_id`. Rebuildable from events. If the index is wrong, commerce is still right.

### pricing

Invariants: an offer used by a checkout is immutable. A price change inserts a new offer and archives the old one. Offer carries `license_code`, `update_policy`, `amount_minor`, `currency`. Legal text is a versioned document id, not a blob rewritten in place.

### checkout

Invariants: session pinned to one seller (A2). One offer per session in MVP. A persistent cart is FUTURE. Snapshot copies money, offer id, version id, commission basis points, and currency. Checkout idempotency keys live here, scoped to the user. Refund and payout keys live in `payments`. Expired sessions cannot capture.

### orders

Invariants: an order exists only after capture is recorded. Order lines match the snapshot. Order status never skips the ledger.

### payments

Invariants: see [11-PAYMENTS-LEDGER-PAYOUTS](11-PAYMENTS-LEDGER-PAYOUTS.md). No other module inserts ledger lines.

### entitlements

Invariants: created from `orders.order_paid`. Download grant checks status, update policy, and takedown guard. Grant does not change the ledger.

### reviews

Invariants: author has an entitlement for the product; one published review per (user, product) (**PROPOSED**, A6). Moderation can hide a review without deleting the sale.

### moderation

Invariants: decisions append-only. Applying a decision emits events; catalog and artifacts apply them to their own rows. Moderator cannot approve their own product (**PROPOSED**).

### notifications

Invariants: consumers are idempotent on event id. Bodies must not include presigned URLs, raw webhook payloads, or secrets.

### admin

Invariants: break-glass artifact read is a separate permission, reason required, expires, alert emitted. Admin list endpoints are paginated and audited when they reveal personal data.

### analytics

Invariants: no entitlement or payment decision reads analytics tables.

## Failure behavior (cross-cutting)

| Failure | Behavior |
| --- | --- |
| Downstream module down during a command that only needs local state | Commit local state and outbox; consumer retries |
| Sync port fails during checkout (pricing) | Abort session creation; no provider call |
| Provider timeout after session created | Session stays `provider_pending`; reconcile job asks provider by idempotency key |
| Consumer throws | Job retries with backoff; poison message after N attempts goes to a failed set and an alert |
| Duplicate event | Consumer unique on `event_id` no-ops |

## Authorization sketch

| Action | buyer | seller (owner) | admin |
| --- | --- | --- | --- |
| Read public listing | yes | yes | yes |
| Create product | no | yes | no |
| Upload to own version | no | yes | no |
| Moderate | no | no | yes |
| Download with entitlement | yes | only if also entitled | break-glass only |
| Read ledger | no | own balance projection | finance role **PROPOSED** as admin flag `finance` |
| Change commission config | no | no | owner/admin **OPEN** who |

`finance` as a distinct role is **PROPOSED** so moderators do not automatically move money.

## Future modules (do not build)

- `services` — custom development engagements.
- Subscriptions and team seats — new offer kinds inside `pricing` only if the owner expands MVP.
- AI search — a replaceable query strategy inside `discovery`.
