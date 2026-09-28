# NOESIS progress

**Phase:** Slice 3 catalog. **Production:** not deployed. **Live payments:** not configured.

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
| 4–11. Vertical slices | [16-MVP-SLICES](architecture/16-MVP-SLICES.md) | Not started |
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
