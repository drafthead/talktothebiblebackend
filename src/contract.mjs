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
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim();
}

/** Normalize common model variants before a reference reaches the UI. */
export function canonicalReference(value) {
  const reference = String(value || '').replace(/\s+/g, ' ').trim();
  return reference.replace(/^\d+\s+(psalm|psalms)\b/i, 'Psalms');
}

function fallbackFragment(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.split(/(?<=[.!?])\s+/)[0].slice(0, 360).trim();
}

/**
 * Verify model-selected material after the verse text has been resolved.
 * Distinct fragments from the same verse are allowed so the UI can compose a
 * connected answer, but exact duplicates and a shorter phrase already
 * contained in a longer fragment are redundant and are removed.
 */
export function verifyVerseMaterial(verses, { allowWholeVerseFallback = true, maxSegments = 12 } = {}) {
  const verified = (Array.isArray(verses) ? verses : []).slice(0, maxSegments).flatMap((verse) => {
    const reference = canonicalReference(verse?.reference);
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
      sourceText: verse.sourceText,
      sourceLabel: verse.sourceLabel,
      sourceAttribution: verse.sourceAttribution,
      sourceLanguage: verse.sourceLanguage,
      sourceUrl: verse.sourceUrl,
    }];
  });
  const seen = new Set();
  return verified.filter((verse, index) => {
    const key = `${verse.reference}\u0000${normalizedQuote(verse.fragment)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !verified.some((other, otherIndex) => otherIndex !== index && other.reference === verse.reference && normalizedQuote(other.fragment).length > normalizedQuote(verse.fragment).length && normalizedQuote(other.fragment).includes(normalizedQuote(verse.fragment)));
  });
}

/** Keep a short, answer-bearing verse intact when a model returns only its
 * opening clause, so a card cannot hide the conclusion that completes it. */
export function preserveCompleteShortVerses(verses, { maxCharacters = 360, minimumFragmentRatio = 0.65 } = {}) {
  return (Array.isArray(verses) ? verses : []).map((verse) => {
    const text = String(verse?.text || '').replace(/\s+/g, ' ').trim();
    const fragment = String(verse?.fragment || '').replace(/\s+/g, ' ').trim();
    const normalizedText = normalizedQuote(text);
    const normalizedFragment = normalizedQuote(fragment);
    if (!text || !fragment || text.length > maxCharacters || normalizedFragment.length >= normalizedText.length * minimumFragmentRatio) return verse;
    return { ...verse, fragment: text };
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
