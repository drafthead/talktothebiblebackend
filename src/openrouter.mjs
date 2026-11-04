const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function requestOpenRouter({ apiKey, primaryModel, fallbackModel, payload, referer, title, fetchImpl = fetch, timeoutMs = 6000 }) {
  const models = [...new Set([primaryModel, fallbackModel].filter(Boolean))];
  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`OpenRouter timeout after ${timeoutMs}ms`)), timeoutMs);
    try {
      const response = await fetchImpl(OPENROUTER_URL, {
        method: 'POST',
        signal: controller.signal,
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
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
