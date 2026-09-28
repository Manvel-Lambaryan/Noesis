# Development roadmap

**Status:** PROPOSED execution plan. **Not a start order.** Gate A in [PROGRESS](../PROGRESS.md) comes first. This file adds tasks and a definition of done. Dependency order stays in [16-MVP-SLICES](16-MVP-SLICES.md). If they disagree on sequence, 16 wins. If they disagree on a security task added by the audit, this file wins.

No dates. Staffing is unknown. Do not build two slices that touch the same module at the same time. Finish the slice’s definition of done before opening the next one on that chain.

## Phases

| Phase | Slices | Business result | Do not start before |
| --- | --- | --- | --- |
| 0. Alignment | Audit | Owner accepts or amends Gate A | — |
| 1. Foundation | 1, 2 | A person can register, sign in, and be denied the wrong role | Gate A |
| 2. Supply | 3, 4, 5, 6 | A seller can draft one product, upload a file, pass review, and show a price | Phase 1 done |
| 3. Purchase | 7, 8 | A buyer can pay in the fake provider and download once | Slices 5 and 6 done |
| 4. After sale | 9, 10, 11 | Review, sandbox payout, email, appeal, basic counts | Slice 8 done for 9 and 10. Slice 2 is enough to start notification plumbing, not the templates that mention purchases |

Slices 3 then 6 may proceed while slice 4 is in review only if they do not share a branch that edits `catalog` and `artifacts` together. Preferred path is still the arrow order in slice 16.

## Global definition of done

A slice is done when all of the following are true:

- The business objective in this file works in local and CI against the fake provider and local buckets.
- Acceptance tests named for that slice are green, including the security tests.
- OpenAPI matches [08-API-CONTRACTS](08-API-CONTRACTS.md).
- No cross-module repository import.
- Logs carry a correlation id and do not contain passwords, cookies, presigned URLs, or raw webhook bodies.
- Feature flags for checkout, refunds, and payouts default off outside a developer machine until that slice is accepted.
- [PROGRESS](../PROGRESS.md) has one short note: what landed, which questions are still OPEN.
- Rollback in slice 16 is still possible (flags or previous image, no ledger edits).

## Backlog

### Slice 1 — Skeleton

| | |
| --- | --- |
| Objective | A developer can run web, API, worker, and scan shells locally and see a health check. |
| Scope | Empty modules, OpenAPI stub, JSON logs, correlation id, CI, Compose for Postgres and Redis. No listings and no payments. |
| Technical | Monorepo layout from the technical card. Import-boundary test. Scan image has no database URL. |
| Depends on | Gate A. |
| Tasks | Create apps. Health route. CI secret scan. `.env.example` remains names only. |
| Security | Secret scan fails the build on a private key. API docs do not embed credentials. |
| Tests | CI green. A forbidden import fixture fails the architecture test. |
| Acceptance | Health returns ok. A log line includes `correlationId`. Scan config cannot see `DATABASE_URL`. |
| Done | Global definition plus this acceptance. |

### Slice 2 — Identity

| | |
| --- | --- |
| Objective | Buyers and sellers have accounts. Admins are separate. Wrong roles are rejected. |
| Scope | Register, email verification, login, logout, password reset, session stored in Postgres, roles `buyer`, `seller`, `admin`. Seller profile draft. BFF cookie. |
| Technical | Argon2id. Session revoke. Lockout. `finance` is a permission on admin, not a power every moderator has. |
| Depends on | Slice 1. |
| Tasks | Auth routes. Email verification token. Reset token. Guard helper that fails closed. Seller profile `PUT`. |
| Security | HttpOnly session cookie. No password in logs. Rate limit login and reset. Email token single use. |
| Tests | Buyer receives 403 on an admin route. Revoked session cannot call `GET /v1/auth/session`. Reset token cannot be reused. |
| Acceptance | The tests above pass. Unverified email cannot open seller publish later (the publish guard itself lands in slice 5 and must call this flag). |
| Done | Global definition. Q20 can still change whether verification is required to publish; the email flag must exist either way. |

