# Changelog

## 1.10.0 — 2026-11-09

- Released with `@relay-sdk/sdk-browser` 1.10.0: presence types add `requirements`, and the tracker now receives each task's events in revision order, once. No change in this package.

## 1.9.0 — 2026-11-08

- Requires `@relay-sdk/sdk-browser` 1.9.0 behaviour: trackers handle `STAGE_ARRIVED`, `TASK_DETAILS_UPDATED` and `TASK_RIDER_UNASSIGNED` (a rider cancel SendRelay answers by finding another rider moves the task back to PENDING).

## 1.8.0 — 2026-11-03

- Keep looking for a rider and scheduled pickups ([dispatch strategies](https://docs.sendrelay.com.ng/tasks/keep-looking-and-scheduling)).
- Tracker state gains `searchExpiresAt`, and the `SCHEDULED` and `SEARCHING` statuses, from `@relay-sdk/sdk-browser` 1.8.0.
- Uses `@relay-sdk/sdk-browser` 1.8.0: a task status this version doesn't know is kept as its raw string and counts as not finished.

## 1.7.0 — 2026-10-29

- First release, versioned with the other SendRelay app SDKs (they move together). Matches the shared SDK conformance suite (packages/sdks/conformance).
