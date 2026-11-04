const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function requestOpenRouter({ apiKey, primaryModel, fallbackModel, payload, referer, title, fetchImpl = fetch }) {
  const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
  for (const model of models) {
    try {
      const response = await fetchImpl(OPENROUTER_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'http-referer': referer,
          'x-title': title,
        },
        body: JSON.stringify({ ...payload, model }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return { body, model };
    } catch {
      // A transient timeout/network failure should try the configured fallback.
    }
  }
  return null;
}

