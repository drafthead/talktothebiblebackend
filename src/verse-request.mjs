function cleanBook(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().replace(/[.,!?;:]+$/, '')
    .replace(/^(?:please\s+)?(?:give\s+me|show\s+me|read|open|fetch|get)\s+/i, '');
}

function stripRequestLead(value) {
  return String(value || '').replace(/^\s*(?:please\s+)?(?:give\s+me|show\s+me|read|open|fetch|get)\s+/i, '').trim();
}

// Explicit verse requests are deterministic: the model should not choose only
// a couple of examples when the user asked for a passage or chapter range.
export function parseExplicitVerseRequest(question) {
  const text = stripRequestLead(question);
  const range = text.match(/\b((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+):(\d+)\s*(?:-|–|—|\bto\b|\bthrough\b)\s*(?:(?:[1-3]\s+)?[A-Za-z]+\s+)?(?:(\d+):)?(\d+)\b/i);
  if (range) {
    const book = cleanBook(range[1]);
    const chapter = Number(range[2]);
    const start = Number(range[3]);
    const endChapter = Number(range[4] || chapter);
    const end = Number(range[5]);
    if (endChapter === chapter && end >= start) return { book, chapter, start, end: Math.min(end, start + 19), kind: 'range' };
  }
  const single = text.match(/\b((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+):(\d+)\b/i);
  if (single) return { book: cleanBook(single[1]), chapter: Number(single[2]), start: Number(single[3]), end: Number(single[3]), kind: 'single' };
  const chapter = text.match(/^(?:give me|show me|read|open)\s+((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+chapter\s+(\d+)\s*$/i)
    || text.match(/^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+chapter\s+(\d+)\s*$/i)
    || text.match(/^(?:give me|show me|read|open)\s+((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+)\s*$/i)
    || text.match(/^((?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+)\s*$/i);
  if (chapter) return { book: cleanBook(chapter[1]), chapter: Number(chapter[2]), start: 1, end: 20, kind: 'chapter' };
  return null;
}

export function referencesForVerseRequest(request) {
  if (!request) return [];
  return Array.from({ length: request.end - request.start + 1 }, (_, index) => `${request.book} ${request.chapter}:${request.start + index}`);
}
