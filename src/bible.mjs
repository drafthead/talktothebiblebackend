const wayCache = new Map();
const BOOK_ALIASES = new Map([["psalm", "psalms"], ["song of songs", "song-of-solomon"], ["song of solomon", "song-of-solomon"]]);

function bookSlug(name) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return (BOOK_ALIASES.get(normalized) || normalized).replace(/ /g, "-");
}

export function parseReference(reference) {
  const match = String(reference || "").trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return { book: match[1], chapter: Number(match[2]), start: Number(match[3]), end: Number(match[4] || match[3]) };
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Bible source returned ${response.status}`);
  return response.json();
}

async function resolveKjv(reference) {
  const base = process.env.KJV_API_BASE_URL || "https://bible-api.com";
  const payload = await fetchJson(`${base.replace(/\/$/, "")}/${encodeURIComponent(reference)}?translation=kjv`);
  const text = String(payload?.text || "").replace(/\s+/g, " ").trim();
  return text ? { reference: payload.reference || reference, text } : null;
}

async function getWayBook(slug) {
  if (!wayCache.has(slug)) {
    const base = process.env.THE_WAY_BASE_URL || "https://thewayversion.com";
    wayCache.set(slug, fetchJson(`${base.replace(/\/$/, "")}/app/data/books/${slug}.json`));
  }
  try { return await wayCache.get(slug); } catch (error) { wayCache.delete(slug); throw error; }
}

async function resolveWay(reference) {
  const parsed = parseReference(reference);
  if (!parsed) return null;
  const book = await getWayBook(bookSlug(parsed.book));
  const chapter = book?.chapters?.find((item) => Number(item.number) === parsed.chapter);
  const verses = chapter?.verses?.filter((item) => Number(item.number) >= parsed.start && Number(item.number) <= parsed.end) || [];
  if (!verses.length) return null;
  return { reference: `${parsed.book} ${parsed.chapter}:${parsed.start}${parsed.end === parsed.start ? "" : `-${parsed.end}`}`, text: verses.map((verse) => verse.text).join(" ") };
}

export async function resolveVerse(reference, translation) {
  try { return translation === "twb" ? await resolveWay(reference) : await resolveKjv(reference); } catch { return null; }
}

export async function enrichVerses(verses, translation) {
  const safeVerses = Array.isArray(verses) ? verses.slice(0, 4) : [];
  return (await Promise.all(safeVerses.map(async (verse) => {
    const reference = String(verse?.reference || "").trim().slice(0, 120);
    if (!reference) return null;
    const resolved = await resolveVerse(reference, translation);
    if (!resolved) return null;
    return { reference: resolved.reference, text: resolved.text, fragment: String(verse?.fragment || "").trim().slice(0, 500), note: String(verse?.note || "").trim().slice(0, 240) };
  }))).filter(Boolean);
}
