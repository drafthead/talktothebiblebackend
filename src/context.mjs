export function compactConversation(messages) {
  const recentStart = messages.length % 2 === 1 ? Math.max(0, messages.length - 9) : Math.max(0, messages.length - 8);
  const recent = messages.slice(recentStart);
  const older = messages.slice(0, recentStart);
  const memoryText = older.map((message) => `${message.role === "user" ? "User" : "Bible response"}: ${message.content}`).join("\n");
  const memory = memoryText.length > 3600 ? `${memoryText.slice(0, 2300)}\n[earlier context compacted]\n${memoryText.slice(-1200)}` : memoryText;
  return { memory, recent };
}

export function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message.content === "string" && message.content.trim())
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 2400) }))
    .slice(-40);
}
