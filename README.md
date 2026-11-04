# Talk To The Bible backend

This is the Cloudflare Worker/D1 service used by the Talk To The Bible web and Expo
clients. Render files remain only as a rollback path; production clients point at
the Worker URL in `public/config.js` and `mobile/app.json`. It keeps the OpenRouter credential on the server, applies the
verse-only response contract, compacts older chat turns,
resolves verse text from the selected translation, and exposes:

- `GET /health`
- `POST /api/chat`
- `POST /api/verses` for switching displayed verse text between KJV and The Way Version

The request body is `{ translation: "kjv" | "twb", device_id, session_id, plus, summary, profile_context, recent_messages }`.
Clients send the latest three user/assistant turns exactly and a bounded summary of older turns. The Worker also compacts legacy `messages` requests for older clients.
The response contains resolved verses, translation, model, and the direct-question
evidence status when needed. The `answer` field is intentionally empty: the
client renders authentic Scripture tiles and verified citation bubbles rather
than model-written prose.

Explicit references and ranges are deterministic. A request such as `Psalms
1:5 to 10` returns every requested verse, up to 20 verses; a single reference
returns that verse. These requests do not go through the model's short-answer
selection step.

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

## Production deployment: Cloudflare Worker + D1

Production clients use `https://talk-to-the-bible-api.focus-and-chill-media-server.workers.dev`.
The Worker keeps `OPENROUTER_API_KEY` server-side, resolves KJV and The Way
Version text, stores usage and chat context in D1, and is the supported
deployment path. The older Render Node service remains only as a rollback or
local reference path; do not point new clients at it.

From `cloudflare/`:

```bash
npx wrangler login
npx wrangler d1 execute talk-to-the-bible-db --remote --file=schema.sql
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler deploy
```

The live health check reports the configured model and storage binding. Keep
`OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODEL`, `OPENROUTER_MAX_TOKENS`, `ALLOWED_ORIGINS`, and daily limits
in `wrangler.toml`; never put the OpenRouter key in the web or mobile bundle.

## Model choice

The default production model is `openai/gpt-4.1`: it is stronger at instruction following and factual synthesis than the former mini default, while remaining far cheaper than a flagship reasoning model. `openai/gpt-4.1-mini` is the automatic fallback for a transient provider/network failure. The fallback is only used when the primary request fails; it does not change the verified-verse contract. Keep both model names configurable through `OPENROUTER_MODEL` and `OPENROUTER_FALLBACK_MODEL` and benchmark replacements against the golden tests before changing production.
The model is never trusted as the Bible source: it selects references and
fragments, then the backend resolves the exact KJV or The Way Version text and
checks every fragment as a contiguous substring. Change the model only through
`OPENROUTER_MODEL` so rollback is one environment-variable change.

### Model evaluation note

The production choice was tested against direct facts (Jesus' age, Michael),
real-life concerns, longer multi-part relationship questions, greetings, and
follow-up questions with recent citations. Nemotron 3.5 Lightning, DeepSeek
V4 Flash, Qwen3 235B, Gemini Flash, and GPT-4.1 mini/nano were all less
consistent: they either returned a generic fallback, misclassified a fact, or
ignored the fragment/status contract. GPT-4.1 was the only tested option that
reliably passed the full set. It costs more per token, but the request is kept
small with a bounded summary, the last three turns, exact verse retrieval, and
a 700-token response cap. Re-run the same golden prompts before switching to a
cheaper model.

## Context compaction and cost control

The service validates and trims each message, keeps the newest three user/assistant
turns exact,
and turns older user turns into bounded categories for situations, relationships,
concerns, preferences, and general life context. It does not call a second
summarizer model, so compaction adds no extra model request. Responses are
capped at 700 tokens by default, and the backend enforces 30 anonymous answers
per day. The frontend also shows and persists the same 30-answer daily budget.

Each request can also carry a bounded device-level profile context collected
from the user's saved chats. The Worker persists that profile in D1 so a new
chat can use it as background without replaying every old conversation. The
current design deliberately does not cite profile context; only verified verse
fragments appear in the answer. A future summarizer can update the profile
asynchronously, but should never replace the exact recent turns.

Free accounts receive 30 answers per day. Plus displays “Unlimited chats” and
uses a 1,000-answer soft limit per day (`PLUS_DAILY_REQUESTS`) to prevent abuse.
The native client passes its device identifier and Plus state; production
entitlement verification should be added before treating the client flag as a
security boundary.

## Scripture Cipher contract

For every non-safety response, the model supplies an ordered list of short,
source-backed fragments. The frontend renders one rectangular tile per
fragment, then one canonical citation bubble for each distinct reference.
Multiple genuinely different fragments from the same reference are allowed,
but duplicate or nested repeats are removed by the verification layer. The
server rejects unresolved references and non-contiguous fragments, and falls
back to one authentic verse if the model response cannot be verified. Citation
taps open the full verse; the tile itself never becomes a second prose answer.

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

## Cloudflare Worker + D1

The `cloudflare/` directory is the production-shaped Worker version. It keeps
the OpenRouter secret server-side, resolves both translations, logs each user
and assistant turn, stores daily usage, and keeps the same verse verification
contract as the Render service.

```bash
cd cloudflare
npx wrangler login
npx wrangler d1 create talk-to-the-bible-db
# Put the returned database_id in wrangler.toml.
npx wrangler d1 execute talk-to-the-bible-db --remote --file=schema.sql
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler deploy
```

Point the web and mobile clients at the deployed Worker `/api/chat` and
`/api/verses` URLs. The Render service remains a rollback path until the Worker
health endpoint and a real chat request have been verified. Never put the
OpenRouter key, Apple/Google service credentials, or database passwords in Git
or Google Docs; store them in Cloudflare Worker Secrets and the relevant store
secret manager.
