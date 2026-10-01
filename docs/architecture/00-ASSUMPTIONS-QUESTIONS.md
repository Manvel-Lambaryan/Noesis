# Assumptions and open questions

Nothing in the ASSUMPTION or OPEN rows is an approved business requirement. PROPOSED rows are technical recommendations.

## Confirmed by the starter brief

- One marketplace, one catalog, three discovery lenses.
- Buyers include individual developers, agencies, and startups.
- Sellers publish versioned digital products. Services come later.
- Monetization is a configurable commission. 10–20% is illustrative, not a rate.
- This phase does not integrate live money, deploy production, or migrate real data.
- Paid files are private. Public previews are separate.
- Seller code is not executed on the primary API.

## Assumptions (technical, reversible)

| ID | Assumption | If wrong |
| --- | --- | --- |
| A1 | MVP checkout requires a user account | Add `pending_claim` subject on entitlements. Discriminator is already in the model |
| A2 | One checkout session belongs to one seller | Multi-seller capture needs a new slice and provider support |
| A3 | The sold bytes are a specific `product_version_id` pinned on the checkout snapshot | Update policy can still grant later versions without rewriting history |
| A4 | Single region is enough to design MVP | ADR 0006 and RPO/RTO change |
| A5 | Human moderation happens before first public visibility | A post-publish audit model would change the publish guard |
| A6 | Reviews are one per buyer per product, after entitlement | Change uniqueness constraint |
| A7 | Persistent multi-item cart can wait; slice 7 can sell one offer per session | Cart UI expands inside `checkout` without a new module |
| A8 | Staffing is unknown, so no schedule is implied | Add dates only with a named team capacity |
| A9 | English UI copy at launch; architecture docs stay English | i18n slice later |
| A10 | Email is the first notification transport | Add others behind the same module |

## Questions for the owner

Options are product choices. The “system impact” column is there so a yes or no has a known engineering consequence. Recommendations are technical defaults, not decisions.

### Q1. Where do we launch, and in which currencies?

| Option | Tradeoff |
| --- | --- |
| One country, one currency | Fastest payout and tax story. Smaller market |
| A buyer currency plus a seller settlement currency, short list | Fits a global claim. FX, refunds, and ledger accounts multiply |
| Many countries on day one | Provider coverage and support load dominate the product |

**System impact:** ledger accounts are per currency. Mixed currency in one journal entry is forbidden.
**Recommendation:** none, until you name the country. Do not pick a processor first.

### Q2. Who is the merchant of record?

| Option | Tradeoff |
| --- | --- |
| Platform is merchant of record | You sell to the buyer, you handle VAT/sales tax or you hire a specialist. Sellers are your suppliers |
| Each seller is merchant of record (connect / split) | Sellers carry more compliance. Platform takes a fee. Availability depends on seller country |
| A MoR vendor (platform-style reseller) | Tax handled by them. Many MoR vendors do not pay thousands of third-party sellers |

**System impact:** ADR 0004 cannot be accepted until this is chosen.
**Recommendation:** none.

### Q3. How verified must a seller be before payout?

| Option | Tradeoff |
| --- | --- |
| Email plus payout account only | Fast. Higher fraud and frozen-funds risk |
| Government ID and tax form before first payout | Slower onboarding. Matches most marketplaces that send money |
| Full KYB for companies, lighter for individuals | Fairest, more workflow branches |

**System impact:** `seller` verification states already exist. The vendor and the required evidence list do not.
**Recommendation:** block `payout.submitted` until some owner-defined approved state. Which evidence, you decide.

### Q4. What does the buyer get when the seller ships an update?

| Option | Tradeoff |
| --- | --- |
| Exact version purchased only | Simple rights. Buyers may feel stuck |
| Same major line (bugfix/minor) included | Common for developer tools. Needs a version numbering rule |
| All future versions | Generous. Hard to sell major upgrades |

**System impact:** entitlement stores both `product_id` and `product_version_id`. Policy is a function, not a schema rewrite.
**PROPOSED technical default to model:** store both ids and an `update_policy` code. Leave the code unset in production config.

### Q5. When can a buyer get money back?

| Option | Tradeoff |
| --- | --- |
| No voluntary refunds, only where the law requires | Lower abuse. Legal minimum still needs a revoke path |
| Refund if the archive was never downloaded, limited days | Needs a trustworthy download log |
| Refund even after download, then revoke access | Simple for buyers. Easy to copy and return |

**System impact:** refund and revoke already exist as transitions. The guard that allows them is policy.
**Recommendation:** implement the transitions in sandbox with tests, and keep the guard closed until you choose.

### Q6. First categories

**ACCEPTED on 2026-09-28.** The first categories are data, not separate systems. Stable identifiers are seeded. Administrators can later rename, deactivate, reparent, and add categories without a migration. This slice does not add a category-management screen.

| Slug | Name |
| --- | --- |
| `ui-components` | UI Components |
| `authentication` | Authentication |
| `dashboards` | Dashboards |
| `backend-modules` | Backend Modules |
| `api-integrations` | API & Integrations |
| `website-templates` | Website Templates |
| `e-commerce` | E-commerce |
| `business-applications` | Business Applications |
| `mobile-applications` | Mobile Applications |
| `developer-tools` | Developer Tools |

### Q7. How deep is moderation, and who does it?

