# NFR, SLO, and capacity

**Status:** Proposed targets to validate with tests and with the owner’s budget. None of these numbers have been measured. None are contractual SLAs.

## How to read this page

A target becomes an SLO only after: a metric exists, an error budget is agreed, and someone is accountable. Until then the status stays PROPOSED.

## Proposed targets

| Concern | Proposed MVP target | How we would know | Status |
| --- | --- | --- | --- |
| Public listing TTFB | p95 under 1.5s uncached origin; cached HTML faster | Trace from CDN to catalog/discovery read | PROPOSED |
| Search | p95 under 400ms inside the API for a simple filter, catalog under 50k public products | Load test in staging | PROPOSED, catalog size is an assumption |
| Checkout API excluding provider | p95 under 500ms | Trace, provider time excluded | PROPOSED |
| Webhook ingest | Inbox committed in under 2s p95, excluding provider | Metric | PROPOSED |
| Download grant | p95 under 300ms excluding storage presign | Metric | PROPOSED |
| Availability of browse plus buy | 99.5% monthly, excluding planned maintenance | Synthetic checks | PROPOSED |
| RPO | 15 minutes | PITR window | PROPOSED |
| RTO | 4 hours, single region | Restore drill | PROPOSED |
| Scan start | Under 10 minutes after upload complete for a 2 GB file | Queue age metric | PROPOSED, depends on Q14 |
| Reconciliation | Daily report, alert within 15 minutes of job failure | Job monitor | PROPOSED cadence |
| Archive size | Design point 2 GB compressed | Reject over max | OPEN (Q14) |
| Regions | One | ADR 0006 | PROPOSED |
| Currencies | Those named in Q1 | Ledger per currency | OPEN |

If a target is missed in staging, we change the design or the target in writing. We do not leave the original number in the README as a promise.

## Capacity assumptions (not a forecast)

**ASSUMPTION for design, easy to be wrong:** early marketplace, tens of checkouts per hour, not thousands per second. The monolith and a single Postgres are aimed at that shape.

Design should still avoid obvious cliffs:

- No unbounded `SELECT` of the catalog.
- Search cursor pagination.
- Webhook work off the request thread after the inbox commit (job can be inline if it stays inside one short transaction; the provider HTTP response must not wait for email).
- Scan concurrency capped so a zip bomb queue cannot starve the API. They are different processes, which is the point.
- Connection pooling in front of Postgres.

A later load test (slice 3 and slice 7) either supports these assumptions or triggers ADR 0001 revisit. That revisit is expected, not a failure of the document.

## File and abuse limits

| Knob | Design point | Approved |
| --- | --- | --- |
| Compressed upload | 2 GB | No |
| Uncompressed expansion | 8 GB | No |
| Archive entries | 10_000 | No |
| Compression ratio | 100:1 reject | No |
| Download URL TTL | 60 seconds | No |
| Upload presign TTL | 15 minutes | No |
| Session TTL | 14 days absolute, rotate **PROPOSED** | No |
| Checkout session TTL | 30 minutes | No |

These are engineering starting points so slices have something to test. Owner or operations can replace them before launch. They are not marketplace policy.

## Geographic reach

Product language says global. Technical design is single-region until Gate C. Latency for buyers far from that region will be worse than the TTFB target. That is an explicit tradeoff, not an oversight.

## Cost

No SLO on cost. Constraint: do not add a search cluster, a service mesh, or multi-region until a measured bottleneck or a compliance need says so (ADR 0003, ADR 0006).

## Security NFRs

- 100% of payment webhooks in tests pass only with a valid signature (slice 7).
- 100% of private download routes in tests call the entitlement check (slice 8).
- 0 ledger updates in application code paths (slice 7 review checklist).

These are acceptance checks, not production measurements.
