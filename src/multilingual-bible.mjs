const EDITIONS = {
  es: { slug: 'rvr1909', name: 'Reina-Valera 1909', language: 'es' },
  fr: { slug: 'lsg', name: 'Louis Segond', language: 'fr' },
  de: { slug: 'luth1912', name: 'Lutherbibel 1912', language: 'de' },
  it: { slug: 'diodati', name: 'Bibbia Diodati 1649', language: 'it' },
  nl: { slug: 'dutch1917', name: 'De Heilige Schrift 1917', language: 'nl' },
  'zh-CN': { slug: 'cuvs', name: 'Chinese Union Version (Simplified)', language: 'zh' },
  ja: { slug: 'kgy', name: 'Kōgoyaku Bible', language: 'ja' },
  ko: { slug: 'kor', name: '개역한글판', language: 'ko' },
  hi: { slug: 'irv-hi', name: 'Indian Revised Version Hindi', language: 'hi' },
  bn: { slug: 'irv-bn', name: 'Indian Revised Version Bengali', language: 'bn' },
  pt: { slug: 'almeida-livre', name: 'Bíblia Livre (Almeida 1819)', language: 'pt-BR' },
};

const cache = new Map();

function bookSlug(name) {
  const normalized = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const aliases = { psalm: 'psalms', 'song of songs': 'song-of-solomon', 'song of solomon': 'song-of-solomon' };
  return (aliases[normalized] || normalized).replace(/ /g, '-');
}

function parseReference(reference) {
  const match = String(reference || '').trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  return match ? { book: match[1], chapter: Number(match[2]), start: Number(match[3]), end: Number(match[4] || match[3]) } : null;
}

function editionFor(language) {
  return EDITIONS[String(language || '').trim()] || null;
}

export function localizedEdition(language) { return editionFor(language); }

export async function resolveLocalizedVerse(reference, language, baseUrl = 'https://api.midvash.com') {
  const edition = editionFor(language);
  const parsed = parseReference(reference);
  if (!edition || !parsed) return null;
  const key = `${edition.slug}|${parsed.book}|${parsed.chapter}|${parsed.start}|${parsed.end}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      const path = `${baseUrl.replace(/\/$/, '')}/v1/${encodeURIComponent(edition.slug)}/${encodeURIComponent(bookSlug(parsed.book))}/${parsed.chapter}/${parsed.start}${parsed.end === parsed.start ? '' : `-${parsed.end}`}`;
      const response = await fetch(path, { signal: AbortSignal.timeout(7000), headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`Localized Bible source returned ${response.status}`);
      const payload = await response.json();
      const text = String(payload?.data?.text || '').replace(/\s+/g, ' ').trim();
      if (!text) return null;
      return {
        reference: payload?.meta?.reference || `${parsed.book} ${parsed.chapter}:${parsed.start}${parsed.end === parsed.start ? '' : `-${parsed.end}`}`,
        text,
        sourceLabel: String(payload?.data?.version || edition.name),
        sourceAttribution: String(payload?.meta?.copyright || edition.name),
        sourceLanguage: language,
        sourceUrl: path,
      };
    })());
  }
  try { return await cache.get(key); } catch { cache.delete(key); return null; }
}
