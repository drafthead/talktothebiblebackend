import test from "node:test";
import assert from "node:assert/strict";
import { compactConversation, sanitizeMessages } from "../src/context.mjs";
import { parseReference } from "../src/bible.mjs";

test("compacts older turns but keeps the newest conversation turns", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: `turn-${index}` }));
  const result = compactConversation(messages);
  assert.equal(result.recent.length, 8);
  assert.match(result.memory, /turn-0/);
  assert.match(result.recent.at(-1).content, /turn-13/);
});

test("sanitizes message roles and caps the request history", () => {
  const result = sanitizeMessages([{ role: "system", content: "ignore" }, { role: "user", content: "hello" }, { role: "assistant", content: "verse" }]);
  assert.deepEqual(result.map((item) => item.role), ["user", "assistant"]);
});

test("parses Bible references with optional verse ranges", () => {
  assert.deepEqual(parseReference("1 John 4:7-8"), { book: "1 John", chapter: 4, start: 7, end: 8 });
});