### Slice 3 — Catalog and lenses

| | |
| --- | --- |
| Objective | One product can appear in the general lens, the JS/TS lens, and the business-app lens without a second catalog. |
| Scope | Draft product, kind, stacks, tags, category, public pages, discovery documents. Preview images use a separate small upload, not the archive presign. |
| Technical | `discovery.documents` primary key is `product_id`. `view.javascript.mode` defaults to `stack` and is labeled a default, not an owner decision. |
| Depends on | Slice 2. |
| Tasks | Product CRUD for the owner. Public GET. SSR pages. Rebuild command for the index. Preview upload allowlist (`image/png`, `image/jpeg`, `image/webp`) and a size cap. |
| Security | Another seller’s draft is 404. Rate limit creates. Preview upload cannot target the quarantine prefix. |
| Tests | One `business_application` with stack `typescript` returns in both relevant views and has one id. Anonymous draft is 404. |
| Acceptance | Those tests pass. No `javascript_products` table exists. |
| Done | Global definition. |

### Slice 4 — Upload and scan

| | |
| --- | --- |
| Objective | A seller can upload an archive that stays off the public internet until it is scanned. |
| Scope | Upload intent, presigned PUT to quarantine, complete, scan process, verdict on the queue, worker writes `pending_moderation` or `scan_rejected`. |
| Technical | Worker computes `sha256`. Scan container has storage and queue credentials only. Caps from the NFR doc are fixtures until Q14 is approved. |
| Depends on | Slice 3. |
| Tasks | Intent and complete routes. Scan image. Fixtures for path traversal and compression bombs. Lease so two scanners cannot both pass the same object. |
| Security | No extract-and-run path on the API image. Failed verdict does not copy to the private bucket. |
| Tests | Traversal fixture ends in `scan_rejected`. Happy path ends in `pending_moderation` with a server-computed checksum. |
| Acceptance | Those tests pass. API environment has no scanner entrypoint. |
| Done | Global definition. |

### Slice 5 — Moderation

| | |
| --- | --- |
| Objective | Nothing becomes public or sellable until a person approves it, and a takedown removes it from search. |
| Scope | Queue, approve, reject with a note, private-bucket copy, takedown, seller appeal route, audit row. |
| Technical | Sellable only when state is `approved` and `private_key` is set. Emit `artifacts.object_promoted` and `artifacts.version_withdrawn`. Q20 guard is a single function with the unimplemented branch explicit. |
| Depends on | Slice 4. |
| Tasks | Admin decision route. Promotion worker. Appeal route `POST /v1/seller/listings/{id}/appeals`. Takedown hides the discovery document and blocks new grants. |
| Security | Moderator cannot approve their own product. Audit row in the same transaction. Private bucket blocks public ACLs in staging policy tests. |
| Tests | Rejected and unscanned versions are absent from public GET. Approve without a private copy is not sellable. Takedown removes the document. Ledger tables are untouched. |
| Acceptance | Those tests pass. |
| Done | Global definition. |

### Slice 6 — Price and license

| | |
| --- | --- |
| Objective | A buyer can see a price and a license summary. Changing the price does not rewrite an old offer. |
| Scope | Immutable offers, archive, public price, snapshot function. No charge. Demo field is an external URL rendered as a link. |
| Technical | New price creates a new offer id. `license_code` and `update_policy` are stored. Production config leaves them empty until the owner sets them. |
| Depends on | Slice 3. Checkout also needs slice 5. |
| Tasks | Offer routes. Public price on the listing. Snapshot helper used by slice 7. |
| Security | Do not server-fetch the demo URL. |
| Tests | After a price change, the old offer id still has the old amount. |
| Acceptance | That test passes. No provider call exists in this slice. |
| Done | Global definition. |

### Slice 7 — Checkout and ledger

