// These are retrieval directions, not canned answers. They give the model a
// semantic starting point so a life question is not reduced to one matching
// word such as "new", "love", or "work".
const LIFE_GUIDANCE = [
  {
    id: 'new-beginning',
    pattern: /\b(?:try(?:ing)?|start(?:ing)?|begin(?:ning)?|new (?:thing|job|project|chapter|venture|path)|change|different path|take a chance|step out|unfamiliar)\b/i,
    prompt: `Intent guide: This is about a new beginning, an unfamiliar step, discernment, or courage. Do not select a praise or worship passage merely because it contains the word "new". In particular, never default to "sing a new song" unless the user is actually asking about worship or praise. Seek a sequence that can name the uncertainty, offer wisdom for a next step, and leave room for courage or hope. For this kind of request, prefer at least one fitting calling narrative, story of faithful action, or teaching about preparation alongside wisdom or courage when the exact text fits. Useful source directions include a call out of familiar ground, counting the cost before building, and guidance for a person's path. Ecclesiastes 1:9 fits only when the person is asking whether anything is truly new, not as a generic answer to change.`,
  },
  {
    id: 'relationship',
    pattern: /\b(?:relationship|partner|spouse|husband|wife|marriage|married|dating|date|break ?up|friend|friendship|coworker|boss|family|parent|child|argument|conflict|forgive|forgiveness)\b/i,
    prompt: `Intent guide: This is a relationship or repair question. Do not pretend to know the other person's motives or tell the user simply to endure, forgive, leave, or reconcile. Look for Scripture that gives a wise next movement such as listening before speaking, truthfulness, patient love, repair, discernment, protection of the heart, or a direct conversation. Let the selected fragments acknowledge the human tension and offer practical wisdom without imposing a conclusion that Scripture does not explicitly make.`,
  },
  {
    id: 'decision',
    pattern: /\b(?:decid(?:e|ing|ion)|choose|choice|should i|which (?:way|path)|direction|wisdom|discern(?:ment|ing)|opportunity|offer|move|moving)\b/i,
    prompt: `Intent guide: This is a decision or discernment question. Choose Scripture that helps someone examine a path, seek wisdom, plan humbly, test motives, and take a faithful next action. Avoid a famous verse that merely says to have faith unless its surrounding thought actually helps with the decision.`,
  },
  {
    id: 'work-and-purpose',
    pattern: /\b(?:job|work|career|business|project|purpose|calling|fired|layoff|laid off|money|rent|interview|school|study)\b/i,
    prompt: `Intent guide: This is about work, provision, purpose, or responsibility. Prefer Scripture that speaks honestly about diligence, planning, skill, provision, rest, integrity, and patient action. Do not turn a practical concern into generic praise language. A useful sequence should leave the person with a wise posture toward the next task.`,
  },
  {
    id: 'grief-and-heavy-emotions',
    pattern: /\b(?:grief|grieve|loss|died|death|mourning|mourn|sad|hurt|lonely|alone|heartbroken|overwhelmed|anxious|anxiety|afraid|fear|scared|stuck|depressed)\b/i,
    prompt: `Intent guide: This is a heavy emotional or loss-related question. Begin with Scripture that names the reality of sorrow, fear, waiting, or weakness before selecting hope. Do not rush to a triumphant slogan. Prefer lament, compassionate presence, honest prayers, and passages that offer a next breath or next step.`,
  },
];

export function lifeGuidance(value) {
  const text = String(value || '');
  const matches = LIFE_GUIDANCE.filter((guide) => guide.pattern.test(text)).slice(0, 2);
  if (!matches.length) return '';
  return matches.map((guide) => guide.prompt).join('\n');
}

