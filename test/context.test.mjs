import test from "node:test";
import assert from "node:assert/strict";
import { buildUserMemory, compactConversation, sanitizeMessages } from "../src/context.mjs";
import { parseReference } from "../src/bible.mjs";
import { normalizeModelResponse, verifyVerseMaterial } from "../src/contract.mjs";

test("compacts older turns but keeps the newest conversation turns", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: `turn-${index}` }));
  const result = compactConversation(messages);
  assert.equal(result.recent.length, 6);
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

test("builds bounded personal context categories without another model call", () => {
  const memory = buildUserMemory([
    { role: "user", content: "I am worried about work and my partner." },
    { role: "assistant", content: "A verse" },
    { role: "user", content: "I prefer traditional language." }
  ]);
  assert.match(memory, /Situations:/);
  assert.match(memory, /Relationships:/);
  assert.match(memory, /Concerns:/);
  assert.match(memory, /Preferences:/);
});

test("keeps duplicate references so tiles and citation bubbles remain one-to-one", () => {
  const result = verifyVerseMaterial([
    { reference: "Genesis 3:20", text: "And Adam called his wife's name Eve; because she was the mother of all living.", fragment: "Eve" },
    { reference: "Genesis 3:20", text: "And Adam called his wife's name Eve; because she was the mother of all living.", fragment: "was" },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].reference, result[1].reference);
  assert.deepEqual(result.map((item) => item.fragment), ["Eve", "was"]);
});

test("rejects a fragment that is not present in the resolved verse", () => {
  const result = verifyVerseMaterial([{ reference: "Genesis 3:20", text: "And Adam called his wife's name Eve.", fragment: "Sarah" }], { allowWholeVerseFallback: false });
  assert.deepEqual(result, []);
});

test("normalizes the spec response shape and fact status", () => {
  const result = normalizeModelResponse({ mode: "BIBLE_FACT", segments: [{ reference: "Luke 3:23", fragment: "about thirty" }], status: "Biblical status: Not specified in Scripture", statusNote: "The exact age is not stated." });
  assert.equal(result.mode, "fact");
  assert.equal(result.verses[0].fragment, "about thirty");
  assert.equal(result.status, "Biblical status: Not specified in Scripture");
});