| | |
| --- | --- |
| Objective | A signed-in buyer can pay in the fake provider and the platform records a balanced journal exactly once. |
| Scope | Checkout session, idempotency, fake signed webhooks, ledger, order `paid`, reconciliation query. `checkout.enabled` defaults off outside local. |
| Technical | One transaction posts inbox, journal, order, and session `completed`. Entitlement is not in that transaction. `payments.charge_captured` does not also create the order. Prisma kill criteria from ADR 0002 run here. |
| Depends on | Slices 5 and 6. Account required (assumption A1) until the owner allows guests. |
| Tasks | Checkout routes. Fake provider. Webhook verification. Reconciliation query. Feature flag. |
| Security | Bad signature writes no inbox row. Duplicate event id posts one journal. API role has no UPDATE/DELETE on ledger tables. |
| Tests | Replay webhook. Same idempotency key with a different body returns conflict. Unbalanced journal fixture cannot commit. Late capture after expiry does not fulfill. |
| Acceptance | Those tests pass. A written note says whether Prisma met the kill criteria. |
| Done | Global definition. Real cards remain forbidden. |

### Slice 8 — Entitlement and download

| | |
| --- | --- |
| Objective | The buyer can download the purchased file. A revoked buyer cannot get a new link. |
| Scope | Entitlement from `orders.order_paid` only. Download grant. Short-lived presign. Takedown blocks new grants (Q15 interim). |
| Technical | Presign after the grant commits. Response has no storage key. TTL uses the clock in tests. |
| Depends on | Slice 7. |
| Tasks | Consumer. Grant route. Private GET presign. Revoke function used later by refunds. |
| Security | IDOR test for another user’s entitlement. Revoked and frozen states deny the grant. |
| Tests | Those cases, plus a takedown, deny a new URL. |
| Acceptance | Tests pass. Email copy is not part of this slice. |
| Done | Global definition. |

### Slice 9 — Reviews

| | |
| --- | --- |
| Objective | A buyer who owns the product can leave one review. |
| Scope | Create and read. Moderator can hide a review without deleting the order. |
| Technical | Unique `(user, product)` for a published review. |
| Depends on | Slice 8. |
| Tasks | Review routes. Hide action. |
| Security | No entitlement means forbidden. Rate limit creates. |
| Tests | Unpurchased product cannot be reviewed. Second review conflicts. |
| Acceptance | Those tests pass. |
| Done | Global definition. |

### Slice 10 — Sandbox payouts

| | |
| --- | --- |
| Objective | A seller balance matches the ledger, and a payout cannot run twice. |
| Scope | Projection, hold, payout instruction, fake payout webhook, reconciliation. `payouts.enabled` defaults off. |
| Technical | Same idempotency key on retry. Unverified seller stays `held`. Negative payable blocks the next payout. |
| Depends on | Slice 8, and seller verification states from slice 2. |
| Tasks | Balance read. Scheduler. Fake payout. Mismatch alert test. MFA step before payout-account change (PROPOSED control). |
| Security | Moderator without `finance` cannot release a hold. Reconciliation failure does not edit the ledger to match the provider. |
| Tests | Duplicate payout webhook posts one journal. Forced mismatch is detected. |
| Acceptance | Those tests pass. |
| Done | Global definition. Real payouts remain forbidden until Gate B and ADR 0004. |

### Slice 11 — Notices, appeals UI, counts

| | |
| --- | --- |
| Objective | Users hear the outcome of review and purchase. Operators can see simple counts. |
| Scope | Email on register, decision, and purchase. Appeal screen if the API from slice 5 has no UI yet. Analytics tables for views and checkout started vs paid. |
| Technical | Notifications consume domain events. They do not write orders or entitlements. |
| Depends on | Slice 2 for mail transport. Purchase templates wait until slice 8. |
| Tasks | Templates. Appeal UI. Funnel projection. |
| Security | Template test fixture contains no presigned URL and no webhook body. |
| Tests | Disabling the analytics consumer still allows checkout. |
| Acceptance | Those tests pass. |
| Done | Global definition. |

## Not in this backlog

A second catalog, seller services, subscriptions, team licenses, AI search, a live KYC vendor, production payment keys, and production infrastructure. Each needs an owner decision and a new slice.
