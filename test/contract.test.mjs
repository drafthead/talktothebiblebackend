import test from "node:test";
import assert from "node:assert/strict";
import { canonicalReference, preserveCompleteShortVerses, verifyVerseMaterial } from "../src/contract.mjs";

test("canonicalizes Psalm references before they reach the UI", () => {
  assert.equal(canonicalReference("1 Psalm 147:3"), "Psalms 147:3");
  assert.equal(canonicalReference("Psalm 147:3"), "Psalms 147:3");
  assert.equal(canonicalReference(" Psalms   147:3 "), "Psalms 147:3");
});

test("removes duplicate and nested fragments but keeps distinct same-verse fragments", () => {
  const result = verifyVerseMaterial([
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "He heals the broken in heart, and binds up their wounds." },
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "and binds up their wounds." },
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "He heals the broken in heart" },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].reference, "Psalms 147:3");
});

test("preserves separate fragments when they are not nested", () => {
  const result = verifyVerseMaterial([
    { reference: "Proverbs 2:6", text: "For YHWH gives wisdom. Out of his mouth comes knowledge and understanding.", fragment: "For YHWH gives wisdom." },
    { reference: "Proverbs 2:6", text: "For YHWH gives wisdom. Out of his mouth comes knowledge and understanding.", fragment: "Out of his mouth comes knowledge" },
  ]);
  assert.equal(result.length, 2);
});

test("restores a complete short verse when the model selected only its opening clause", () => {
  const verses = preserveCompleteShortVerses([{
    reference: "Ecclesiastes 12:13",
    text: "This is the end of the matter. All has been heard. Fear God, and keep his commandments; for this is the whole duty of man.",
    fragment: "This is the end of the matter",
  }]);
  assert.equal(verses[0].fragment, verses[0].text);
});
