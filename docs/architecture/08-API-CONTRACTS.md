# API contracts

**Status:** PROPOSED HTTP surface. Not an OpenAPI file yet. Slice 1 adds OpenAPI 3.1 that must match this document.

## Conventions

- Base path `/v1`.
- JSON. Timestamps ISO-8601 UTC.
- Identifiers are UUID strings (**PROPOSED**).
- Money in bodies is `{ "amountMinor": "10000", "currency": "USD" }`. `amountMinor` is a stringified integer to avoid JS float issues. Currency omitted means invalid.
- Errors: `{ "code": "string", "message": "string", "correlationId": "uuid" }`.
- Correlation: client may send `X-Correlation-Id`; otherwise the API creates one and returns it.
- Mutations that charge, refund, or pay out require `Idempotency-Key`.
- Authn: session via BFF. The API receives the session id on an internal header set only by the web server, or a private network identity. The browser does not call privileged API routes directly (**PROPOSED**).
- Authz: every route has a declared role and a resource check. Missing declaration fails closed in review.

Public GET routes are cacheable only when the body contains no entitlement-specific fields. Responses must not include object storage keys for private archives.

## Pagination

`?limit=` max 50, `?cursor=` opaque. No offset on public search after slice 3 stabilization (**PROPOSED** cursor from the start).

## Auth

| Method | Path | Auth | Effect |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | no | Create user, role buyer. Seller role added when profile is created |
| POST | `/v1/auth/login` | no | Session. Rate limited |
| POST | `/v1/auth/logout` | session | Revoke session |
| POST | `/v1/auth/email-verifications` | no | Consume a single-use token |
| POST | `/v1/auth/password-resets` | no | Request and, with a second call, set a new password. Rate limited |
| GET | `/v1/auth/session` | session | User id and roles |

Passwords never appear in logs or events.

## Discovery and listings (public)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/discovery/listings` | Query `view=general\|javascript\|business_apps`, `q`, `stack`, `category`, cursor |
| GET | `/v1/listings/{slug}` | 404 if not publicly visible |
| GET | `/v1/listings/{slug}/versions` | Labels and states visible to the public: approved only |

`view` is required on the collection route so a lens cannot accidentally query “everything” without a name. `general` is the unrestricted lens.

The detail payload includes public preview image URLs (public bucket), license summary, price of **active** offers, stacks, kind, and version labels. It does not include `quarantine_key` or `private_key`.

## Seller

| Method | Path | Notes |
| --- | --- | --- |
| PUT | `/v1/seller/profile` | Self |
| POST | `/v1/seller/products` | kind, title, category |
| PATCH | `/v1/seller/products/{id}` | Not money snapshots |
| POST | `/v1/seller/products/{id}/publish` | Guard in state machine |
| POST | `/v1/seller/products/{id}/unpublish` | |
| POST | `/v1/seller/products/{id}/versions` | version label |
| POST | `/v1/seller/versions/{id}/upload-intents` | Returns presigned PUT, expiry |
| POST | `/v1/seller/versions/{id}/complete-upload` | Body: declared size. The platform checksum is computed by the trusted worker (audit AF-3). A client hash is ignored |
| POST | `/v1/seller/products/{id}/preview-intents` | Public image only. Not the quarantine archive presign |
| POST | `/v1/seller/verification` | Submits the seller for review. Evidence fields follow Q3 |
| POST | `/v1/seller/listings/{id}/appeals` | One open appeal |
| POST | `/v1/seller/products/{id}/offers` | Creates a new offer. Does not edit an old one |
| POST | `/v1/seller/offers/{id}/archive` | |
| GET | `/v1/seller/balance` | Projection per currency |

Resource check: `product.seller_id` matches session seller.

## Checkout and buyer

| Method | Path | Idempotent | Notes |
| --- | --- | --- | --- |
| POST | `/v1/checkout/sessions` | yes | Body: `offerId`. Account required under A1 |
| GET | `/v1/checkout/sessions/{id}` | — | Buyer only |
| POST | `/v1/checkout/sessions/{id}/cancel` | yes | Before capture |
| GET | `/v1/orders` | — | Buyer |
| GET | `/v1/orders/{id}` | — | Buyer |
| GET | `/v1/entitlements` | — | Buyer |
| POST | `/v1/entitlements/{id}/download-grants` | yes | Returns URL and expiry, not the storage key |
| POST | `/v1/reviews` | yes | One per product |

## Payments webhook

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/v1/payments/webhooks/{provider}` | Provider signature. No session |

Always store the raw body for verification. Respond 2xx only after the capture transaction commits (inbox, journal, order, checkout session) or the provider event id is already stored. Do not return 2xx for a bare inbox insert that has not posted the journal. Do not wait for email, scan, or entitlement issuance.

## Admin

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/admin/moderation/queue` | |
| POST | `/v1/admin/versions/{id}/decisions` | approve, reject |
| POST | `/v1/admin/listings/{id}/takedown` | reason |
| POST | `/v1/admin/listings/{id}/restore` | from appeal |
| POST | `/v1/admin/payouts/{id}/hold` | finance |
| POST | `/v1/admin/payouts/{id}/release` | finance |
| POST | `/v1/admin/orders/{id}/refunds` | Feature-flagged off until Q5 |
| POST | `/v1/admin/break-glass/downloads` | reason, short TTL, alert |

## Error codes (minimum)

| code | When |
| --- | --- |
| `unauthenticated` | No session |
| `forbidden` | Role or resource |
| `not_found` | Hidden or missing. Do not reveal that a private id exists to a non-owner when that leaks secrets; 404 for other sellers’ drafts |
| `conflict` | Illegal state transition |
| `idempotency_conflict` | Same key, different body |
| `validation_failed` | Body |
| `rate_limited` | |
| `policy_blocked` | Refund or payout guard closed |
| `not_sellable` | Version not approved or file not promoted |

## Web to API

**PROPOSED** internal header `X-Session-Id` plus a shared internal token `INTERNAL_BFF_TOKEN` in `.env` names when implemented. The token is not a user credential. Public ingress to the API does not accept that header from the internet (network rule). Webhook route is the exception: public, signature-authenticated, no session.

## Compatibility

Until a public external API is announced, `/v1` may change with the slices. Breaking changes bump to `/v2` for that route. Event versions are independent (see event catalog).

## Non-HTTP

Workers are not HTTP contracts. Their inputs are outbox event types listed in [09-EVENT-CATALOG](09-EVENT-CATALOG.md).
