# NOESIS

NOESIS is one global developer marketplace. General code assets, a JavaScript/TypeScript discovery lens, and ready-to-launch business applications are three views over a single catalog.

**This repository is in the architecture phase.** There is no application code, infrastructure, or payment integration yet.

| Label | Meaning |
| --- | --- |
| CONFIRMED | Stated in the architecture brief |
| ASSUMPTION | Working hypothesis, not an approved requirement |
| PROPOSED | Architect recommendation awaiting owner approval |
| OPEN | Owner decision required |
| FUTURE | Out of MVP unless the owner pulls it in |

## Start here

1. [Product brief](docs/BRIEF.md) — personas, journeys, MVP boundary
2. [Architecture map](docs/01-ARCHITECTURE.md) — traceability and rules
3. [Open decisions](docs/architecture/00-ASSUMPTIONS-QUESTIONS.md) — what still needs a yes or no
4. [Architecture audit](docs/architecture/17-AUDIT.md) — validation, contradictions, risks
5. [Development roadmap](docs/architecture/18-ROADMAP.md) — slices, tasks, definition of done
6. [Progress and review](docs/PROGRESS.md) — gates, evidence, consistency review

## Documents

| Document | Role |
| --- | --- |
| [docs/BRIEF.md](docs/BRIEF.md) | Scope, personas, journeys, non-goals |
| [docs/TECH_CARD.md](docs/TECH_CARD.md) | Stack and environments under validation |
| [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) | Context, boundaries, traceability |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Phases, gates, architecture review |
| [docs/architecture/](docs/architecture/01-CONTEXT.md) | Detailed design set |

## Architecture set

| # | Document |
| --- | --- |
| 00 | [Assumptions and questions](docs/architecture/00-ASSUMPTIONS-QUESTIONS.md) |
| 01 | [Context](docs/architecture/01-CONTEXT.md) |
| 02 | [Containers](docs/architecture/02-CONTAINERS.md) |
| 03 | [Modules](docs/architecture/03-MODULES.md) |
| 04 | [Domain model](docs/architecture/04-DOMAIN-MODEL.md) |
| 05 | [Data ownership](docs/architecture/05-DATA-OWNERSHIP.md) |
| 06 | [State machines](docs/architecture/06-STATE-MACHINES.md) |
| 07 | [Sequences](docs/architecture/07-SEQUENCES.md) |
| 08 | [API contracts](docs/architecture/08-API-CONTRACTS.md) |
| 09 | [Event catalog](docs/architecture/09-EVENT-CATALOG.md) |
| 10 | [Security and threat model](docs/architecture/10-SECURITY-THREAT-MODEL.md) |
| 11 | [Payments, ledger, payouts](docs/architecture/11-PAYMENTS-LEDGER-PAYOUTS.md) |
| 12 | [Artifact lifecycle](docs/architecture/12-ARTIFACT-LIFECYCLE.md) |
| 13 | [Deployment and operations](docs/architecture/13-DEPLOYMENT-OPERATIONS.md) |
| 14 | [NFR, SLO, capacity](docs/architecture/14-NFR-SLO-CAPACITY.md) |
| 15 | [Test strategy](docs/architecture/15-TEST-STRATEGY.md) |
| 16 | [MVP slices](docs/architecture/16-MVP-SLICES.md) |
| 17 | [Architecture audit](docs/architecture/17-AUDIT.md) |
| 18 | [Development roadmap](docs/architecture/18-ROADMAP.md) |

## Decision records

| ADR | Topic | Status |
| --- | --- | --- |
| [0001](docs/architecture/ADR/0001-modular-monolith.md) | Modular monolith | ACCEPTED |
| [0002](docs/architecture/ADR/0002-persistence-orm.md) | PostgreSQL, four schemas, Prisma | ACCEPTED (ledger spike remains at slice 7) |
| [0003](docs/architecture/ADR/0003-search.md) | One catalog, JS/TS stack view | ACCEPTED |
| [0004](docs/architecture/ADR/0004-payment-provider.md) | Payment provider | OPEN |
| [0005](docs/architecture/ADR/0005-storage-delivery.md) | Private storage and delivery | PROPOSED (vendor OPEN) |
| [0006](docs/architecture/ADR/0006-deployment.md) | Deployment topology | OPEN |

## Environment template

[`.env.example`](.env.example) lists variable names only. It contains no credentials.

## Local foundation

Docker Compose starts PostgreSQL and Redis only. The local database password in `docker-compose.yml` is a development default, not a production secret.

```text
docker compose up -d
npx prisma migrate deploy
npm test
npm run build --workspace @noesis/web
```

API: `npm run start --workspace @noesis/api` then `GET /health` and `GET /docs`.
Worker: `npm run start --workspace @noesis/worker`.
Scan: `npm run start --workspace @noesis/scan`. The scan process exits if `DATABASE_URL` is set.
