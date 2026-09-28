# ADR 0002 — Persistence and ORM

**Status:** ACCEPTED for PostgreSQL, Prisma, and four schemas.  
**Date:** 2026-09-28  
**Accepted:** 2026-09-28. The owner chose PostgreSQL and four schemas. Slice 1 requires Prisma. The slice 7 kill criteria below still gate ledger work. They do not block the foundation.

## Context

The book of record is relational: orders, entitlements, idempotency keys, and a double-entry ledger with unique constraints. The brief names PostgreSQL and offers Prisma as a candidate, to be validated against transactions, migrations, and search.

Search is decided separately (ADR 0003). This ADR is about the system of record.

## Options

### A. Prisma

Mature migrations and a typed client. Interactive transactions exist. Partial unique indexes and ledger triggers belong in SQL migrations, not in the schema DSL alone. Risk: developers route around the ledger repository with ad hoc updates. Mitigation: one repository function for posting, API database role without UPDATE/DELETE on ledger tables, and a slice 7 spike that proves a multi-line journal and a partial unique index.

### B. Drizzle (or Kysely) with SQL migrations

SQL stays visible, which fits ledgers. Smaller ecosystem than Prisma. The brief’s candidate would be dropped without a failed spike. That is a weak reason to diverge on day one.

### C. No ORM, query builder only

Maximum control, more boilerplate, easier to write unsafe SQL in every module.

## Decision

**ACCEPTED: PostgreSQL as the only system of record, with Prisma (option A), under the kill criteria below.**

Kill criteria, evaluated in slice 7 before any live-money work (live money is already blocked):

- Cannot express the ledger uniqueness constraint in a migration.
- Cannot commit inbox row, all journal legs, and the order port in one interactive transaction.
- Cannot prevent a normal module import from updating ledger rows (review plus DB privilege).

If any kill criterion fails, adopt Drizzle for the payments module or for the whole API, and record the result in this ADR. Do not run two ORMs without that note.

Four schemas, not one per module: `identity`, `catalog`, `commerce`, `ops`. A module still writes only its own tables. No foreign keys across modules, including tables that share a schema. No cross-schema foreign keys. See data ownership.

## Consequences

- Money columns are `bigint` minor units and `char(3)` currency. No float columns for money.
- Read models (discovery, balances) are tables or SQL views in their owner schema, rebuildable.
- Redis is not a system of record.
- A future analytics warehouse is optional and is not the ledger.

## Revisit when

The slice 7 spike fails a kill criterion, or reporting queries force a replica. A replica does not change the ORM by itself.
