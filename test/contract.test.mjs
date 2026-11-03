import test from "node:test";
import assert from "node:assert/strict";
import { verifyVerseMaterial } from "../src/contract.mjs";

test("removes duplicate and nested fragments but keeps distinct same-verse fragments", () => {
  const result = verifyVerseMaterial([
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "He heals the broken in heart, and binds up their wounds." },
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "and binds up their wounds." },
    { reference: "Psalm 147:3", text: "He heals the broken in heart, and binds up their wounds.", fragment: "He heals the broken in heart" },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].reference, "Psalm 147:3");
});

test("preserves separate fragments when they are not nested", () => {
  const result = verifyVerseMaterial([
    { reference: "Proverbs 2:6", text: "For YHWH gives wisdom. Out of his mouth comes knowledge and understanding.", fragment: "For YHWH gives wisdom." },
    { reference: "Proverbs 2:6", text: "For YHWH gives wisdom. Out of his mouth comes knowledge and understanding.", fragment: "Out of his mouth comes knowledge" },
  ]);
  assert.equal(result.length, 2);
});
