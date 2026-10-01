---
name: Verified service sources
description: Durable rules for SEVA AI public-service provenance and demo-data handling.
---

Service discovery and agent matches must use service records that carry an authority, official URL, source type, last-verified value, and verification status. The application must never construct an official URL from general knowledge or a user request.

**Why:** Public-service guidance can cause real harm when a stale or invented portal is presented as authoritative. Demo records are useful for product testing but must never look like real government schemes.

Persistent edits to authoritative service records require authenticated admin authorization. Until that exists, database-backed source records must remain read-only through public endpoints.

**Why:** An unauthenticated edit could replace a real authority or official destination and contaminate later agent guidance.

**How to apply:** Keep source metadata in the service catalog/API contract, show provenance on every result, label any non-verified record `Verification required`, and route persistent source changes through an authenticated admin verification workflow.