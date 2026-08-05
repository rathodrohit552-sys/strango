# Strango Product Expansion Phase 1

## Scope

This phase keeps the current Express, Socket.IO, React, local JSON store, and optional MongoDB snapshot persistence setup intact. The implemented slice focuses on safe stranger-chat delivery, a first intent system foundation, and small navigation/feed UI upgrades.

## Realtime Stranger Chat

- Anonymous chat sockets now opt in with `auth.mode = "stranger"`.
- The server creates an authoritative stranger session ID and room only when two real stranger sockets are matched.
- Messages require an active connected session and matching session ID before delivery.
- Waiting users can draft or hold a local pending message, but it is not delivered or shown as delivered until a stranger is connected.
- `messageDelivered` and `messageRejected` events are available for future UI telemetry and backend history integration.

## Intent Foundation

- Added local persistence tables for `user_intents`, `recommendation_feedback`, `user_privacy_settings`, and `social_links`.
- Added APIs for listing, creating, updating, and deleting intents.
- Added recommendation-feedback API for actions such as not interested, show fewer, hide community, and why.
- Dashboard now exposes a lightweight private intent selector and feed explanation controls.

## Future Integration Points

- Replace local intent ranking with a recommendation service once available.
- Persist stranger-chat transcripts only if the product requires opt-in history.
- Connect `messageDelivered`/`messageRejected` to analytics after a privacy review.
- Expand privacy settings and social links once account/profile settings are finalized.
