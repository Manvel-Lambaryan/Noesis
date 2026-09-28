# Event catalog

**Status:** PROPOSED names. Payloads are the minimum other modules may rely on. Extra fields can be added; existing fields are not renamed. A breaking change is a new version suffix.

## Envelope

```json
{
  "id": "uuid",
  "type": "orders.order_paid",
  "occurredAt": "2026-09-28T00:00:00Z",
  "correlationId": "uuid",
  "causationId": "uuid",
  "data": {}
}
```

Consumers dedupe on `id`. Producers write the row in the same transaction as the state change.

## Catalog

| type | Producer | Consumers | Data |
| --- | --- | --- | --- |
| `iam.user_registered` | iam | notifications, analytics | `userId` |
| `seller.verification_changed` | seller | payments (payout eligibility), notifications | `sellerId`, `state` |
| `catalog.listing_published` | catalog | discovery, analytics | `productId`, `slug`, `kind`, `stacks` |
| `catalog.listing_unpublished` | catalog | discovery | `productId` |
| `catalog.listing_taken_down` | catalog | discovery, entitlements | `productId`, `decisionId` |
| `catalog.listing_restored` | catalog | discovery | `productId` |
| `artifacts.version_quarantined` | artifacts | scan worker | `versionId`, `productId` |
| `artifacts.scan_completed` | artifacts | notifications, moderation queue | `versionId`, `verdict` |
| `artifacts.version_approved` | artifacts | catalog (sellable flag), discovery, notifications | `versionId`, `productId`, `sha256` |
| `artifacts.version_rejected` | artifacts | notifications | `versionId`, `reasonCode` |
| `pricing.offer_activated` | pricing | discovery | `offerId`, `productId`, `amountMinor`, `currency` |
| `pricing.offer_archived` | pricing | discovery | `offerId` |
| `checkout.session_created` | checkout | analytics | `checkoutId`, `offerId`, `amountMinor`, `currency` |
| `payments.charge_captured` | payments | orders, analytics | `checkoutId`, `providerEventId`, `amountMinor`, `currency`, `commissionBps` |
| `payments.charge_failed` | payments | checkout, notifications | `checkoutId` |
| `payments.refund_captured` | payments | orders, entitlements | `orderId`, `amountMinor`, `currency` |
| `payments.dispute_opened` | payments | entitlements, notifications | `orderId` |
| `payments.dispute_closed` | payments | entitlements | `orderId`, `outcome` |
| `payments.payout_settled` | payments | notifications, analytics | `payoutId`, `sellerId`, `amountMinor`, `currency` |
| `orders.order_paid` | orders | entitlements, notifications, analytics | `orderId`, `buyerUserId`, `productId`, `versionId`, `updatePolicy` |
| `orders.order_refunded` | orders | entitlements, notifications | `orderId` |
| `entitlements.issued` | entitlements | analytics | `entitlementId`, `orderId` |
| `entitlements.revoked` | entitlements | notifications | `entitlementId`, `reason` |
| `entitlements.download_granted` | entitlements | analytics | `entitlementId`, `grantId` |
| `reviews.published` | reviews | discovery (rating aggregate), analytics | `reviewId`, `productId`, `rating` |
| `moderation.decision_recorded` | moderation | catalog, artifacts, audit | `decisionId`, `action`, `subjectType`, `subjectId` |
| `notifications.requested` | any via port | notifications | `template`, `userId`, `data` refs |

`notifications.requested` is optional if each domain event is already consumed by notifications. **PROPOSED:** notifications subscribe to domain events directly and do not require a second command event. The row stays as a permitted alternative, not a second source of truth.

## Ordering

Per aggregate, consumers should apply events in `occurredAt` order and then `id`. Global order is not guaranteed. Entitlement issuance depends on `orders.order_paid`, which is written in the same transaction as the ledger and the capture handling (see containers). That event is not emitted before the order row commits.

## What is not an event

- Presigned URL contents.
- Password hashes, session secrets, webhook signing secrets.
- Raw card data.
- Full archive bytes.

## Ledger and events

The ledger is not rebuilt from events for MVP. Events notify other modules. The ledger rows are the financial source. If they ever diverge, the ledger wins and an incident is opened. Analytics must not “fix” the ledger.

## Versioning example

`orders.order_paid` data gains a field: consumers ignore unknown fields.
A change of `versionId` meaning would be `orders.order_paid.v2`, produced only by new code, consumed explicitly.
