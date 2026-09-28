# NOESIS progress

**Phase:** Slice 6 pricing and licensing. **Production:** not deployed. **Live payments:** not configured.

Gate A is **accepted for Slice 1**. Gate B and Gate C stay open. Approval of the database, seller-verification, and catalog decisions does not approve payment provider, refunds, commission, guest checkout, or hosting.

## Evidence

| Fact | Evidence | Date |
| --- | --- | --- |
| Repository had no product docs or code | `git ls-tree` on `2570dc2` contained only an empty `README.md` | 2026-09-28 |
| Branch | `dev-Mno` tracking `origin/dev-Mno` | 2026-09-28 |
| Owner approvals | Four schemas; verification before publish and payout; one catalog with a JS/TS stack filter | 2026-09-28 |
| Gate A | Closed for Slice 1. See the gate section. Slice 1 test evidence is recorded after the run | 2026-09-28 |

## Decision gates

### Gate A — Technical direction

**Status: ACCEPTED for Slice 1 on 2026-09-28.**

| Item | Status | Why this is enough to build Slice 1 |
| --- | --- | --- |
| Modular monolith and isolated scan | ACCEPTED | The Slice 1 order requires one NestJS API, a worker, and a scan process with no database credentials. [ADR 0001](architecture/ADR/0001-modular-monolith.md) |
| One catalog, JS/TS as a stack filter | ACCEPTED | Owner decision. [ADR 0003](architecture/ADR/0003-search.md) |
| PostgreSQL, four schemas, Prisma | ACCEPTED | Owner decision plus the Slice 1 order. Ledger kill criteria remain a Slice 7 checkpoint. [ADR 0002](architecture/ADR/0002-persistence-orm.md) |
| Internal ledger and idempotent webhooks | Standing design | Source-of-truth payments doc. Not built in Slice 1. Not reopened |
| Quarantine, entitlement check, short-lived links | Standing design | [ADR 0005](architecture/ADR/0005-storage-delivery.md) mechanism stays. Storage vendor stays OPEN. Scan isolation is built in Slice 1 |

No further technical choice blocks Slice 1. These stay open and do **not** approve themselves:

- Payment provider, merchant of record, currencies, commission, refunds, chargeback fees, guest checkout (Gate B, [ADR 0004](architecture/ADR/0004-payment-provider.md)).
- Host, region, and budget (Gate C, [ADR 0006](architecture/ADR/0006-deployment.md)).
- Archive size (Q14), takedown versus existing buyers (Q15). Email-verification timing (Q19) was accepted on 2026-09-28.

### Gate B — Commercial and legal (blocks live money and payout promises)

Owner choices in [00-ASSUMPTIONS-QUESTIONS](architecture/00-ASSUMPTIONS-QUESTIONS.md), except the accepted verification and catalog decisions. Jurisdictions, merchant of record, refunds, and guest checkout remain OPEN.

Sandbox code may later use fixtures. It must not embed an unapproved refund window or commission as if it were policy.

### Gate C — Budget and hosting (blocks production deploy)

[ADR 0006](architecture/ADR/0006-deployment.md) stays **OPEN**. No production project is created in Slice 1.

## Phased work

| Phase | Output | Status |
| --- | --- | --- |
| 0. Architecture pack | Documents in this repo | Drafted. Gate A accepted for Slice 1 |
| 1. Skeleton | Apps, CI, health, OpenAPI stub, log/trace baseline | Done locally. GitHub Actions has not been executed |
| 2. Identity | Accounts, sessions, roles, seller draft | Done locally on 2026-09-28. See Slice 2 results |
| 3. Catalog | Draft products, three discovery lenses, preview images | Done locally on 2026-09-28. See Slice 3 results |
| 4. Artifact upload | Quarantine upload, isolated scan, `pending_moderation` or `scan_rejected` | Done locally on 2026-09-28. See Slice 4 results. Q14 stays OPEN |
| 5. Moderation and publication | Queue, decision, private copy, publish, takedown, appeal | Done locally on 2026-09-28. See Slice 5 results. Q15 stays OPEN |
| 6. Pricing and licensing | Immutable offers, public price, snapshot | Done locally on 2026-09-28. See Slice 6 results. Gate B stays OPEN |
| 7–11. Vertical slices | [16-MVP-SLICES](architecture/16-MVP-SLICES.md) | Not started |
| Live payments | Real provider in production | Blocked on Gate B and ADR 0004 |
| Production | Real users and seller funds | Blocked on Gate B, Gate C, and security tests for slices 4, 7, 8, 10 |

