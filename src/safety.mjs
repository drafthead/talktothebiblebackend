const CRISIS_PATTERNS = [
  /\b(?:i\s+)?(?:do not|don't|dont|can't|cannot)\s+(?:want\s+to\s+)?live(?:\s+anymore|\s+any more)?\b/i,
  /\b(?:want|wanted|plan|planning|thinking|think|going|tried|trying)\s+to\s+(?:kill myself|end my life|take my own life|die|hurt myself)\b/i,
  /\b(?:suicid(?:e|al)|self[- ]harm|self harm|take my own life|kill myself|end my life)\b/i,
  /\b(?:no reason to live|better off dead|can't go on|cannot go on|nothing matters)\b/i,
];

export const SAFETY_NOTE = "Your safety matters. If you may act on thoughts of suicide or self-harm, call emergency services now. In the U.S. or Canada, call or text 988. Elsewhere, contact your local crisis line or emergency number, and if possible stay with someone you trust.";

export function detectSafetyConcern(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 0 && CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}
