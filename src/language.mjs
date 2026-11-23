const LANGUAGE_LABELS = {
  'en-US': 'English', 'en-GB': 'British English', es: 'Spanish', 'zh-CN': 'Simplified Chinese',
  hi: 'Hindi', bn: 'Bengali', pt: 'Portuguese', ja: 'Japanese', de: 'German', fr: 'French',
  ko: 'Korean', it: 'Italian', nl: 'Dutch',
};

const WORDS = {
  es: ['hola', 'gracias', 'el', 'la', 'los', 'las', 'que', 'de', 'y', 'por', 'para', 'cómo', 'qué', 'puedo', 'ese', 'hoy', 'dios', 'vida'],
  pt: ['o', 'a', 'os', 'as', 'que', 'de', 'e', 'por', 'para', 'como', 'posso', 'esse', 'hoje', 'obrigado', 'não', 'vida', 'deus'],
  fr: ['le', 'la', 'les', 'des', 'que', 'de', 'et', 'pour', 'dans', 'comment', 'dieu', 'vie'],
  de: ['der', 'die', 'das', 'den', 'und', 'ist', 'nicht', 'für', 'wie', 'gott', 'leben'],
  it: ['il', 'la', 'gli', 'le', 'che', 'di', 'e', 'per', 'come', 'dio', 'vita'],
  nl: ['de', 'het', 'een', 'en', 'van', 'voor', 'niet', 'hoe', 'god', 'leven'],
  en: ['hello', 'thanks', 'the', 'and', 'that', 'is', 'are', 'what', 'how', 'for', 'god', 'life'],
};

// The full vocabularies above are useful as supporting evidence, but several
// short words overlap across languages. A single word such as "come", "la",
// or "de" must never override the language the user selected in Settings.
// These terms are deliberately more distinctive and are used as the minimum
// confidence signal for Latin-script language switching.
const DISTINCTIVE_WORDS = {
  es: ['hola', 'gracias', 'como', 'que', 'puedo', 'hoy', 'dios', 'vida', 'quiero', 'necesito', 'estas', 'estoy'],
  pt: ['ola', 'obrigado', 'obrigada', 'nao', 'posso', 'hoje', 'deus', 'vida', 'voce', 'quero', 'preciso', 'estou'],
  fr: ['bonjour', 'merci', 'comment', 'pourquoi', 'dieu', 'vie', 'vous', 'avec', 'suis', 'besoin'],
  de: ['hallo', 'danke', 'nicht', 'fur', 'wie', 'gott', 'leben', 'ich', 'mit', 'brauche'],
  it: ['ciao', 'grazie', 'non', 'sono', 'voglio', 'posso', 'perche', 'questa', 'questo', 'stai', 'bisogno'],
  nl: ['hallo', 'dank', 'niet', 'hoe', 'god', 'leven', 'jij', 'met', 'nodig'],
  en: ['hello', 'hi', 'thanks', 'please', 'what', 'how', 'why', 'where', 'the', 'and', 'is', 'are', 'you', 'your', 'with'],
};

// A language selected in Settings is the default. Latin-script detection must
// earn the right to override it: common words such as "a", "de", or "la"
// are shared by many languages and should never flip an English conversation
// into Portuguese, Spanish, or another language.
const SINGLE_WORD_LANGUAGE_MARKERS = {
  es: ['hola', 'gracias', 'necesito', 'quiero', 'estoy'],
  pt: ['ola', 'obrigado', 'obrigada', 'preciso', 'estou', 'voce'],
  fr: ['bonjour', 'merci', 'pourquoi'],
  de: ['hallo', 'danke', 'brauche'],
  it: ['ciao', 'grazie', 'voglio'],
  nl: ['dank', 'nodig'],
  en: ['hello', 'thanks', 'please', 'need', 'help'],
};

export const languageLabel = (language) => LANGUAGE_LABELS[language] || LANGUAGE_LABELS['en-US'];

function normalizeToken(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function detectLanguage(text, fallback = 'en-US') {
  const value = String(text || '').trim();
  if (!value) return fallback;
  if (/[가-힯]/u.test(value)) return 'ko';
  if (/[぀-ヿ]/u.test(value)) return 'ja';
  if (/[一-鿿]/u.test(value)) return 'zh-CN';
  if (/[ऀ-ॿ]/u.test(value)) return 'hi';
  if (/[ঀ-৿]/u.test(value)) return 'bn';
  const words = normalizeToken(value).match(/[a-z]+/g) || [];
  const distinctiveScores = Object.fromEntries(Object.keys(DISTINCTIVE_WORDS).map((key) => [key, 0]));
  for (const word of words) for (const [language, vocabulary] of Object.entries(DISTINCTIVE_WORDS)) if (vocabulary.includes(word)) distinctiveScores[language] += 1;
  const distinctiveRanked = Object.entries(distinctiveScores).sort((a, b) => b[1] - a[1]);
  const [distinctiveWinner, distinctiveScore] = distinctiveRanked[0];
  const distinctiveRunnerUp = distinctiveRanked[1]?.[1] || 0;
  const hasSingleWordMarker = words.some((word) => SINGLE_WORD_LANGUAGE_MARKERS[distinctiveWinner]?.includes(word));
  if (distinctiveScore > distinctiveRunnerUp && (distinctiveScore >= 2 || hasSingleWordMarker)) return distinctiveWinner === 'en' ? 'en-US' : distinctiveWinner;
  const scores = Object.fromEntries(Object.keys(WORDS).map((key) => [key, 0]));
  for (const word of words) for (const [language, vocabulary] of Object.entries(WORDS)) if (vocabulary.some((entry) => normalizeToken(entry) === word)) scores[language] += 1;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, score] = ranked[0];
  const runnerUp = ranked[1]?.[1] || 0;
  if (score < 3 || score <= runnerUp + 1) return fallback;
  return winner === 'en' ? 'en-US' : winner;
}
