# Deployment and operations

**Status:** Topology requirements PROPOSED. Vendor and region OPEN (ADR 0006, Gate C). Nothing in this document has been provisioned.

## Target shape

- Web on a Next.js-capable host.
- API and worker as containers.
- Scan as a separate container or VM with separate credentials.
- Managed PostgreSQL with point-in-time recovery.
- Managed Redis.
- Three buckets.
- Secret manager for anything that is not public configuration.
- TLS, WAF or equivalent rate limiting at the edge for the web origin.

The fake payment provider runs in-process in local and CI. Staging may point at a vendor sandbox only after ADR 0004 names the vendor.

## Environment promotion

| From | To | Carries | Does not carry |
| --- | --- | --- | --- |
| local | ci | Tests, migrations | Developer data |
| ci | staging | Image digest | Production secrets |
| staging | production | Same digest that passed staging | Sandbox keys, fake provider |

Production deploy is out of scope until Gates A–C and the slice security tests for payments and downloads have evidence.

## Configuration and secrets

- Public: app URL, feature flags that are not secret.
- Secret: database URL, Redis URL, session secret, BFF internal token, storage keys, webhook secret, provider secret, email key.
- Rotation: webhook and storage keys must rotate without downtime (**PROPOSED** two-key overlap). Procedure is written when the vendor exists.
- No production secret in this repository. Ever.

## Database operations

- Migrations expand then contract. No destructive migration on populated ledger tables.
- Restore drill: **PROPOSED** quarterly once production exists. Not scheduled against a person yet.
- Proposed targets to validate, not measured: RPO 15 minutes via PITR, RTO 4 hours, single region. See NFR doc.

## Application operations

| Signal | Alert when | First response |
| --- | --- | --- |
| Ledger vs provider delta | Non-zero | Pause payouts, investigate, compensating entry only with evidence |
| Webhook signature failures | Spike | Confirm secret rotation or attack; do not disable verification |
| Outbox age | Oldest unpublished &gt; 5 minutes (**PROPOSED** threshold) | Restart relay, inspect poison messages |
| Scan lease stuck | Past 2× timeout | Restart scan, leave version unapproved |
| Checkout error rate | Sustained failure | Feature-flag checkout off; public catalog can stay up |
| Disk / DB connections | Near cap | Scale or shed background work first |

Feature flags (**PROPOSED**): `checkout.enabled`, `refunds.enabled`, `payouts.enabled`. Default off in any shared environment until the slice is accepted. Public browsing can stay on while checkout is off.

## Backups

- Postgres PITR.
- Private bucket versioning.
- Redis is not backed up as truth.
- A documented restore produces a readable order and a balanced journal for a fixture. That test belongs to slice 7 once a database exists.

## Incident severity (draft)

| Level | Example | Commerce |
| --- | --- | --- |
| 1 | Ledger imbalance, suspected unauthorized payout | Stop payouts and checkout |
| 2 | Scan down | Stop new approvals; existing downloads continue |
| 3 | Discovery index stale | Rebuild projection; catalog pages may read the catalog port directly as fallback **PROPOSED** |
| 4 | Email delay | Retry queue |

## Observability

- Structured JSON logs with `correlationId`, `userId` when known, `event` name. Deny-list: passwords, cookies, authorization headers, presigned URLs, raw webhook bodies.
- Traces from web BFF through API and worker (`traceparent`).
- Metrics named in the payments, artifact, and NFR docs.
- Admin audit separate from debug logs, retained with financial records.

## Access

- Production admin roles named humans only, after production exists.
- Break-glass cloud access is not designed in detail until a cloud is chosen. Principle: separate from application admin, logged by the cloud provider.

## Rollback

Application rollback is “previous image digest” if migrations are backward compatible. If a migration is not compatible, roll forward with a fix. Ledger migrations are forward-only.

Slice-level rollback notes are in [16-MVP-SLICES](16-MVP-SLICES.md).

## Cost drivers (no quote)

Web hosting, Postgres, Redis, object storage and egress, malware scanning CPU, payment provider fees, email, logs retention, and human moderation time. A number without Q13 would be fiction.

## Business continuity

Single region means a regional outage is downtime. Multi-region is **FUTURE** and should not be implied by the word “global” in the product aim.
