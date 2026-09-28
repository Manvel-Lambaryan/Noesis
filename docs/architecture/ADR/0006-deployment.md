# ADR 0006 — Deployment

**Status:** OPEN  
**Date:** 2026-09-28  
**Deciders:** Owner Gate C (budget and region). The isolation requirements below are PROPOSED and should survive either hosting option.

## Context

The web stack is Next.js. The API is a container. Scan must not share credentials with payments. There is no production requirement yet, no region, and no budget. Picking a cloud now would pretend those are known.

“Global” is a product aim. The proposed runtime is single-region until measured latency or a legal rule forces otherwise.

## Options

### A. Managed web + managed containers

Example shape: Vercel for Next.js, Cloud Run (or similar) for API, worker, and scan as separate services, managed Postgres (Neon, Cloud SQL, or similar), managed Redis, S3-compatible buckets. Scan service account cannot reach the payments database. Higher monthly floor, less undifferentiated ops. Region choice still matters for PITR and latency.

### B. Managed web + a small VM platform

Example shape: Vercel or even the same VM for web, Hetzner (or similar) with Coolify for API and worker, Postgres on the VM or a small managed instance. Lower bill. Scan must still be a **separate machine or a locked-down container** without the API’s database password and without a Docker socket. Easier to misconfigure. Backup and PITR become your job if Postgres is self-hosted.

### C. Kubernetes everywhere

Fits a platform team. There is no evidence of that team. Operational cost is the highest of the three for an unreleased marketplace.

## Decision

**OPEN between A and B.** Option C is **rejected for MVP** unless the owner already runs Kubernetes and wants to use it. That fact is not in evidence.

**PROPOSED requirements that both A and B must meet:**

- Separate deploy identities for `web`, `api`, `worker`, `scan`.
- Scan cannot read `payments`.
- Postgres PITR or an equivalent tested backup.
- Secrets in a secret manager, not in the image.
- One region named in the decision when this ADR is accepted.
- Feature flags for checkout and payouts.

**PROPOSED preference if the budget can pay for managed Postgres and a separate scan service:** option A, because untrusted files and backups are where lean VMs usually fail. This preference is not a purchase.

## Consequences

- No accounts are created in the architecture phase.
- `.env.example` stays vendor-neutral (`S3_ENDPOINT`, `DATABASE_URL`).
- NFR RPO/RTO assume managed PITR. If option B self-hosts Postgres, the NFR doc must be edited in the same change as this ADR.
- A regional outage is accepted downtime under the single-region proposal.

## Revisit when

Gate C answers budget band and preferred region, or a processor’s compliance pack demands a specific cloud.
