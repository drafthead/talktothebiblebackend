# Talk To The Bible backend

This is the small Render service used by the Talk To The Bible web and Expo
clients. It keeps the OpenRouter credential on the server, applies the
verse-only response contract, compacts older chat turns,
resolves verse text from the selected translation, and exposes:

- `GET /health`
- `POST /api/chat`
- `POST /api/verses` for switching displayed verse text between KJV and The Way Version

The request body is `{ translation: "kjv" | "twb", session_id, messages }`.
The response contains resolved verses, translation, model, and the direct-question
evidence status when needed. The `answer` field is intentionally empty: the
client renders authentic Scripture tiles and verified citation bubbles rather
than model-written prose.

## Run locally

```bash
npm install
cp .env.example .env
# Put the key in .env locally only; never commit it.
npm start
```

The backend listens on port `10000` by default. KJV text is resolved through
`bible-api.com`. The Way Version text is resolved from the bundled
`data/way/books` reader data, copied from the current Way reader. If a local
book is unavailable, it falls back to
`https://thewayversion.com/app/data/books/<book>.json`. Both source URLs are
configurable.

## Render

Create a Node web service from `drafthead/talktothebiblebackend` with:

- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Set `OPENROUTER_API_KEY` in Render Environment as a secret. The key is never
sent to the browser. `render.yaml` provides the safe defaults and asks Render
for the secret during Blueprint setup. Optional settings include
`OPENROUTER_MODEL`, `OPENROUTER_MAX_TOKENS`, `ALLOWED_ORIGINS`, and
`MAX_DAILY_REQUESTS`.

## Model choice

The safe default is `google/gemini-2.5-flash`. The November 3, 2026 product
spec identifies `anthropic/claude-sonnet-5.5` as the quality baseline and
`google/gemini-3.8-flash` as the lower-cost challenger; benchmark those exact
OpenRouter IDs against the golden tests before changing Render's environment.
The model is never trusted as the Bible source: it selects references and
fragments, then the backend resolves the exact KJV or The Way Version text and
checks every fragment as a contiguous substring. Change the model only through
`OPENROUTER_MODEL` so rollback is one environment-variable change.

## Context compaction and cost control

The service validates and trims each message, keeps the newest 8–9 turns exact,
and turns older user turns into bounded categories for situations, relationships,
concerns, preferences, and general life context. It does not call a second
summarizer model, so compaction adds no extra model request. Responses are
capped at 450 tokens by default, and the backend enforces 30 anonymous answers
per day. The frontend also shows and persists the same 30-answer daily budget.

This anonymous limit is appropriate for the current test build. Before a public
launch, replace the in-memory counter with authenticated user IDs plus durable
storage/Redis, and connect the Plus purchase to a server-verified entitlement.

## Scripture Cipher contract

For every non-safety response, the model supplies an ordered list of short
source fragments. The frontend renders exactly one rectangular tile per item,
then exactly one citation bubble per item in the same order. Duplicate
references are preserved intentionally; ten tiles require ten bubbles even if
several come from one verse. The server rejects unresolved references and
non-contiguous fragments, and falls back to one authentic verse if the model
response cannot be verified. Citation taps open the full verse; the tile itself
never becomes a second prose answer.

Direct biblical fact questions additionally return one of the five controlled
`Biblical status` labels plus an optional short `statusNote`. This is rendered
below the citation row and is not counted as a tile or citation. Word-source
citations prove the wording of a tile, not automatically the factual truth of a
stitched sentence, so uncertain ages, dates, and chronologies must be labeled.

The full authoritative behavior, including the 20 golden conversations,
accuracy exception for Jesus' age, safety override, and QA gates, is maintained
in the linked Google Doc titled `Bible Bot — Implementation Spec & 20 Examples —
v2.0`. Keep that specification and this API contract aligned when adding
examples.

## Test

```bash
npm test
```
