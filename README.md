# Talk To The Bible backend

This is the small Render service used by the Talk To The Bible web and Expo
clients. It keeps the OpenRouter credential on the server, applies the Bible
response rules from the connected Bible AI document, compacts older chat turns,
resolves verse text from the selected translation, and exposes:

- `GET /health`
- `POST /api/chat`

The request body is `{ translation: "kjv" | "twb", session_id, messages }`.
The response contains the answer, resolved verses, translation, model, daily
remaining count, and the direct-question evidence status when needed.

## Run locally

```bash
npm install
cp .env.example .env
# Put the key in .env locally only; never commit it.
npm start
```

The backend listens on port `10000` by default. KJV text is resolved through
`bible-api.com`. The Way Version text is resolved from the current reader data
at `https://thewayversion.com/app/data/books/<book>.json`, the same book JSON
format used by the current Way reader. Both source URLs are configurable.

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

The default is `google/gemini-2.5-flash`: it is a strong general reasoning
model with a large context window and current OpenRouter structured-output
support. Bible accuracy does not depend on the model's memory alone: the model
selects references, then the backend resolves the exact KJV or The Way Version
text from a canonical source before returning it. To reduce cost further, set
`OPENROUTER_MODEL=google/gemini-2.5-flash-lite`; to change models later, only
the Render environment variable needs to change.

## Context compaction and cost control

The service validates and trims each message, keeps the newest 8–9 turns exact,
and turns older turns into a bounded memory block. It does not call a second
summarizer model, so compaction adds no extra model request. Responses are
capped at 450 tokens by default, and the backend enforces 30 anonymous answers
per day. The frontend also shows and persists the same 30-answer daily budget.

This anonymous limit is appropriate for the current test build. Before a public
launch, replace the in-memory counter with authenticated user IDs plus durable
storage/Redis, and connect the Plus purchase to a server-verified entitlement.

## Test

```bash
npm test
```
