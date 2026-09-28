# Test strategy

**Status:** PROPOSED. No test project exists yet. Tests arrive with the slice that introduces the behavior, not as a later cleanup.

## Layers

| Layer | What it proves | Where |
| --- | --- | --- |
| Domain unit | State guards, money math, update-policy resolver, journal balance | Module libraries |
| Architecture | Module A does not import module B repository | API test |
| Contract | HTTP matches OpenAPI and error shape | API + web client types |
| Integration | Postgres transactions, unique inbox, outbox relay, Redis job retry | Testcontainers or equivalent |
| Provider contract | Fake provider signatures, replay, idempotency | payments tests |
| Security fixtures | Zip path traversal, oversized expansion, bad webhook, IDOR, revoked download | slices 4, 7, 8 |
| End to end | One staging purchase on sandbox provider | After slice 8, not before a provider exists |
| Restore drill | Fixture ledger balances after PITR | slice 7 operations |

UI tests, when the web app exists, cover the three lenses showing one product, and the download button’s denial states. They do not replace API authorization tests.

## Rules

- Flaky time-based tests use the clock interface.
- No test hits a live payment provider or a production bucket.
- Fixtures that use 15% commission are labeled fixture.
- A failing architecture import test blocks merge.
- Migrations run on an empty database and on a database migrated from the previous slice.

## Data examples

Use factories. Do not depend on a shared manual seed for correctness. A demo seed is allowed for local UX and must not be required for CI.

## Slice mapping

Detailed acceptance is in [16-MVP-SLICES](16-MVP-SLICES.md). Minimum bar:

| Slice | Must fail the build if broken |
| --- | --- |
| 1 | Health ok, lint boundaries, secret scan clean, OpenAPI publishes |
| 2 | Cannot use admin route as buyer; session revoke works |
| 3 | One product id appears in two views; draft slug 404 for anonymous |
| 4 | Traversal fixture rejected; API process has no “extract and run” path |
| 5 | Rejected version absent from public GET |
| 6 | Archived offer price does not change an old snapshot |
| 7 | Duplicate webhook → one journal; unbalanced journal impossible; bad signature → no row |
| 8 | Revoked entitlement → no new URL; grant checks listing takedown guard |
| 9 | Review without entitlement → forbidden |
| 10 | Payout retry same key; reconciliation detects a forced mismatch in test |
| 11 | Takedown audit row exists; email template has no presigned URL |

## Threat tests that are in scope

Listed in the threat model table. Out of scope for automated MVP tests: full red-team of seller source code, legal compliance certification, performance record at the proposed SLO (that is a staging exercise with a written result, not a unit test).

## Non-functional checks

- Slice 3: a small load sample on search, recorded against the NFR target. Missing the number updates the NFR doc or the query. It does not silently change the target.
- Slice 7: webhook p95 in staging recorded the same way.

## Release evidence

Each slice’s PR or changelog links: tests run, migrations reversible or forward-only called out, feature flags, and the threat rows addressed. No slice is “done” on a demo screenshot alone.