No calendar dates. Staffing and review capacity are unknown.

## Slice 1 results

Recorded after a local run on 2026-09-28. Docker is not installed on this machine, so `docker compose up` was not executed. PostgreSQL 18 and Redis were started as local processes. The API then used `DATABASE_URL` and `REDIS_URL`. That proves the applications can reach those services. It does not prove the Compose file on this workstation.

| Check | Result |
| --- | --- |
| `npm test` | 10 passed, 0 failed. Secret scan exited 0 |
| Health `GET /health` | 200. Body status `ok`. Schemas `catalog`, `commerce`, `identity`, `ops`. Postgres `up`. Redis `up`. Log line included `correlationId` `slice1-health` |
| OpenAPI `GET /docs-json` | 200. Paths include `/health` |
| Boundary tests | Current modules pass. A fixture that imports `IamRepository` from outside the module fails the check. A Prisma import inside a domain module fails the check |
| Scan config | Throws when `DATABASE_URL` is set. The config object has no database field |
| Scan process | Log `scan ready` with a correlation id. Process stayed up without `DATABASE_URL` |
| Worker process | Log `worker ready` with a correlation id |
| Web build | `next build` succeeded |
| Web server | `GET /` 200. `GET /api/health` 200 `{"status":"ok","service":"web"}` |
| GitHub Actions | Workflow file is present. The remote run was not executed |

Slice 1 does not include accounts, listings, checkout, or payments.

## Slice 2 results

Recorded after a local run on 2026-09-28. The same local PostgreSQL and Redis processes were used. `docker compose` was not executed. GitHub Actions was not executed.

| Check | Result |
| --- | --- |
| `pnpm lint` | Exit 0. No errors or warnings |
| `pnpm test` | 25 passed, 0 failed. Secret scan exited 0. Includes the Slice 1 health, boundary, scan, and worker tests |
| `pnpm --filter @noesis/web run build` | Exit 0. No errors or warnings |
| Migration `20260928160000_identity_accounts` | Applied with `prisma migrate deploy` |
| Registration, login, invalid credentials | Pass. Unknown email and wrong password return the same 401 message |
| Email verification and reuse | Pass. Second use of the token returns 400 |
| Password reset and reuse | Pass. Reset revokes the previous session. The old password then returns 401 |
| Session expiry and logout | Pass. Both return 401 on `GET /v1/auth/session` |
| Buyer on `GET /v1/admin/moderation/queue` | 403 |
| Moderator without finance on payout hold | 403. Finance permission without moderation: queue 403, hold 501 `not_available` |
| Seller profile | Owner draft is saved. Another session receives 404. A `userId` in the body does not change the owner |
| Q19 gates | Unverified buyer: purchase `email_unverified`. Verified buyer: purchase allowed. Verified seller draft: publication `seller_not_verified`. `verification_approved` plus verified email: publication allowed |
| Rate limits | Third failed login and third reset request return 429 when the test limits are 2 |
| Cookie | `__Host-noesis_session`; `HttpOnly`; `Secure`; `SameSite=lax`; `Path=/`; no `Domain`. Login JSON from the BFF does not include `sessionToken` |
| OpenAPI | `GET /docs-json` includes `/v1/auth/session` |
| Web pages | `GET /`, `/register`, `/login`, `/forgot-password`, `/verify-email`, `/reset-password` returned 200 and include the viewport meta. Signed-in `/account` shows the email and `email_unverified`. Signed-in `/account/seller` includes the draft form |
| Logs | The identity test asserts that the password and verification token are absent from stdout |

