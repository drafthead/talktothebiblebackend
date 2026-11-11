import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSafetyConcern, SAFETY_NOTE } from '../src/safety.mjs';
import { contestedTopic } from '../src/topic-guidance.mjs';
import { enrichVerses } from '../src/bible.mjs';

test('detects direct self-harm language for the safety response', () => {
  assert.equal(detectSafetyConcern("I don't want to live anymore. Nothing matters."), true);
  assert.equal(detectSafetyConcern('I feel anxious about tomorrow.'), false);
  assert.match(SAFETY_NOTE, /988/);
});

test('recognizes contested divorce questions and supplies balanced passages', () => {
  const topic = contestedTopic('Does the Bible allow divorce and remarriage?');
  assert.equal(topic?.id, 'divorce-remarriage');
  assert.deepEqual(topic?.references, ['Matthew 19:3-12', 'Mark 10:11-12', 'Luke 16:18', '1 Corinthians 7:10-11']);
  assert.match(topic?.prompt || '', /contested interpretation/i);
});

test('preserves a model-selected text excerpt when it arrives in the text field', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    reference: 'Hebrews 13:5',
    text: 'Be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.'
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const verses = await enrichVerses([{ reference: 'Hebrews 13:5', text: 'I will never leave thee, nor forsake thee' }], 'kjv', 'en-US');
    assert.equal(verses[0].fragment, 'I will never leave thee, nor forsake thee');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
