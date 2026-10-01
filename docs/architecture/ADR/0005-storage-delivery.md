# ADR 0005 — Storage and delivery

**Status:** PROPOSED for the mechanism. Vendor OPEN, tied to ADR 0006.  
**Date:** 2026-09-28

## Context

Paid archives are the asset buyers pay for. They are also untrusted input. Public marketing images are a different class of file. The brief requires private objects, short-lived links, an entitlement check before every link, and separation of previews from paid bytes.

## Options

### A. S3-compatible API, three buckets, presigned URLs

Works on AWS S3, Cloudflare R2, MinIO, and others. Application code depends on the API, not on a vendor SDK surface beyond signing. Quarantine, private, and public buckets match the lifecycle doc.

### B. Serve bytes through the API

Entitlement check is natural. The API becomes a bandwidth bottleneck and a place where archive bytes sit next to payment credentials. Easier to accidentally buffer a hostile file in the API process.

### C. Public bucket with unguessable URLs

Not acceptable. Unguessable is not authorization. Objects would be world-readable if leaked.

## Decision

**PROPOSED: option A.**

- Upload: presigned PUT to quarantine only, size and content-type constrained.
- After scan pass and moderator approval: server-side copy into the private bucket.
- Download: transaction records a grant, then a presigned GET with a short TTL. The check runs on every grant, not once at purchase.
- Public bucket: previews only.
- Vendor: **OPEN.** Choose with the host in ADR 0006 so network egress and IAM stay coherent. MinIO is fine for local development.

**PROPOSED TTL design points** (not approved policy): download 60 seconds, upload 15 minutes. Names live in `.env.example`.

## Consequences

- Email and notifications never include the presigned URL (it would outlive the intended channel and get logged).
- CDN may cache public previews. It must not cache the private host.
- Loss of a private object is an incident; the entitlement row remains.
- Checksum is shown to the entitled buyer so they can verify what they received.

## Revisit when

Archive sizes or download volume make egress cost the dominant bill, or a vendor cannot express “deny public ACL.”