No browser window was resized. Responsive behavior is the viewport meta plus the CSS breakpoint at 720px, checked in the returned HTML and stylesheet, not by a graphical viewport pass.

Slice 2 does not implement checkout, publication, payouts, or a production email provider. `EMAIL_PROVIDER=capture` is a local mailbox only.

## Slice 3 results

Recorded after a local run on 2026-09-28. PostgreSQL 18 and Redis were local processes. `docker compose` was not executed. GitHub Actions was not executed. Q6 is accepted: ten categories with stable ids.

| Check | Result |
| --- | --- |
| `pnpm lint` | Exit 0. No errors or warnings |
| `pnpm test` | 35 passed, 0 failed (33 package tests and 2 web tests). Secret scan exited 0. Includes the Slice 1 and Slice 2 suites |
| `pnpm run build` | Exit 0. Next.js production build completed with no error or warning lines |
| Migration `20260928180000_catalog_discovery` | Applied with `prisma migrate deploy` after replacing a non-immutable generated `tsvector` with a trigger |
| Categories | `GET /v1/categories` returns 10, including `ui-components` and `developer-tools` |
| One catalog | `catalog.javascript_products` does not exist. One `business_application` with stack `typescript` is returned by both `javascript` and `business_apps` with the same `productId` |
| Draft privacy | Another seller receives 404. A buyer receives 403 on create. The public slug returns 404. The draft id is absent from `view=general` |
| Filters | Category, product type, technology, and text query each return the matching indexed product and exclude the other fixture |
| Preview upload | `application/zip` is 400. A PNG is stored. The public URL contains `/media/previews/` and does not contain `quarantine`. Reusing the intent is 400 |
| Rebuild | `POST /v1/admin/discovery/rebuild` indexes 0 products while the artifacts port reports no sellable version, including after a row is marked `published` |
| Create rate limit | Statuses 201, 201, 429 when the test limit is 2 |
| OpenAPI | `GET /docs-json` includes `/v1/discovery/listings` |

Public pages read that same discovery API. They stay empty until a later slice can mark a version sellable. Draft creation does not call the publication gate. The publication route is not implemented.

Web check on the production server: `GET /marketplace`, `/marketplace/javascript`, `/marketplace/business-apps`, and `/marketplace/categories/ui-components` returned 200 with those titles, the viewport meta, and the filter form. The category title came from the API. Unsigned `/account/products` and `/account/products/new` returned 200. The stylesheet contains breakpoints at 720px and 1024px. No browser window was resized, so this was not a graphical viewport pass.

Slice 3 does not implement archive upload, moderation, pricing, checkout, payouts, or reviews.

## Slice 4 results

Recorded after a local run on 2026-09-28. PostgreSQL 18 and Redis were local processes. `docker compose` was not executed. GitHub Actions was not executed. Q14 stays OPEN. The archive caps in code are the NFR fixtures, not approved marketplace policy.

| Check | Result |
| --- | --- |
| `pnpm lint` | Exit 0. No errors or warnings |
| `pnpm test` | 42 passed, 0 failed (40 package tests and 2 web tests). Secret scan exited 0. Includes the Slice 1–3 suites |
| `pnpm run build` | Exit 0. Next.js 15.5.26 production build completed with no error or warning lines |
| Migration `20260928190000_artifact_versions` | Applied with `prisma migrate deploy` |
| Happy path | A stored zip reaches `pending_moderation`. The stored SHA-256 matches the worker hash of the file bytes and does not match the client value `deadbeef`. `private_key` is null. One `scan_reports` row. A second verdict returns `duplicate` |
| Unsafe archives | Path traversal, a declared compression bomb, and a non-archive end in `scan_rejected` with `traversal`, `compression_bomb`, and `format` |
| Authorization | Anonymous create is 401. A buyer is 403. Another seller reading the version is 404 |
| Quarantine | The capability URL does not contain the version id. `GET` of that URL is not 200. `GET /media/quarantine/...` is 404. The owner JSON does not contain `quarantine/` |
| Discovery | The product id stays out of public listings. The sellability port still returns an empty set |
| Scanner isolation | `loadScanConfig` throws when `DATABASE_URL` is set. Compiled scan sources do not import `@prisma/client`. A second scan lease for the same version is rejected |
| API boundary | Compiled API sources, other than the integration test, do not contain `inspect-archive` or `scan-job` |

