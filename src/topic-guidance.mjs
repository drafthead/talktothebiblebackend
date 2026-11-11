const CONTESTED_TOPICS = [
  {
    id: "divorce-remarriage",
    pattern: /\b(?:divorc(?:e|ed|ing)|remarri(?:age|ed)|marriage\s+after\s+divorce)\b/i,
    references: ["Matthew 19:3-12", "Mark 10:11-12", "Luke 16:18", "1 Corinthians 7:10-11"],
    prompt: "This is a contested interpretation. Do not summarize one doctrine as if it were an undisputed biblical fact. Prefer the full relevant context and show the passages that create the tension, including Matthew 19:3-12, Mark 10:11-12, Luke 16:18, and 1 Corinthians 7:10-11 when relevant. Return a neutral status and do not claim that Jesus or Paul simply permits or forbids every case.",
    statusNote: "These passages are read differently across Christian traditions. Read the cited passages in context rather than treating one summary as the only interpretation.",
  },
];

export function contestedTopic(value) {
  const text = String(value || "");
  return CONTESTED_TOPICS.find((topic) => topic.pattern.test(text)) || null;
}
