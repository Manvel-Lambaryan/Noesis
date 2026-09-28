# Payments, ledger, and payouts

**Status:** Mechanism PROPOSED. Provider, fee rate, reserve days, refund rules, and chargeback-fee payer are OPEN. Do not read examples as prices.

## Principles

- Amounts are integer minor units. One currency per journal.
- The internal ledger is the platform’s book. The provider dashboard is evidence to reconcile against, not the book.
- Entries are insert-only. Refunds and chargebacks are new journals.
- Every capture, refund, and payout is idempotent.
- Commission basis points are copied onto the checkout snapshot. There is no approved rate. Examples below use **1500 bps (15%) ILLUSTRATIVE** on 100.00 USD (10000 minor units). Replace both numbers when policy exists.

## Accounts

| Account | Meaning |
| --- | --- |
| `provider_clearing` | What the provider still owes or is settling, per currency |
| `seller_payable` | Owed to a specific seller |
| `seller_reserve` | Portion of payable held until the reserve window passes |
| `platform_commission` | Platform fee income |
| `platform_cash` | Settled platform funds, if we model bank settlement |
| `refund_expense` or contra | Used if a refund exceeds what we can claw back. Prefer clawing back payable first |

Seller-specific accounts are dimensions on the line (`seller_id`), not a new table per seller.

## Capture journal (illustrative)

Buyer pays 10000 minor units. Commission 1500. Seller share 8500. All USD.

| Direction | Account | Amount | Dimension |
| --- | --- | --- | --- |
| debit | `provider_clearing` | 10000 | provider |
| credit | `seller_payable` | 8500 | seller |
| credit | `platform_commission` | 1500 | platform |

If a reserve policy later says “hold all seller funds N days,” the credit goes to `seller_reserve` instead of `seller_payable`, and a dated job moves `seller_reserve` → `seller_payable` with a new two-line journal. N is **OPEN**.

Debits equal credits: 10000 = 8500 + 1500.

`source_type = charge`, `source_id = provider_event_id`, `leg` unique per line.

## When the provider settles cash to the platform (optional second journal)

Only if the commercial model has platform cash distinct from clearing. Some connect models never park full funds on the platform. **Do not post this until ADR 0004 says the money actually moves that way.**

| Direction | Account | Amount |
| --- | --- | --- |
| debit | `platform_cash` | 10000 |
| credit | `provider_clearing` | 10000 |

## Refund journal (full, illustrative)

Reverse the original economics. Provider confirmed refund of 10000.

| Direction | Account | Amount | Dimension |
| --- | --- | --- | --- |
| debit | `seller_payable` | 8500 | seller |
| debit | `platform_commission` | 1500 | platform |
| credit | `provider_clearing` | 10000 | provider |

If `seller_payable` would go negative because the seller was already paid out, still post the debit (payable may be negative) and block new payouts until it recovers, or convert the negative to an explicit seller receivable account. **PROPOSED:** allow negative `seller_payable` and block payout while negative. Visible on the seller balance.

Partial refund: same shape with the approved partial amounts. Commission reversal rule (pro-rata vs platform keeps fee) is **OPEN**. Tests should cover both posting functions once chosen. Until chosen, the refund command stays `policy_blocked`.

## Chargeback

Same as refund plus a fee line. Who is debited for the fee is **OPEN**:

| Choice | Extra lines |
| --- | --- |
| Platform pays fee | debit `platform_commission` or a `chargeback_fee` expense, credit `provider_clearing` |
| Seller pays fee | debit `seller_payable`, credit `provider_clearing` |

Dispute opened: entitlement `frozen`, no ledger reversal yet.
Dispute won: entitlement `active`, no reversal.
Dispute lost: refund journal plus fee journal, entitlement `revoked`.

## Payout journal

When the provider confirms it paid the seller 8500:

| Direction | Account | Amount | Dimension |
| --- | --- | --- | --- |
| debit | `seller_payable` | 8500 | seller |
| credit | `provider_clearing` or `platform_cash` | 8500 | depends on ADR 0004 |

The credit account must match where the cash actually left. That is why payout posting waits on the provider model.

## Idempotency

| Action | Key |
| --- | --- |
| Create checkout at provider | Buyer idempotency key, also sent to provider |
| Webhook | Unique `(provider, provider_event_id)` |
| Ledger | Unique `(source_type, source_id, leg)` |
| Payout instruction | Unique `(seller_id, currency, period)` |
| Provider payout call | Same key as the instruction |

Same key and same body: return the stored result. Same key and different body: `idempotency_conflict`.

## Webhook handling

1. Read raw body.
2. Verify signature and tolerance on timestamp.
3. Insert inbox. On unique violation, return 200.
4. In one transaction: post journal if the type is financial, update checkout or payout state, write domain outbox.
5. Mark inbox processed in that same transaction.
6. Return 200.

Non-financial provider pings (disputes, account updates) follow the same inbox so they are replay-safe.

## Reconciliation

At least daily (**PROPOSED** cadence, not a staffed promise):

- Sum of ledger `provider_clearing` vs provider balance report, per currency.
- Every `paid` order has exactly one capture journal.
- Every `refunded` order has a reversal journal whose amount matches.
- No payout `settled` without a payout journal.
- Alert if delta ≠ 0. Do not auto-adjust the ledger to match the provider.

A human resolves with a compensating journal that names the evidence.

## Seller balance projection

`available = seller_payable` (positive) minus in-flight `submitted` payouts.
`pending = seller_reserve`.
Rebuild by summing lines. The projection table is disposable.

## Eligibility

Payout submit requires all of:

- `verification_approved` (meaning defined by Q3).
- Payout account `ready`.
- Not `suspended`.
- Amount &gt; 0 and ≥ minimum if you set one (**OPEN**).
- Currency the provider can pay to that seller’s country (**OPEN** with Q1).

Otherwise state `held`, not a silent skip without a reason code.

## What the fake provider must do in tests

- Honor idempotency keys.
- Emit signed webhooks for capture, failure, refund, dispute, payout.
- Allow replay of the same event id.
- Never be compiled into a mode that hits production URLs. `PAYMENT_PROVIDER=fake` is the only allowed value until ADR 0004 is accepted.

## Tax

Tax calculation is not designed beyond “amounts may need a tax component line later.” Adding tax is a new journal leg, not a float on the price. No tax rate is assumed. Merchant of record (Q2) decides who files.