The production build emits `/account/products/[id]` and the BFF upload routes. A signed-in `GET /account/products/{id}` on the local production server returned 200 and included the archive form and the quarantine note. No browser window was opened, so this was not a graphical viewport pass. The upload assertions above used real zip bytes over HTTP against the API.

Slice 4 does not implement moderation, publication, pricing, checkout, payouts, or a public download. An expired upload intent is rejected, and the row is not moved back to `draft`. There is no durable event outbox; the scan handoff is a BullMQ job, and the audit row is `scan_reports`. The malware check is the structural fixture `structural-fixture`, not an antivirus engine.

## Slice 5 results

Recorded after a local run on 2026-09-28. Docker is not installed, so Compose was not executed. GitHub Actions was not executed. PostgreSQL and Redis were the existing local processes. No production data was changed.

| Check | Result |
| --- | --- |
| `pnpm lint` | Exit 0. No warning lines |
| `pnpm test` | 44 passed, 0 failed (42 package tests and 2 web tests). Secret scan exited 0. Includes the Slice 1–4 suites |
| `pnpm run build` | Exit 0. Next.js 15.5.26 production build completed. The build log has no error or warning lines |
| Migration `20260928200000_moderation_publication` | Applied with `prisma migrate deploy` on the local database |
| Authorization | Anonymous decision is 401. Buyer and finance-only decision are 403. Buyer queue is 403. Finance version detail is 403 |
| Self-approval | A moderator who owns the version receives 403. The version stays `pending_moderation` |
| Rejection | A note shorter than 8 characters is 400. A longer note records `rejected`, `moderator_rejected`, one decision row, and one audit row in the same flow. The seller review JSON includes the note |
| Promotion failure | Deleting the quarantine file, then approving, leaves `private_key` null. `promoteVersion` returns `failed`. Publish returns 409 `not_sellable` |
| Promotion retry and duplicate | Restoring the same bytes returns `promoted`, then `duplicate`. One `artifacts.object_promoted` row |
| Seller gates | Clearing `email_verified_at` returns 403. Setting verification back to `draft` returns 403. `verification_approved` plus a private copy can publish |
| Discovery | `pending_moderation`, `rejected`, and `approved` without `private_key` are 404 by slug. After publish, the public version list includes `1.0.0` and omits an unscanned `0.9.0`. The public JSON does not contain `private/` |
| Takedown | The slug becomes 404. The version stays `approved`. One `artifacts.version_withdrawn` row. Commerce tables remain `schema_anchor` only |
| Appeals | The owner receives 201 and a second open appeal is 409. Another seller receives 404 |
| Private storage | The promoted file is readable on disk under `PRIVATE_DIR`. `GET /media/{private_key}` is 404 |

The production build emits `/admin/moderation` and the seller publish, review, and appeal BFF routes. An unsigned `GET /admin/moderation` on the local production server returned 200 and included the moderation-permission message. A BFF login returned 200 and set the `__Host-` session cookie. A later page request over plain HTTP did not establish that cookie, so the signed-in queue and publication panel were not rendered in this check. No browser window was opened. This was not a graphical viewport pass. The behavior assertions above used real zip bytes over HTTP against the API.

Slice 5 writes outbox rows in the same transaction as the decision, listing change, or promotion claim. The row id is the dedupe key. There is no outbox poller and no Kafka. Discovery rebuild runs after the commit; `POST /v1/admin/discovery/rebuild` remains the retry. BullMQ retries a promotion job three times. The worker process also retries approved rows that still have a null `private_key` when it starts. A structural scan pass is not a malware-free result. Q14, Q15, Gate B, and Gate C stay OPEN. Seller withdrawal, expired-intent return to `draft`, and an admin screen that sets `verification_approved` are not in this slice. Q3 still defines what verification evidence means.

