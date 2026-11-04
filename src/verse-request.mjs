const BOOK_ALIASES = new Map(Object.entries({
  psalm: 'Psalms', psalms: 'Psalms', salmo: 'Psalms', salmos: 'Psalms',
  genesis: 'Genesis', génesis: 'Genesis',
  exodus: 'Exodus', éxodo: 'Exodus', exodo: 'Exodus',
  leviticus: 'Leviticus', levítico: 'Leviticus', levitico: 'Leviticus',
  numbers: 'Numbers', números: 'Numbers', numeros: 'Numbers',
  deuteronomy: 'Deuteronomy', deuteronomio: 'Deuteronomy',
  joshua: 'Joshua', josué: 'Joshua', josue: 'Joshua',
  judges: 'Judges', jueces: 'Judges', ruth: 'Ruth', rut: 'Ruth',
  '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
  '1 kings': '1 Kings', '2 kings': '2 Kings', '1 reyes': '1 Kings', '2 reyes': '2 Kings',
  '1 chronicles': '1 Chronicles', '2 chronicles': '2 Chronicles', '1 crónicas': '1 Chronicles', '2 crónicas': '2 Chronicles',
  ezra: 'Ezra', esdras: 'Ezra', nehemiah: 'Nehemiah', nehemías: 'Nehemiah', nehemias: 'Nehemiah',
  esther: 'Esther', ester: 'Esther', job: 'Job', proverbs: 'Proverbs', proverbios: 'Proverbs',
  ecclesiastes: 'Ecclesiastes', eclesiastés: 'Ecclesiastes', eclesiastes: 'Ecclesiastes',
  'song of songs': 'Song of Solomon', 'song of solomon': 'Song of Solomon', cantares: 'Song of Solomon',
  isaiah: 'Isaiah', isaías: 'Isaiah', isaias: 'Isaiah', jeremiah: 'Jeremiah', jeremías: 'Jeremiah', jeremias: 'Jeremiah',
  lamentations: 'Lamentations', lamentaciones: 'Lamentations', ezekiel: 'Ezekiel', ezequiel: 'Ezekiel', daniel: 'Daniel',
  hosea: 'Hosea', oseas: 'Hosea', joel: 'Joel', amos: 'Amos', obadiah: 'Obadiah', abdías: 'Obadiah', abdias: 'Obadiah',
  jonah: 'Jonah', jonás: 'Jonah', jonas: 'Jonah', micah: 'Micah', miqueas: 'Micah', nahum: 'Nahum', habakkuk: 'Habakkuk', habacuc: 'Habakkuk',
  zephaniah: 'Zephaniah', sofonías: 'Zephaniah', sofonias: 'Zephaniah', haggai: 'Haggai', hageo: 'Haggai', zechariah: 'Zechariah', zacarías: 'Zechariah', zacarias: 'Zechariah', malachi: 'Malachi', malaquías: 'Malachi', malaquias: 'Malachi',
  matthew: 'Matthew', mateo: 'Matthew', mark: 'Mark', marcos: 'Mark', luke: 'Luke', lucas: 'Luke', john: 'John', juan: 'John',
  acts: 'Acts', hechos: 'Acts', romans: 'Romans', romanos: 'Romans', '1 corinthians': '1 Corinthians', '2 corinthians': '2 Corinthians', '1 corintios': '1 Corinthians', '2 corintios': '2 Corinthians',
  galatians: 'Galatians', gálatas: 'Galatians', galatas: 'Galatians', ephesians: 'Ephesians', efesios: 'Ephesians', philippians: 'Philippians', filipenses: 'Philippians', colossians: 'Colossians', colosenses: 'Colossians',
  '1 thessalonians': '1 Thessalonians', '2 thessalonians': '2 Thessalonians', '1 tesalonicenses': '1 Thessalonians', '2 tesalonicenses': '2 Thessalonians',
  '1 timothy': '1 Timothy', '2 timothy': '2 Timothy', '1 timoteo': '1 Timothy', '2 timoteo': '2 Timothy', titus: 'Titus', tito: 'Titus', philemon: 'Philemon', filemón: 'Philemon', filemon: 'Philemon', hebrews: 'Hebrews', hebreos: 'Hebrews', james: 'James', santiago: 'James',
  '1 peter': '1 Peter', '2 peter': '2 Peter', '1 pedro': '1 Peter', '2 pedro': '2 Peter', jude: 'Jude', judas: 'Jude', revelation: 'Revelation', apocalipsis: 'Revelation'
}));

function canonicalBook(value) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim().replace(/[.,!?;:]+$/, '');
  const lower = normalized.toLocaleLowerCase('es');
  if (BOOK_ALIASES.has(lower)) return BOOK_ALIASES.get(lower);
  const numbered = lower.match(/^([1-3])\s+(.+)$/);
  if (numbered && BOOK_ALIASES.has(`${numbered[1]} ${numbered[2]}`)) return BOOK_ALIASES.get(`${numbered[1]} ${numbered[2]}`);
  return normalized;
}

function cleanBook(value) { return canonicalBook(String(value || '').replace(/^(?:please\s+)?(?:give\s+me|show\s+me|read|open|fetch|get|send\s+me|dame)\s+/i, '')); }

function stripRequestLead(value) {
  return String(value || '').replace(/^\s*(?:please\s+)?(?:give\s+me|show\s+me|read|open|fetch|get|send\s+me|dame|muéstrame|muestrame)\s+/i, '').trim();
}

// Explicit verse requests are deterministic: the model should not choose only
// a couple of examples when the user asked for a passage or chapter range.
export function parseExplicitVerseRequest(question) {
  const text = stripRequestLead(question);
  const range = text.match(/\b((?:[1-3]\s+)?[\p{L}]+(?:\s+[\p{L}]+){0,2})\s+(\d+):(\d+)\s*(?:-|–|—|\bto\b|\bthrough\b|\ba\b|\bhasta\b)\s*(?:(?:[1-3]\s+)?[\p{L}]+\s+)?(?:(\d+):)?(\d+)\b/iu);
  if (range) {
    const book = cleanBook(range[1]);
    const chapter = Number(range[2]);
    const start = Number(range[3]);
    const endChapter = Number(range[4] || chapter);
    const end = Number(range[5]);
    if (endChapter === chapter && end >= start) return { book, chapter, start, end: Math.min(end, start + 19), kind: 'range' };
  }
  const single = text.match(/\b((?:[1-3]\s+)?[\p{L}]+(?:\s+[\p{L}]+){0,2})\s+(\d+):(\d+)\b/iu);
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
