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

Slice 5 writes `catalog.artifact_outbox` and `catalog.catalog_outbox` in that same transaction for approval, rejection, promotion, publish, takedown, restore, and appeal. The row `id` is the dedupe key and `created_at` is the occurrence time. The stored payload is the event `data` plus `decisionId` when a person decided. `correlationId` and `causationId` are not copied onto these rows yet. There is no outbox poller and no Kafka. Discovery is updated in-process after the commit. If that rebuild fails, `POST /v1/admin/discovery/rebuild` is the retry. Promotion is a BullMQ job (`promote-{versionId}`) with three attempts. The worker claims `private_key` with a conditional update, so a retry does not write a second `artifacts.object_promoted` row. If the API dies after the approval commit and before enqueue, the version stays approved and unsellable until the worker process starts and runs `retryApprovedPromotions`. Listing publish is still a separate seller action; `artifacts.object_promoted` makes the version eligible and does not by itself set `listing_state`.

## Catalog

| type | Producer | Consumers | Data |
| --- | --- | --- | --- |
| `iam.user_registered` | iam | notifications, analytics | `userId` |
| `seller.verification_changed` | seller | payments (payout eligibility), notifications | `sellerId`, `state` |
| `catalog.listing_published` | catalog | discovery, analytics | `productId`, `slug`, `kind`, `stacks` |
| `catalog.listing_unpublished` | catalog | discovery | `productId` |
| `catalog.listing_taken_down` | catalog | discovery, entitlements | `productId`, `decisionId` |
| `catalog.listing_restored` | catalog | discovery | `productId` |
| `artifacts.version_quarantined` | artifacts | scan queue (the scan process has no database credentials) | `versionId`, `productId` |
| `artifacts.scan_completed` | artifacts | notifications, moderation queue | `versionId`, `verdict` |
| `artifacts.version_approved` | artifacts | notifications | `versionId`, `productId`. Not sellable until `artifacts.object_promoted` |
| `artifacts.object_promoted` | artifacts | catalog, discovery, notifications | `versionId`, `productId`, `sha256` |
| `artifacts.version_rejected` | artifacts | notifications | `versionId`, `reasonCode` |
| `artifacts.version_withdrawn` | artifacts | discovery, catalog | `versionId`, `productId` |
| `pricing.offer_activated` | pricing | discovery | `offerId`, `productId`, `amountMinor`, `currency` |
| `pricing.offer_archived` | pricing | discovery | `offerId` |
| `checkout.session_created` | checkout | analytics | `checkoutId`, `offerId`, `amountMinor`, `currency` |
| `payments.charge_captured` | payments | analytics | `checkoutId`, `providerEventId`, `amountMinor`, `currency`, `commissionBps`. Does not create the order |
| `payments.charge_failed` | payments | checkout, notifications | `checkoutId` |
| `payments.refund_captured` | payments | analytics | `orderId`, `amountMinor`, `currency`. Does not revoke entitlements |
| `payments.dispute_opened` | payments | analytics | `orderId` |
| `payments.dispute_closed` | payments | analytics | `orderId`, `outcome` |
| `orders.dispute_opened` | orders | entitlements, notifications | `orderId` |
| `orders.dispute_closed` | orders | entitlements | `orderId`, `outcome` |
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

## One side effect, one consumer

Audit AF-2. The capture composition root writes the payments journal, the order, and the checkout session in one transaction. It also writes `orders.order_paid`. Entitlements, email, and discovery react to the order, catalog, or artifact event. They do not also react to the payment event for the same outcome.

| Outcome | Single consumer path |
| --- | --- |
| Order created | Composition root writes the order. `payments.charge_captured` is a record for analytics |
| Entitlement issued | `orders.order_paid` |
| Entitlement revoked | `orders.order_refunded` |
| Entitlement frozen or restored | `orders.dispute_opened` and `orders.dispute_closed` |
| Listing becomes sellable in search | `artifacts.object_promoted` |

A second consumer that repeats the write is a defect, even if the unique key would hide it.

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
