import test from 'node:test';
import assert from 'node:assert/strict';
import { recentReferences } from '../src/reference-history.mjs';

test('extracts references from rendered cards across the last ten messages', () => {
  const messages = Array.from({ length: 11 }, (_, index) => ({ role: 'assistant', content: `Psalm ${index + 1}:1: A verse` }));
  const references = recentReferences(messages);
  assert.equal(references.has('psalms 1:1'), false);
  assert.equal(references.has('psalms 2:1'), true);
  assert.equal(references.has('psalms 11:1'), true);
});

test('extracts structured and JSON assistant responses', () => {
  const references = recentReferences([
    { role: 'assistant', verses: [{ reference: 'John 3:16' }] },
    { role: 'assistant', content: JSON.stringify({ verses: [{ reference: 'Romans 8:28' }] }) },
  ]);
  assert.deepEqual([...references].sort(), ['john 3:16', 'romans 8:28']);
});
