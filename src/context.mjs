export function compactConversation(messages) {
  const recentStart = messages.length % 2 === 1 ? Math.max(0, messages.length - 9) : Math.max(0, messages.length - 8);
  const recent = messages.slice(recentStart);
  const older = messages.slice(0, recentStart);
  const memory = buildUserMemory(older);
  return { memory, recent };
}

const categoryRules = [
  ["Situations", /\b(today|yesterday|work|job|school|move|moving|home|money|health|sick|ill|sleep|trip|decision|change|plan|project|parent|child|kid|family)\b/i],
  ["Relationships", /\b(partner|spouse|husband|wife|married|marriage|friend|friendship|dating|date|relationship|mom|mother|dad|father|brother|sister|coworker|boss|team)\b/i],
  ["Concerns", /\b(worried|worry|afraid|fear|anxious|anxiety|stressed|stress|sad|lonely|angry|hurt|grief|loss|confused|overwhelmed|struggle|struggling|concern|problem)\b/i],
  ["Preferences", /\b(i like|i love|i prefer|i want|i need|my favorite|call me|remember|always|never|tradition|translation)\b/i]
];

function sentenceParts(text) {
  return String(text || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

function addUnique(list, value, limit = 7) {
  const clean = value.replace(/^(user|bible response):\s*/i, "").trim();
  if (!clean || list.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
  list.push(clean.slice(0, 300));
  if (list.length > limit) list.shift();
}

export function buildUserMemory(messages) {
  const buckets = new Map(categoryRules.map(([label]) => [label, []]));
  const general = [];
  for (const message of messages) {
    if (message.role !== "user") continue;
    for (const sentence of sentenceParts(message.content)) {
      let matched = false;
      for (const [label, rule] of categoryRules) {
        if (rule.test(sentence)) { addUnique(buckets.get(label), sentence); matched = true; }
      }
      if (!matched) addUnique(general, sentence, 6);
    }
  }
  const sections = [];
  for (const [label, values] of buckets) if (values.length) sections.push(`${label}: ${values.join(" | ")}`);
  if (general.length) sections.push(`General life context: ${general.join(" | ")}`);
  return sections.join("\n").slice(0, 3200);
}

export function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string" && message.content.trim())
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 2400) }))
    .slice(-60);
}
