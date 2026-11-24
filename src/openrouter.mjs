const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function requestOpenRouter({ apiKey, primaryModel, fallbackModel, payload, referer, title, fetchImpl = fetch, timeoutMs = 6000, validateResponse }) {
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
      if (response.ok) {
        if (typeof validateResponse === 'function' && !validateResponse(body)) {
          // A successful HTTP response can still contain unusable model output,
          // such as prose instead of the required JSON verse-selection shape.
          // Treat that as a failed attempt so the next configured model gets a
          // chance to produce a compatible response.
          console.warn('[openrouter] rejected response shape', {
            model,
            status: response.status,
            hasChoices: Array.isArray(body?.choices) && body.choices.length > 0,
            contentType: typeof body?.choices?.[0]?.message?.content,
          });
          continue;
        }
        return { body, model };
      }
      console.warn('[openrouter] provider response failed', {
        model,
        status: response.status,
        code: body?.error?.code || body?.error?.type || '',
        message: String(body?.error?.message || '').slice(0, 180),
      });
    } catch (error) {
      // A transient timeout/network failure should try the configured fallback.
      console.warn('[openrouter] request failed', { model, error: error?.name || 'unknown' });
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
