# ADR 0001 — Modular monolith

**Status:** PROPOSED  
**Date:** 2026-09-28  
**Deciders:** Not accepted. Owner Gate A.

## Context

NOESIS needs hard boundaries around money, entitlements, and untrusted archives. The team size and traffic are unknown. The starter brief asks for a modular monolith first, compared with microservices, not adopted blindly.

The scan requirement is stricter than a normal module boundary: seller archives must not be unpacked on the API.

## Options

### A. Modular monolith, one API process, in-process ports, outbox

One deployable NestJS application. PostgreSQL schemas per module. Workers in a second process for jobs. Simplest operations. Risk: boundaries rot unless import tests enforce them. A bug in listings can still share a database role with the ledger unless DB permissions are tightened later.

### B. Microservices per domain from day one

Separate deploys for identity, catalog, payments, artifacts. Independent scaling. Cost: distributed transactions on checkout and capture, more failure modes, more cost, before there is evidence of load. Payout reconciliation across services is a common place marketplaces lose money during incidents.

### C. Modular monolith plus an isolated scan deployable (recommended shape)

Same codebase and module rules as A. `scan` runs as its own image and identity: it can read quarantine objects and return a verdict. It cannot read the payments schema and it does not run on the API hosts. Other domains stay in-process.

## Decision

**PROPOSED: option C.**

Microservices stay available later along event boundaries (`orders.order_paid`, `artifacts.version_approved`) if a measured bottleneck or a compliance rule appears. That is a new ADR, not a silent split.

## Consequences

- Slice 1 includes an architecture test that forbids cross-module repository imports.
- Capture of a payment is one database transaction coordinated at the composition root (webhook handler) across the payments and orders ports. Modules still do not write each other’s tables. See data ownership.
- Scan scaling does not require scaling the API.
- One Postgres remains a shared fate for availability. Accepted for MVP.
- Extracting payments later is possible because nothing else inserts ledger lines.

## Revisit when

- Search or scan load hurts the API even with separate processes.
- A regulator or a processor requires a separate payments environment.
- More than one team must deploy independently and is blocked weekly by the monolith. Staffing is currently unknown, so this trigger is not met.