| Option | Tradeoff |
| --- | --- |
| You, manual, every first version | Safest early. Does not scale |
| Automated malware/archive checks plus manual review of first version | Matches the proposed pipeline |
| Automated only | Fast. Weak against license theft and junk |

**Recommendation:** automated quarantine checks plus a human decision before first publish (**PROPOSED** process, staffing still yours).

### Q8. Are services in MVP?

**Brief says later.** Confirm that custom development is out of MVP. If you need it now, it is a new module, not a listing flag.

### Q9. Can someone pay without an account?

| Option | Tradeoff |
| --- | --- |
| Account required | Entitlement has a stable owner. Slightly more friction |
| Guest email, claim later | Better conversion. Support and abuse cases grow |

**PROPOSED default for slices:** account required (A1). Schema includes a subject type so this can change.

### Q10. Demos

| Option | Tradeoff |
| --- | --- |
| External link supplied by the seller | No extra hosting duty. Link can be malicious; show it as off-site |
| Platform-hosted demo | Better experience. You inherit uptime and the seller’s runtime risk |

**Recommendation:** external link in MVP, clearly marked, no iframe of untrusted apps until a sandbox design exists.

### Q11. Team or enterprise licenses in MVP?

**Recommendation:** no. Model `license_code` as data so a later SKU does not need a new catalog.

### Q12. Privacy and compliance jurisdictions

Depends on Q1 and where you operate the company. The data inventory in the threat model is a starting point, not a legal opinion. Account deletion must keep ledger rows that financial law requires, and remove profile data that it does not. Retention periods are **OPEN**.

### Q13. Budget and capacity

| Option | Tradeoff |
| --- | --- |
| Lean single VM for API, managed web and database | Lower bill. Weaker isolation unless scan is a separate machine |
| Managed web, managed Postgres, separate API and scan containers | Higher bill. Matches the threat model better |

**Recommendation:** prefer separate scan isolation if the budget can bear managed containers (ADR 0006). No dollar figure is promised.

### Q14. Max archive size

| Option | Tradeoff |
| --- | --- |
| 500 MB | Covers many code templates. Tight for full app zips with assets |
| 2 GB | Comfortable for business apps. Longer scan times |
| 10 GB | Rarely needed. Expensive scans and abuse potential |

**PROPOSED default to design against, not approved:** 2 GB compressed, with a lower uncompressed cap enforced by the scanner. Change before slice 4 if you disagree.

### Q15. Copyright takedown and existing buyers

| Option | Tradeoff |
| --- | --- |
| Stop new sales; existing entitlements remain until counsel says otherwise | Avoids punishing good-faith buyers automatically |
| Revoke everyone immediately | Stronger for rightsholders. Higher dispute load |

**PROPOSED behavior while OPEN:** takedown stops public visibility and new grants; it does not mass-revoke. Mass revoke is an explicit admin action.

### Q16. Reserve before payout

A hold (for example a number of days after capture) reduces refund clawback. The number of days is **OPEN**. The ledger state `held` exists so the number can be configuration.

### Q17. Who pays the chargeback fee?

Platform, seller, or shared. Posting rules are in the payments doc as alternatives. No default.

### Q18. Support promise

What you owe after purchase (install help, bugfix window, nothing beyond the license) changes seller obligations and review expectations. **OPEN.** MVP can store a free-text support URL without an SLA.

### Q19. Must a buyer or seller prove they control the email address?

| Option | Tradeoff |
| --- | --- |
| Verify email before seller publish and before payout. Buyers verify before purchase (recommended) | Stops easy fake accounts. One extra step at signup |
| Verify sellers only | Faster buyer checkout. More fake buyer accounts and review abuse |
| No verification | Fastest. Weak account recovery and more fraud |

**ACCEPTED on 2026-09-28.** Buyers may register and browse without verifying email. Buyers must verify email before purchase. Sellers must verify email before publication. Seller identity verification is a separate process and remains mandatory before publication and payouts.

Password reset is included either way. It is a security function, not a commercial policy.

### Q20. Can a listing go public before the seller is verified?

| Option | Tradeoff |
| --- | --- |
| No. Drafts are allowed. Publish and payouts both wait for verification (recommended) | You do not take a buyer’s money for a seller you cannot pay |
| Publish first, hold payouts | The catalog fills sooner. Refunds are harder if the seller never verifies |

**ACCEPTED on 2026-09-28.** Drafts are allowed. Publish and payouts both require verification.

The JS/TS lens is a technology filter over the one catalog. It is not an editorial shortlist and not a second database.

## Decision log

| Date | Decision | Status |
| --- | --- | --- |
| 2026-09-28 | Architecture pack drafted | Draft |
| 2026-09-28 | Four PostgreSQL schemas; module table ownership kept | ACCEPTED |
| 2026-09-28 | Verification required before publish and before payout. Drafts allowed | ACCEPTED |
| 2026-09-28 | One catalog. JS/TS view is a stack filter | ACCEPTED |
| 2026-09-28 | Gate A closed for Slice 1. Gate B and Gate C remain open | ACCEPTED |
| 2026-09-28 | Q19. Buyers browse without email verification. Purchase and seller publication require a verified email. Identity verification stays separate and remains required before publication and payouts | ACCEPTED |
| 2026-09-28 | Q6. Ten initial categories, stable ids, later edits without a migration | ACCEPTED |
