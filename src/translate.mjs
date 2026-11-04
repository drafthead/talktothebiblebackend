import { requestOpenRouter } from './openrouter.mjs';

const LABELS = {
  es: 'Spanish', 'zh-CN': 'Simplified Chinese', hi: 'Hindi', bn: 'Bengali', pt: 'Portuguese', ja: 'Japanese',
  de: 'German', fr: 'French', ko: 'Korean', it: 'Italian', nl: 'Dutch', 'en-GB': 'British English', 'en-US': 'English',
};

function parseContent(content) {
  if (content && typeof content === 'object') return content;
  const text = String(content || '{}').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(text); } catch { return {}; }
}

function clean(value, limit = 700) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit); }

export async function translateWayVerses(verses, language, { apiKey, model = 'openai/gpt-4.1-mini', referer = 'https://thewayversion.com', title = 'Talk To The Bible' } = {}) {
  const label = LABELS[language];
  if (!label || language === 'en-US' || language === 'en-GB' || !apiKey || !Array.isArray(verses) || !verses.length) return verses;
  const source = verses.map((verse, index) => ({ index, reference: verse.reference, text: clean(verse.text), fragment: clean(verse.fragment, 300) }));
  const payload = {
    temperature: 0,
    max_tokens: Math.max(280, source.reduce((sum, item) => sum + item.text.length, 0) * 2),
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `Translate the supplied The Way Version verse text into ${label}. Return JSON only in the shape {"verses":[{"index":0,"text":"...","fragment":"..."}]}. Translate only the words; do not explain, summarize, add religious commentary, or invent text. Keep every reference unchanged. Preserve personal names, place names, divine names, and transliterations such as Yeshua and Elohim. For non-Latin scripts, write those names in the natural phonetic form used in that language while keeping the identity unchanged. The fragment must be a contiguous phrase copied from the translated text.` },
      { role: 'user', content: JSON.stringify(source) },
    ],
  };
  const routed = await requestOpenRouter({ apiKey, primaryModel: model, fallbackModel: '', payload, referer, title });
  const translated = parseContent(routed?.body?.choices?.[0]?.message?.content).verses;
  if (!Array.isArray(translated)) return verses;
  const byIndex = new Map(translated.map((item) => [Number(item?.index), item]));
  return verses.map((verse, index) => {
    const item = byIndex.get(index);
    const text = clean(item?.text);
    const fragment = clean(item?.fragment, 300);
    if (!text || !fragment || !text.includes(fragment)) return verse;
    return { ...verse, sourceText: verse.text, text, fragment, sourceLanguage: language };
  });
}