## Slice 6 results

Recorded after a local run on 2026-09-28. Docker Compose and GitHub Actions were not executed. The migration was applied to the local database only.

| Check | Result |
| --- | --- |
| `pnpm lint` | Exit 0. No warning lines |
| `pnpm test` | 50 passed, 0 failed (48 package tests and 2 web tests). Secret scan exited 0. Includes the Slice 1–5 suites |
| `pnpm run build` | Exit 0. Next.js 15.5.26 production build completed. The build log has no error or warning lines |
| Migration `20260928210000_pricing_offers` | Applied with `prisma migrate deploy` on the local database |
| Ownership | Anonymous offer create is 401. A buyer is 403. Another seller is 404 |
| Price and currency | `10.00` and a 2-letter currency are 400. `usd` is stored as `USD`. Amounts are bigint minor units |
| Immutability | A second offer gets a new id. The first row stays `1500` and becomes `archived`. Seller history still returns `1500` |
| License and update policy | `licenseCode` `mit`, `updatePolicy` `exact_version`, and a license text UUID are stored. No license-document table exists |
| Public price | Before publish the slug is 404. After publish the listing JSON contains `2500` and does not contain `private/` or `commission`. Archiving the active offer clears `price` |
| Providers | Compiled API sources do not contain `stripe`, `paypal`, or `adyen` |

An offer can pin only an approved version that has `private_key`. Currency is a 3-letter shape, not an approved list. Update-policy meaning (Q4) and license types (Q11) stay OPEN. Commission is not calculated. Checkout is not implemented.

A local API on port 3001 and Next.js on port 3010 served `GET /marketplace/products/priced-mulb1z6k-01eeacbe`. The response was HTTP 200, included "Checkout is not available", and did not include `private/`. That listing had no active offer, so the page showed "No public price". This was an HTTP check, not a graphical viewport pass.

## Blockers

- No approved commission, currency list, or seller countries.
- No merchant-of-record decision, so the payment vendor cannot be chosen honestly.
- No max archive size or demo-hosting decision.
- No budget, so deployment stays comparative.

## Architecture review report

**Scope:** Documentation only, reviewed for internal consistency on 2026-09-28. **Method:** Cross-read of catalog rule, state names, event names, ledger postings, and slice dependencies. **Not done:** Threat-model workshop with the owner, provider eligibility check, load test, legal review.

### What holds together

- JS/TS and business apps are views. Product identity is singular in the brief, domain model, search ADR, and slice 3 tests.
- Version immutability is separate from listing visibility, so a new version can wait in moderation while an older approved version remains the pinned purchase target.
- Checkout snapshots price, currency, commission basis points, seller, and version. Later edits do not rewrite the snapshot.
- Capture posts the ledger and the order from one webhook inbox row. Entitlement is a downstream consumer, so a crash retries without a second posting (unique inbox key and unique ledger source key).
- Downloads do not trust a stored URL. Grants are re-authorized.
- Scan credentials are isolated from payments.
- ADRs that lack an owner decision are marked PROPOSED or OPEN.
- Illustrative 10–20% commission is never written as the rate.

### Gaps (honest)

- Curated JS/TS was later closed on 2026-09-28: the lens is a stack filter, not an editorial list.
- Takedown vs already-sold copies is OPEN, so slice 5 hides public pages and blocks **new** grants, and does not silently delete old entitlements.
- Chargeback fee (platform vs seller) is OPEN. The ledger can post either account once chosen.
- NFR numbers are proposed targets to test, not measured SLOs.
- Prisma acceptance depends on a slice 7 spike (partial unique indexes, interactive transaction around ledger legs).
- No independent security review and no counsel review yet.

### Recommendation

Use this pack as the build map after Gate A. Do not treat it as permission to charge cards, onboard real sellers for payouts, or deploy production.
