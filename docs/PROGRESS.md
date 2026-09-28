# NOESIS progress

**Phase:** Slice 1 foundation. **Production:** not deployed. **Live payments:** not configured.

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
- Email-verification timing (Q19), archive size (Q14), takedown versus existing buyers (Q15).

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
| 2–11. Vertical slices | [16-MVP-SLICES](architecture/16-MVP-SLICES.md) | Not started |
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
