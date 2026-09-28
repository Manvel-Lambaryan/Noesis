# Sequences

**Status:** PROPOSED. State names match [06-STATE-MACHINES](06-STATE-MACHINES.md). Provider is unnamed.

## Upload and review

```mermaid
sequenceDiagram
  participant Seller
  participant Web
  participant API
  participant Store as QuarantineBucket
  participant Scan
  participant Mod as Moderator
  Seller->>Web: Create version
  Web->>API: POST upload intent
  API->>API: version upload_pending
  API-->>Seller: Presigned PUT
  Seller->>Store: PUT archive
  Seller->>Web: Complete upload
  Web->>API: Complete
  API->>API: checksum, state quarantined, outbox
  Scan->>Store: Read object
  Scan->>Scan: Archive checks and malware verdict
  Scan->>API: Verdict
  alt fail
    API->>API: scan_rejected
  else pass
    API->>API: pending_moderation
    Mod->>API: Approve
    API->>API: approved, outbox
    API->>Store: Server-side copy to private bucket
  end
```

The copy to the private bucket runs in a worker after the approval transaction commits. If the copy fails, the version stays `approved` with `private_key` null and a retryable job. It is not publicly listed as downloadable until `private_key` is set. Checkout guard requires that.

Seller code is not started. The scan process lists archive entries and scans bytes.

## Checkout and entitlement

```mermaid
sequenceDiagram
  participant Buyer
  participant Web
  participant API
  participant Pay as PaymentProvider
  participant DB
  Buyer->>Web: Buy offer
  Web->>API: POST checkout Idempotency-Key
  API->>DB: Snapshot session, idempotency
  API->>Pay: Create checkout with same key
  Pay-->>Buyer: Hosted payment UI
  Pay->>API: Webhook
  API->>API: Verify signature
  API->>DB: Insert inbox unique
  API->>DB: Ledger, order paid, outbox
  Note over API,DB: Entitlement consumer
  API->>DB: Entitlement active
```

If the webhook is delivered twice, the second insert hits the unique provider event id and returns success without new ledger lines.

If the process dies after the inbox insert and before commit, the database rolls back and the provider redelivers.

If the process dies after commit and before the entitlement consumer finishes, the outbox relay retries. Entitlement unique on `order_id` makes the retry safe.

## Download

```mermaid
sequenceDiagram
  participant Buyer
  participant Web
  participant API
  participant DB
  participant Store as PrivateBucket
  Buyer->>Web: Download
  Web->>API: Create grant
  API->>DB: Check entitlement active
  API->>DB: Insert grant expiry and audit
  API->>Store: Presign GET
  API-->>Buyer: Short-lived URL
  Buyer->>Store: GET
```

Presign is after commit. The URL is not written into the order. A revoked entitlement fails the next grant attempt even if an old URL has not expired yet. TTL is therefore short (**PROPOSED** name `DOWNLOAD_URL_TTL_SECONDS`, value not approved; design point 60 seconds in the NFR doc as a proposal).

## Payout

```mermaid
sequenceDiagram
  participant Job
  participant API
  participant Pay as PaymentProvider
  participant DB
  Job->>DB: Sum available balance per seller and currency
  Job->>DB: Insert payout scheduled idempotent per period
  alt seller not allowed
    Job->>DB: held
  else allowed
    Job->>Pay: Submit payout same idempotency key
    Pay->>API: payout webhook
    API->>DB: Ledger journal and state settled
  end
  Job->>DB: Compare provider report to ledger
  Job->>Job: Alert if delta is non-zero
```

## Refund (policy guard open)

```mermaid
sequenceDiagram
  participant Admin
  participant API
  participant Pay as PaymentProvider
  participant DB
  Admin->>API: Request refund
  API->>API: Policy guard
  API->>Pay: Refund with idempotency key
  Pay->>API: Refund webhook
  API->>DB: Reversal journal, order refunded
  API->>DB: Entitlement revoked
```

Until the owner sets the guard, the admin endpoint can exist in staging behind a feature flag defaulting off. It must not be a silent always-on refund.

## Failure notes

| Situation | Outcome |
| --- | --- |
| Presign upload expires | Version returns to `draft` or stays a new attempt; no partial public file |
| Scan worker crash | Job retries; state remains `scanning` with a lease so two workers do not both pass |
| Approval without private copy | Not sellable |
| Webhook bad signature | 401, no inbox row |
| Capture after session expired | No auto-fulfill; finance alert; manual resolution |
| Download presign fails | Grant unused until expiry; buyer retries |
| Payout submit uncertain | Reconcile with provider by idempotency key before a second submit |
