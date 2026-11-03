# Changelog

## 1.8.0 — 2026-11-03

- Keep looking for a rider and scheduled pickups ([dispatch strategies](https://docs.sendrelay.com.ng/tasks/keep-looking-and-scheduling)).
- Tracker state gains `searchExpiresAt`, and the `SCHEDULED` and `SEARCHING` statuses, from `@relay-sdk/sdk-browser` 1.8.0.
- Uses `@relay-sdk/sdk-browser` 1.8.0: a task status this version doesn't know is kept as its raw string and counts as not finished.

## 1.7.0 — 2026-10-29

- First release, versioned with the other Relay app SDKs (they move together). Matches the shared SDK conformance suite (packages/sdks/conformance).
