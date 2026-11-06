import { canonicalReference } from './contract.mjs';

// Assistant messages arrive from clients as rendered cards such as
// "Psalm 23:1: The Lord is my shepherd". Keep the extraction tolerant of
// older clients that send a JSON response or a structured verses array too.
const referencePattern = /((?:[1-3]\s+)?[\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,3}\s+\d+:\d+(?:-\d+)?)/giu;

function collect(value, references) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, references);
    return;
  }
  if (typeof value === 'object') {
    collect(value.reference, references);
    collect(value.verses, references);
    collect(value.content, references);
    return;
  }
  const text = String(value);
  for (const match of text.matchAll(referencePattern)) {
    const reference = canonicalReference(match[1]);
    if (reference) references.add(reference.toLowerCase());
  }
}

export function recentReferences(messages, { limit = 10 } = {}) {
  const references = new Set();
  for (const message of (Array.isArray(messages) ? messages : []).slice(-limit)) {
    if (message?.role !== 'assistant') continue;
    collect(message, references);
    if (typeof message?.content === 'string' && message.content.trim().startsWith('{')) {
      try { collect(JSON.parse(message.content), references); } catch { /* rendered text is still scanned above */ }
    }
  }
  return references;
}
