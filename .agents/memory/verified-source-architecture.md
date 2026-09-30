---
name: Verified service sources
description: Durable rules for SEVA AI public-service provenance and demo-data handling.
---

Service discovery and agent matches must use service records that carry an authority, official URL, source type, last-verified value, and verification status. The application must never construct an official URL from general knowledge or a user request.

**Why:** Public-service guidance can cause real harm when a stale or invented portal is presented as authoritative. Demo records are useful for product testing but must never look like real government schemes.

**How to apply:** Keep source metadata in the service catalog/API contract, show provenance on every result, label any non-verified record `Verification required`, and route source changes through an admin verification workflow.