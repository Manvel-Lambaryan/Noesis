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
- Authn: server session via the BFF. The browser calls the Next.js host. The API accepts `X-Session-Id` only together with `X-Internal-Token` (`INTERNAL_BFF_TOKEN`). That token is not a user credential. `/v1` routes reject callers that do not present it.
- Authz: every route has a declared role and a resource check. Missing declaration fails closed in review.

Public GET routes are cacheable only when the body contains no entitlement-specific fields. Responses must not include object storage keys for private archives.

## Pagination

`?limit=` max 50, `?cursor=` opaque. No offset on public search after slice 3 stabilization (**PROPOSED** cursor from the start).

## Auth

| Method | Path | Auth | Effect |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | no | Create user, role buyer. Returns `userId`. Sends a single-use email verification token |
| POST | `/v1/auth/login` | no | New server session. Rate limited. Same error for an unknown email and a wrong password. The raw session token is for the BFF only |
| POST | `/v1/auth/logout` | session | Revoke the presented session |
| POST | `/v1/auth/email-verifications` | no | `{ token }` consumes a single-use token. `{ email }` requests another link and always returns 202 when the address is well formed. Rate limited |
| POST | `/v1/auth/password-resets` | no | `{ email }` requests a link and does not reveal whether the account exists. `{ token, password }` sets a new password, revokes sessions, and cannot be reused. Rate limited |
| GET | `/v1/auth/session` | session | User id, roles, permissions, email verification, and the purchase and seller-publication gates |

Q19 gates on `GET /v1/auth/session`: purchase requires the buyer role and a verified email. Seller publication requires the seller role, a verified email, and `verification_approved`. Browsing does not call these gates. Checkout and publication are not implemented in Slice 2; later slices must call the same checks.

`GET /v1/admin/moderation/queue` requires the `moderation` permission. `POST /v1/admin/payouts/{id}/hold` requires the `finance` permission and then returns `not_available` because payouts are not in this slice. A moderator does not pass the finance check.

`PUT /v1/seller/profile` saves the caller's draft and grants the seller role. The body cannot choose another user. `GET /v1/seller/profile` returns only the caller's profile.

Passwords never appear in logs or events.

## Discovery and listings (public)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/discovery/listings` | Query `view=general\|javascript\|business_apps`, `q`, `stack`, `category`, cursor |
| GET | `/v1/listings/{slug}` | 404 if not publicly visible |
| GET | `/v1/listings/{slug}/versions` | Labels and states visible to the public: approved only |

`view` is required on the collection route so a lens cannot accidentally query “everything” without a name. `general` is the unrestricted lens. Slice 3 also accepts `kind` (`code_asset` or `business_application`) on that route.

Slice 3 implements `GET /v1/categories`, `GET /v1/discovery/listings`, `GET /v1/listings/{slug}`, and `GET /v1/listings/{slug}/versions`. Versions are an empty list until artifacts exist. The detail payload uses `summary` for the description. `licenseSummary` and `price` are null. Preview entries are public media URLs, not storage keys.

The standing detail shape includes public preview image URLs, a license summary, the price of active offers, stacks, kind, and version labels. Slice 3 returns null for the license and the price. It does not include `quarantine_key` or `private_key`.

## Seller

| Method | Path | Notes |
| --- | --- | --- |
| PUT | `/v1/seller/profile` | Self |
| GET | `/v1/seller/products` | Caller's drafts only. Slice 3 |
| POST | `/v1/seller/products` | kind, title, category. Requires the seller role. Rate limited. Slice 3 |
| GET | `/v1/seller/products/{id}` | Owner only. Another seller receives 404. Slice 3 |
| PATCH | `/v1/seller/products/{id}` | Drafts only. Not money snapshots. Slice 3 |
| POST | `/v1/seller/products/{id}/publish` | Not implemented. Guard in the state machine. Slice 5 |
| POST | `/v1/seller/products/{id}/unpublish` | |
| POST | `/v1/seller/products/{id}/versions` | version label. Slice 4. Creates `draft` |
| GET | `/v1/seller/products/{id}/versions` | Owner only. No object keys. Slice 4 |
| GET | `/v1/seller/versions/{id}` | Owner only. Returns state, size, trusted checksum, and reason. Slice 4 |
| POST | `/v1/seller/versions/{id}/upload-intents` | Returns a single-use PUT URL and expiry. Does not return the object key. Slice 4 |
| POST | `/v1/seller/versions/{id}/complete-upload` | Body: declared size. The platform checksum is computed by the trusted worker (audit AF-3). A client hash is ignored. Returns 202. Slice 4 |
| POST | `/v1/seller/products/{id}/preview-intents` | PNG, JPEG, or WebP only. Returns an intent id, not a quarantine presign. Slice 3 |
| POST | `/v1/seller/products/{id}/previews` | Consumes one intent and stores bytes under `previews/`. Slice 3 |
| POST | `/v1/admin/discovery/rebuild` | Moderation permission. Indexes a product only when it is `published` and artifacts report a sellable version. Slice 3 |
| POST | `/v1/seller/verification` | Submits the seller for review. Evidence fields follow Q3 |
| POST | `/v1/seller/listings/{id}/appeals` | One open appeal |
| POST | `/v1/seller/products/{id}/offers` | Creates a new offer. Does not edit an old one |
| POST | `/v1/seller/offers/{id}/archive` | |
| GET | `/v1/seller/balance` | Projection per currency |

Resource check: `product.seller_id` matches session seller. `PUT /uploads/quarantine/{token}` is outside `/v1` and does not use the internal token. The public media controller does not read quarantine objects. Publication and moderation routes stay unimplemented.

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

Implemented for Slice 2. The web server sends `X-Session-Id` and `X-Internal-Token`. The browser receives an `__Host-` `HttpOnly`, `Secure`, `SameSite=Lax` cookie and never receives the raw session token or the internal token. Public ingress to the API must still not accept those headers from the internet (ADR 0006 remains open). The webhook route, when it exists, stays public and signature-authenticated.

## Compatibility

Until a public external API is announced, `/v1` may change with the slices. Breaking changes bump to `/v2` for that route. Event versions are independent (see event catalog).

## Non-HTTP

Workers are not HTTP contracts. Their inputs are outbox event types listed in [09-EVENT-CATALOG](09-EVENT-CATALOG.md).
