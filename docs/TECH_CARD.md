# NOESIS technical card

**Status:** Baseline under validation. Nothing here is deployed. Provider and region are not selected.

Authoritative decisions: [ADR 0001](architecture/ADR/0001-modular-monolith.md) through [ADR 0006](architecture/ADR/0006-deployment.md).

## Proposed stack

| Layer | Proposal | Status |
| --- | --- | --- |
| Web | Next.js (App Router), React, TypeScript | PROPOSED baseline. SSR for public listings |
| API | NestJS, TypeScript, REST, OpenAPI | PROPOSED. Modular monolith |
| Data | PostgreSQL | ACCEPTED. Single database, four schemas: `identity`, `catalog`, `commerce`, `ops` |
| ORM | Prisma, with raw SQL migrations for ledger constraints | PROPOSED. See ADR 0002. Drizzle is the fallback if the spike fails |
| Jobs | Redis + BullMQ | PROPOSED where work must leave the request |
| Events | Transactional outbox in the owning schema | PROPOSED |
| Files | S3-compatible API, three buckets | PROPOSED port. Vendor OPEN |
| Web host | Vercel or equivalent Next.js host | PROPOSED candidate, not selected |
| API and workers | Container runtime, scan process isolated | PROPOSED shape. Cloud Run vs Hetzner/Coolify is OPEN |
| Payments | Provider port + fake driver | Port PROPOSED. Vendor OPEN |
| Observability | OpenTelemetry traces, structured logs, metrics, audit trail | PROPOSED |

## What the baseline survived

- Next.js fits public SEO pages and authenticated workspaces. It is not the security boundary.
- NestJS fits module facades and guards. Microservices are deferred in ADR 0001.
- PostgreSQL fits orders, entitlements, and a double-entry ledger. Search can start in PostgreSQL (ADR 0003).
- Prisma fits CRUD modules if financial uniqueness lives in SQL, not only in application code.
- Redis is for sessions-or-queues and short locks, never for the only copy of an order, entitlement, or ledger line.
- A separate scan process is justified even inside a monolith, because untrusted archives must not be unpacked on the API.

## What is not selected

- Payment vendor, merchant of record, currencies, seller countries.
- Object-storage vendor.
- Cloud account, region, and monthly budget.
- Email/SMS vendor.
- Malware engine (interface only: pass/fail plus threat label).
- Identity proofing vendor (KYC), if any.

## Runtime processes (proposed)

| Process | Responsibility | Must not |
| --- | --- | --- |
| `web` | SSR, SEO, BFF to the API, UX session cookie | Decide authorization, sign private downloads, write the ledger |
| `api` | Modules, transactions, OpenAPI | Unpack or execute seller archives; trust webhook bodies without verification |
| `worker` | Outbox relay, email, payout scheduling, reconciliation | Serve public HTTP |
| `scan` | Read quarantine objects, archive safety checks, malware scan, publish a verdict to the queue | Hold any database credentials; run seller entrypoints |

`scan` is a separate deployable from the same codebase (**PROPOSED**), with its own identity for object storage: read quarantine, write a scan result. It has no route to the payments schema.

## Environments

| Environment | Purpose | Data | Payments |
| --- | --- | --- | --- |
| local | Developer loop | Disposable Postgres and Redis | Fake provider |
| ci | Tests | Ephemeral databases | Fake provider |
| staging | Integrated rehearsal | Synthetic sellers and buyers | Provider sandbox only |
| production | Real users | Real | Not created in this phase. Live keys are forbidden until Gate B and ADR 0004 are accepted |

No environment is provisioned by the architecture phase.

## Configuration

Secrets come from a secret manager in staging and production (**PROPOSED**). Local development uses untracked env files. The committed template is [`.env.example`](../.env.example): names only.

Commission, refund window, reserve days, download TTL, and max archive size are **configuration**, not constants buried in code. Until the owner sets them, code must not ship a silent default that looks like policy. Tests may use obvious fixtures labeled as fixtures.

## Web and API session (proposed)

Browsers talk to Next.js. Next.js server-side code calls NestJS with the session id. NestJS is the identity authority.

Reason: the likely split (web host vs API host) makes a shared parent-domain cookie fragile. The BFF keeps the cookie on the web host. Next.js middleware may redirect for UX. Every privileged API route still checks a guard. Details: [containers](architecture/02-CONTAINERS.md), [API](architecture/08-API-CONTRACTS.md).

## Data plane (proposed)

- One PostgreSQL instance, many schemas. No cross-schema foreign keys.
- Each module writes only its schema, including its outbox, in one transaction. The capture composition root may call several module ports in that same transaction. See data ownership.
- Cross-module references are identifiers plus events.
- Strong consistency inside a module; eventual consistency across modules, except a synchronous read through a **port** when a checkout must snapshot price (the snapshot is then copied, not referenced live).

## Delivery plane (proposed)

- Public previews: public bucket or public object prefix. No paid bytes.
- Uploads: presigned PUT to quarantine only.
- Paid downloads: entitlement check, then presigned GET with a short TTL. Links are not stored as permanent URLs.

## Operational assumptions

These are **ASSUMPTION**s, not SLOs. Targets under validation live in [14-NFR-SLO-CAPACITY](architecture/14-NFR-SLO-CAPACITY.md).

- Single region at launch.
- Point-in-time recovery on PostgreSQL.
- Daily backup restore drill is a later operations requirement, not something this phase performed.
- Scan and API scale independently.

## Explicit non-choices for MVP

- Kubernetes as the default control plane.
- Microservices per domain module.
- Event bus product (Kafka or equivalent) before the outbox shows a need.
- Client-side payment secrets.
- localStorage tokens.
