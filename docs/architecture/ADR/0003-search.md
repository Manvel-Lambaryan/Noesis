# ADR 0003 — Search and discovery views

**Status:** ACCEPTED for one catalog and a technology filter for the JS/TS lens.  
**Date:** 2026-09-28  
**Accepted:** 2026-09-28. The owner chose one catalog. The JS/TS marketplace is a view where stacks include JavaScript or TypeScript. It is not a second database and not an editorial shortlist.

## Context

Buyers need text search, stack filters, category filters, and three lenses. The lenses are product requirements. A second search index per lens would duplicate the catalog, which is forbidden.

Volume is unknown. PostgreSQL full text is enough for many early marketplaces and is one less system to operate.

## Options

### A. PostgreSQL full text and btree filters

`discovery.documents` has a `tsvector`, stack arrays, kind, and listing state. One row per product. Lenses are queries:

- `general` — public
- `javascript` — public and stacks overlap `{javascript, typescript}`
- `business_apps` — public and kind is `business_application`

Pros: one database, transactional rebuild from events, no extra vendor. Cons: typo tolerance and relevance tuning are weaker. Heavy facets can get slow; we do not have a measurement yet.

### B. External engine (Meilisearch, Typesense, or OpenSearch) fed by the outbox

Better relevance and typo tolerance. Another service to secure and rebuild. Justified when A misses the NFR target or editors need features Postgres will not give.

### C. Hosted search SaaS

Similar to B with less ops and a data-processing agreement. Jurisdiction is OPEN, so sending the catalog off-platform is premature.

## Decision

**ACCEPTED: option A for MVP.** The JS/TS lens is the stack filter above. There is no separate JS/TS product table.

The discovery module owns the document. Catalog remains the source. A wrong index must be fixable by replay without touching orders.

## Consequences

- Slice 3 tests assert one `product_id` across lenses.
- No `javascript_products` table.
- Introducing B later is a new consumer of the same events, not a catalog migration.
- Public listing pages may read the discovery document for speed and fall back to the catalog port if the document is missing (**PROPOSED** in operations).

## Revisit when

Staging search p95 misses the target in the NFR doc at a realistic catalog size, or the owner needs typo tolerance as a stated buyer requirement.
