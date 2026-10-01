# Security and threat model

**Status:** Design controls for later slices. This is not a penetration test and not a statement that NOESIS is secure.

Badge rule (**CONFIRMED**): a listing may say “malware scan passed” or “human approved” only when that row exists. It must not say the code is safe, vulnerability-free, or production-ready.

## Assets

| Asset | Why it matters |
| --- | --- |
| Private archives | Paid intellectual property; may also contain malware |
| Ledger and payout instructions | Direct financial loss |
| Sessions | Account takeover |
| Webhook secrets | Fake captures |
| Personal data | Privacy obligations, jurisdiction OPEN |
| Audit log | Trust in admin action |
| Discovery index | Not authoritative, but can be abused for spam |

## Actors

Buyer, seller, moderator, finance admin, anonymous internet, malicious seller, stolen-account attacker, compromised dependency in our own app. Payment provider is an external system, not a trusted narrator.

## Threats and controls

| Threat | Impact | Control | Slice |
| --- | --- | --- | --- |
| Malicious archive (malware, zip bomb, path traversal in entry names) | Host compromise if executed or extracted naively | Do not execute. Scan process with no database credentials. Caps on entries, uncompressed size, ratio. Reject absolute paths and `..`. Timeout | 4 |
| Seller-supplied checksum | A different file than the one reviewed | Worker computes sha256. Client hash is not stored as the record | 4 |
| Preview upload used as a paid archive | Public malware or leaked source | Separate image presign, type and size cap, different bucket prefix | 3 |
| Payment event applied twice | Double order, double revoke | One consumer path per outcome (audit AF-2) | 7 |
| Supply chain inside seller code | Buyer compromise after download | Out of platform execution. Document that scan is not an audit. Optional future reputation | — |
| License abuse / link sharing | Revenue loss | Short-lived URLs, entitlement recheck, no permanent public object | 8 |
| Leaked signed URL | Unauthorized download until TTL | Short TTL proposal, no URL in email, object keys unguessable | 8 |
| Webhook spoofing | Fake entitlement | Signature verify, timestamp skew window, unique event id | 7 |
| Duplicate charge or duplicate ledger | Wrong balances | Idempotency-Key, unique provider event, unique ledger `(source_type, source_id, leg)` | 7 |
| Payout fraud (seller pays themselves via bug or stolen admin) | Loss of funds | Verification gate, hold state, finance role separate from moderator, reconciliation alert, audit | 10 |
| Account takeover | Theft of entitlements and seller payouts | Argon2id, login rate limit, `__Host-` HttpOnly cookie, server-side revoke, single-use reset tokens. MFA before payout change remains **PROPOSED** | 2, 10 |
| IDOR on drafts and downloads | Data leak | 404 for non-owners, entitlement check server-side | 3, 8 |
| Review manipulation | Misleading quality | Only entitled buyers, one review, rate limit, hide-without-delete | 9 |
| Search abuse and listing spam | Junk catalog | Moderation before publish, rate limit create/upload, report path | 3, 5 |
| Seller impersonation | Brand harm | Unique slug policy, no unverified “official” badge, display name not an auth factor | 2 |
| Admin misuse | Mass takedown or data theft | Audit same transaction, break-glass with reason and alert | 5 |
| CSRF on cookie session | Unwanted purchase or payout change | SameSite=Lax cookie on the web host, state-changing routes via the BFF, cross-site Origin rejected. A CSRF token remains **PROPOSED** only if a browser-to-API cookie appears later | 2 |
| XSS stealing session | Account takeover | HttpOnly cookie, CSP **PROPOSED**, no tokens in localStorage | 2 |
| SSRF via demo URL or webhook | Internal network access | Demo is an external link rendered as text/anchor, not server-side fetch. Webhook URL is ours, not seller-supplied | 6 |
| Dependency compromise | Platform compromise | Lockfile, CI scan, least privilege on cloud roles when they exist | 1 |
| Secrets in git | Full compromise | `.env.example` names only, secret manager later, gitleaks in CI | 1 |
| Ledger DB role too powerful | Silent balance edits | API role without UPDATE/DELETE on ledger tables | 7 |
| Cross-module bug writes another schema | Broken invariants | Architecture test on imports; DB roles per module are **FUTURE** hardening if one role is too weak operationally for MVP | 1 |
| PII in logs | Privacy breach | Structured logs with allowlisted fields; no passwords, cookies, presigned URLs, raw webhooks | 1 |
| Replay of download grant id | Extra copies | Grant bound to entitlement state at issue time; TTL; optional single-use is OPEN and not required for MVP | 8 |

## OWASP-oriented mapping

| Area | Design response |
| --- | --- |
| Broken access control | Default deny, resource owner checks, 404 on others’ drafts |
| Cryptographic failures | TLS everywhere, AES at rest via storage SSE, password hashing, no custom crypto |
| Injection | Parameterized SQL via ORM, no shell built from archive entry names |
| Insecure design | This threat model, state guards, ledger reversals |
| Security misconfiguration | Private buckets, block public ACLs, scan isolation |
| Vulnerable components | CI scanning when code exists |
| Auth failures | Session revoke, lockout, separate finance role |
| Integrity failures | Webhook signatures, checksums on artifacts, audit log |
| Logging failures | Correlation id, security counters, no secrets in logs |
| SSRF | No server fetch of seller demo URLs |

## Rate limits (proposed starting points, tune with data)

| Route | Idea |
| --- | --- |
| login / register | Tight per IP and per email |
| upload intent | Per seller per hour |
| checkout | Per user |
| download grant | Per entitlement per minute |
| search | Per IP |
| webhook | Per provider IP allowlist if the provider publishes ranges; signature still required |

Numbers are not SLOs. They are knobs.

## Privacy

Data inventory: account email, password hash, seller display name, payout provider reference, order history, IP on audit/security events (**PROPOSED**), support text, reviews.

Not collected in MVP by design: card PAN (provider hosted page), archive contents in the database, government ID images until Q3 chooses a vendor and a storage rule.

Deletion: see data ownership. Legal retention wins over a “delete everything” button. Jurisdiction **OPEN**.

Copyright: takedown path exists. Counter-notice process is an operational policy still **OPEN**.

## Incident response (outline)

1. Identify (alert on webhook failures, ledger delta, scan outage, auth anomaly).
2. Contain (revoke sessions, pause payouts, disable checkout feature flag, keep public reads if safe).
3. Eradicate and recover from backup if data was corrupted. Ledger corruption is restore-forward with compensating entries, not silent edits, unless the backup itself is the recovery.
4. Notify affected people if personal data or unauthorized download is confirmed. Counsel defines the duty. **OPEN** with Q12.
5. Post-incident note stored with the audit trail.

No on-call rota exists. That is an operations gap, not a hidden assumption that someone is watching.

## Abuse cases that are product decisions

Refund abuse, review brigading from refunded accounts, and shared logins are reduced by the controls above and still depend on Q5 and support policy.
