const LANGUAGE_LABELS = {
  'en-US': 'English', 'en-GB': 'British English', es: 'Spanish', 'zh-CN': 'Simplified Chinese',
  hi: 'Hindi', bn: 'Bengali', pt: 'Portuguese', ja: 'Japanese', de: 'German', fr: 'French',
  ko: 'Korean', it: 'Italian', nl: 'Dutch',
};

const WORDS = {
  es: ['hola', 'gracias', 'el', 'la', 'los', 'las', 'que', 'de', 'y', 'por', 'para', 'cómo', 'qué', 'dios', 'vida'],
  pt: ['o', 'a', 'os', 'as', 'que', 'de', 'e', 'por', 'para', 'como', 'não', 'vida', 'deus'],
  fr: ['le', 'la', 'les', 'des', 'que', 'de', 'et', 'pour', 'dans', 'comment', 'dieu', 'vie'],
  de: ['der', 'die', 'das', 'den', 'und', 'ist', 'nicht', 'für', 'wie', 'gott', 'leben'],
  it: ['il', 'la', 'gli', 'le', 'che', 'di', 'e', 'per', 'come', 'dio', 'vita'],
  nl: ['de', 'het', 'een', 'en', 'van', 'voor', 'niet', 'hoe', 'god', 'leven'],
  en: ['hello', 'thanks', 'the', 'and', 'that', 'is', 'are', 'what', 'how', 'for', 'god', 'life'],
};

export const languageLabel = (language) => LANGUAGE_LABELS[language] || LANGUAGE_LABELS['en-US'];

export function detectLanguage(text, fallback = 'en-US') {
  const value = String(text || '').trim();
  if (!value) return fallback;
  if (/[가-힯]/u.test(value)) return 'ko';
  if (/[぀-ヿ]/u.test(value)) return 'ja';
  if (/[一-鿿]/u.test(value)) return 'zh-CN';
  if (/[ऀ-ॿ]/u.test(value)) return 'hi';
  if (/[ঀ-৿]/u.test(value)) return 'bn';
  const words = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]+/g) || [];
  const scores = Object.fromEntries(Object.keys(WORDS).map((key) => [key, 0]));
  for (const word of words) for (const [language, vocabulary] of Object.entries(WORDS)) if (vocabulary.includes(word)) scores[language] += 1;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, score] = ranked[0];
  const runnerUp = ranked[1]?.[1] || 0;
  if (score < 1 || score === runnerUp) return fallback;
  return winner === 'en' ? 'en-US' : winner;
}
