# NOESIS product brief

**Status:** Architecture phase. Commercial policy items are OPEN. This document does not approve legal, tax, or pricing policy.

## Mission

**CONFIRMED.** NOESIS is one global marketplace where developers sell versioned digital products. Buyers are individual developers, agencies, and startups. Sellers publish products first. Services and custom development are **FUTURE**.

The platform earns a **configurable** transaction commission. The range 10–20% in the starter brief is **illustrative only**. It is not a price list, not a default, and not an approved rate.

## One catalog, three lenses

**CONFIRMED.** There is a single product catalog. There is no separate JavaScript marketplace and no separate business-app inventory.

| Lens | What the buyer sees | What it is in the system |
| --- | --- | --- |
| General | Code assets across stacks | Discovery view with no stack restriction |
| JavaScript / TypeScript | A curated JS/TS entry point | Discovery view: stack filter and/or an editorial flag. Whether "curated" means automatic stack match or human selection is **OPEN** |
| Business applications | Ready-to-launch apps | Discovery view where `product_kind = business_application` |

A product can appear in more than one lens. A TypeScript SaaS starter is still one product row. Lenses are saved filters, not copies of the catalog. Authoritative rule: [ADR 0003](architecture/ADR/0003-search.md) and [domain model](architecture/04-DOMAIN-MODEL.md).

## Personas

| Persona | Goal | MVP relationship |
| --- | --- | --- |
| Individual developer (buyer) | Find a library, template, or app and download it after purchase | In MVP, once checkout exists |
| Agency (buyer) | Reuse a product across client work | Same buyer account. Team seats are **FUTURE** / **OPEN** |
| Startup (buyer) | Launch from a business application | Same catalog, business-app lens |
| Independent seller | Publish a versioned archive and get paid | In MVP, payouts only after provider and KYC decisions |
| Studio seller | Several people managing one catalog | **FUTURE** (team membership) |
| Moderator | Keep unsafe or illegal listings off the public site | In MVP |
| Finance operator | Match provider cash to the internal ledger and release payouts | In MVP as a process; live money is not |
| Platform owner | Set commission, categories, and policy | Decisions in [00-ASSUMPTIONS-QUESTIONS](architecture/00-ASSUMPTIONS-QUESTIONS.md) |

No persona is a promise of staffing. Moderator and finance capacity is **OPEN**.

## Jobs to be done

- Buyer: discover a trustworthy artifact, understand the license, pay once, download the purchased version, and know whether updates are included.
- Seller: list one canonical product, upload a new immutable version, pass review, and see a balance that matches real payouts.
- Moderator: stop a listing or version from being public or newly downloadable without deleting financial history.
- Operator: replay a payment webhook without double-charging, and explain every balance from ledger lines.

## Buyer journey

1. Land on a lens (general, JS/TS, or business apps) or a shared listing URL.
2. Inspect public metadata: stack, version list, license summary, price, preview images. The bytes of a paid archive are not in this step.
3. Choose a license offer. Which license types exist is **OPEN**.
4. Sign in. Guest checkout is **OPEN**; the architecture can attach a purchase to a user or to a later claim, but MVP slices assume an account until the owner decides otherwise (**ASSUMPTION**).
5. Pay through a provider. The provider is **OPEN**. The platform records an immutable ledger entry only after a verified webhook.
6. Receive an entitlement for a product version (and possibly later versions — **OPEN**).
7. Request a download. The server checks the entitlement again, then issues a short-lived link.
8. Optionally review. One review per buyer per product is **PROPOSED**.
9. If a refund or dispute is approved under a future policy, the entitlement is revoked or frozen. The policy itself is **OPEN**. The system must be able to do both.

Support obligations (response time, what “support” includes) are **OPEN**. A contact channel can exist without a promised SLA.

## Seller journey

1. Create an account and a seller profile.
2. Complete identity and payout onboarding to the depth the owner requires (**OPEN**: what “verified” means).
3. Create one product in draft. Pick kind (code asset or business application), stacks, tags, and category.
4. Attach a license offer. Price is an integer in minor units plus an ISO currency.
5. Upload an archive into quarantine. The platform does not run the seller’s code.
6. Automated scan, then human moderation. Depth of review is **OPEN**.
7. Publish. The listing becomes visible only when moderation status allows it.
8. Ship an update as a **new version**. The previous version’s bytes do not change.
9. Unpublish, or receive a takedown. Appeal and restore are modeled; staffing is **OPEN**.
10. After the reserve/hold rule (**OPEN**), request or receive a payout. Payouts reconcile to the ledger.

## Admin journey

1. Open a moderation queue item. Decide: approve, or reject with a note. A rejection does not reopen the same file. The seller uploads a new version.
2. Escalate or take down a live listing. Record a reason. The action is audited.
3. Hear an appeal. Restore or keep the takedown.
4. Place a seller payout on hold. Release it only when eligibility says so.
5. Read a reconciliation report when provider totals and ledger totals differ.

Admin download of a private archive is not a normal power. A break-glass read requires a reason, a time limit, and an alert (**PROPOSED**).

## MVP includes

- One catalog and three discovery views.
- Accounts for buyers, sellers, and admins, with default-deny permissions.
- Draft listings, immutable versions, quarantined upload, scan, moderation, publish, unpublish, takedown.
- Public listing pages suitable for search engines.
- A price and license snapshot on each checkout.
- Sandbox or fake payment provider, internal ledger, idempotent webhooks, refund **records** (policy still OPEN).
- Entitlements and short-lived private downloads.
- Reviews tied to a real entitlement.
- Seller balance projection, hold, and payout instruction in sandbox.
- Audit log, structured logs, correlation ids.

## MVP excludes

- A second catalog for JS/TS or for business apps.
- Live card charges, live KYC vendor, and production payouts (blocked until Gate B and provider eligibility).
- Seller services, hourly work, statements of work.
- Subscriptions and recurring plans.
- Team seats and enterprise contracts.
- AI search.
- Deep automated compatibility testing of seller code. A badge must not claim “secure” or “tested” unless a specific check ran and the evidence is stored. **CONFIRMED** principle.
- Hosting the buyer’s production app. Demo delivery is **OPEN** (external link vs platform-hosted demo).

## Non-goals

- Becoming a general freelance marketplace in MVP.
- Executing, building, or installing seller archives on platform servers.
- Keeping the only copy of financial truth inside a payment provider dashboard.
- Promising a global uptime, a commission rate, or a refund window inside this brief.

## Success for the architecture phase

The owner can read the open decisions in plain language, see how money and files move, and approve or reject the proposed technical direction before any feature code is written.
