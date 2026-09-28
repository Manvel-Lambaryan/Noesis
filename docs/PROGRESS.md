# NOESIS progress

**Phase:** Architecture and documentation. **Code:** none. **Cloud resources:** none. **Migrations:** none.

## Evidence

| Fact | Evidence | Date |
| --- | --- | --- |
| Repository had no product docs or code | `git ls-tree` on `2570dc2` contained only an empty `README.md` | 2026-09-28 |
| Branch | `dev-Mno` tracking `origin/dev-Mno` | 2026-09-28 |
| This pack | Deliverable list in the architecture brief, written as the files linked from [README](../README.md) | 2026-09-28 |
| Owner approvals | None recorded | 2026-09-28 |

## Decision gates

### Gate A — Technical direction (blocks feature code)

Accept or amend:

- Modular monolith plus an isolated scan process ([ADR 0001](architecture/ADR/0001-modular-monolith.md)).
- One catalog, three views ([ADR 0003](architecture/ADR/0003-search.md)).
- PostgreSQL, schema per module, Prisma under the conditions in [ADR 0002](architecture/ADR/0002-persistence-orm.md).
- Internal ledger and idempotent webhooks even when the provider is still fake ([payments](architecture/11-PAYMENTS-LEDGER-PAYOUTS.md)).
- Quarantine, scan, entitlement check, short-lived links ([ADR 0005](architecture/ADR/0005-storage-delivery.md)).

Until Gate A is accepted, these remain **PROPOSED**.

### Gate B — Commercial and legal (blocks live money and payout promises)

Owner choices in [00-ASSUMPTIONS-QUESTIONS](architecture/00-ASSUMPTIONS-QUESTIONS.md), especially jurisdictions, merchant of record, KYC depth, license/update rules, refunds, guest checkout, and moderation staffing.

Sandbox code may later use fixtures. It must not embed an unapproved refund window or commission as if it were policy.

### Gate C — Budget and hosting (blocks production deploy)

[ADR 0006](architecture/ADR/0006-deployment.md) stays **OPEN** until a budget band and a region preference exist. No project, cluster, or bucket is created in this phase.

## Phased work

| Phase | Output | Status |
| --- | --- | --- |
| 0. Architecture pack | Documents in this repo | Drafted, awaiting Gate A |
| 1. Skeleton | Apps, CI, health, OpenAPI stub, log/trace baseline | Not started |
| 2–11. Vertical slices | [16-MVP-SLICES](architecture/16-MVP-SLICES.md) | Not started |
| Live payments | Real provider in production | Blocked on Gate B and ADR 0004 |
| Production | Real users and seller funds | Blocked on Gates A–C plus security tests for slices 4, 7, 8, 10 |

No calendar dates. Staffing and review capacity are unknown.

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

- Curated JS/TS might mean “stack filter” or “editor picked.” Both are representable; the product meaning is OPEN.
- Takedown vs already-sold copies is OPEN, so slice 5 hides public pages and blocks **new** grants, and does not silently delete old entitlements.
- Chargeback fee (platform vs seller) is OPEN. The ledger can post either account once chosen.
- NFR numbers are proposed targets to test, not measured SLOs.
- Prisma acceptance depends on a slice 7 spike (partial unique indexes, interactive transaction around ledger legs).
- No independent security review and no counsel review yet.

### Recommendation

Use this pack as the build map after Gate A. Do not treat it as permission to charge cards, onboard real sellers for payouts, or deploy production.
