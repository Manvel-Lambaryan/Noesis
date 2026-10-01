# ADR 0004 — Payment provider

**Status:** OPEN  
**Date:** 2026-09-28  
**Deciders:** Owner, after Q1 (countries and currencies) and Q2 (merchant of record). No vendor is selected.

## Context

The platform takes a configurable commission and pays sellers. That implies onboarding, split or supplier payouts, refunds, disputes, and a story for tax. The ledger in the payments document is designed so the vendor can change. The vendor cannot be chosen honestly before we know where sellers live and who is the merchant of record.

This ADR compares categories. It does not integrate anything.

## Options

### A. Marketplace connect model (example family: Stripe Connect, Adyen for Platforms)

The provider onboards sellers and can split a charge or pay sellers from a balance. Strong fit for “many sellers.” Coverage, prohibited-business rules, and whether the platform or the seller is merchant of record depend on the specific product and country. Must be checked against the launch list, not assumed from marketing pages.

### B. Merchant-of-record reseller (example family: Paddle, Lemon Squeezy)

They charge the buyer and handle VAT in many countries. Several of these products are built for a single software vendor, not for paying a large set of third-party sellers. Treat “marketplace payouts” as unproven until a vendor confirms it in writing for our countries.

### C. Platform merchant account plus manual seller payouts

One acquirer for buyers, payouts by bank file. Maximum control, maximum ops and licensing risk. Poor fit if volume grows, and still needs a compliance opinion.

## Decision

**OPEN. No provider accepted.**

**PROPOSED port, independent of the winner:**

- `startCheckout(snapshot, idempotencyKey)`
- `parseWebhook(rawBody, headers) → verified event | reject`
- `refund(chargeRef, amount, idempotencyKey)`
- `submitPayout(sellerRef, amount, currency, idempotencyKey)`
- `fetchBalanceReport(currency, date)`

A `fake` implementation is the only driver until this ADR moves to Accepted. The fake one signs webhooks with `PAYMENT_WEBHOOK_SECRET` from the environment.

## Consequences

- Slice 7 builds the fake driver and the ledger.
- Production keys are out of scope.
- Tax lines are not invented here. Q2 decides who is responsible; the journal can gain a tax leg later.
- If the chosen provider pays sellers itself, the payout journal’s credit account follows the actual cash movement (payments doc).

## Revisit when

Q1 and Q2 have answers. Then a short eligibility note (countries, currencies, split payouts, who is merchant of record, webhook signatures, sandbox availability) is appended under this ADR before any SDK is added.
