export const FACT_STATUSES = new Set([
  "Biblical status: Explicitly stated in Scripture",
  "Biblical status: Inferred from Scripture",
  "Biblical status: Traditional or scholarly estimate—not explicitly stated in Scripture",
  "Biblical status: Disputed interpretation",
  "Biblical status: Not specified in Scripture",
]);

export function normalizedQuote(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

function fallbackFragment(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.split(/(?<=[.!?])\s+/)[0].slice(0, 360).trim();
}

/**
 * Verify model-selected material after the verse text has been resolved.
 * Duplicate references are intentionally preserved: tile count and citation
 * count must stay one-to-one, even when several tiles use one verse.
 */
export function verifyVerseMaterial(verses, { allowWholeVerseFallback = true, maxSegments = 12 } = {}) {
  return (Array.isArray(verses) ? verses : []).slice(0, maxSegments).flatMap((verse) => {
    const reference = String(verse?.reference || "").trim();
    const text = String(verse?.text || "").replace(/\s+/g, " ").trim();
    if (!reference || !text) return [];
    const requested = String(verse?.fragment || "").trim();
    const normalizedRequested = normalizedQuote(requested);
    const exact = normalizedRequested && normalizedQuote(text).includes(normalizedRequested) ? requested : "";
    const fragment = exact || (allowWholeVerseFallback ? fallbackFragment(text) : "");
    if (!fragment || !normalizedQuote(text).includes(normalizedQuote(fragment))) return [];
    return [{
      reference,
      text,
      fragment,
      note: "",
    }];
  });
}

export function normalizeModelResponse(value) {
  const response = value && typeof value === "object" ? value : {};
  const mode = response.mode === "fact" || response.mode === "BIBLE_FACT" ? "fact" : "conversation";
  const verses = Array.isArray(response.verses) ? response.verses : Array.isArray(response.segments) ? response.segments : [];
  return {
    mode,
    verses,
    status: FACT_STATUSES.has(String(response.status || "")) ? String(response.status) : "",
    statusNote: String(response.statusNote || "").trim().slice(0, 500),
    truthAnchor: String(response.truthAnchor || "").trim().slice(0, 120),
  };
}
