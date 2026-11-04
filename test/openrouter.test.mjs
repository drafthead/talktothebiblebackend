import test from 'node:test';
import assert from 'node:assert/strict';
import { requestOpenRouter } from '../src/openrouter.mjs';
import { parseExplicitVerseRequest, referencesForVerseRequest } from '../src/verse-request.mjs';

test('expands explicit ranges and chapters without silently truncating at two verses', () => {
  const range = parseExplicitVerseRequest('Psalms 1:5 to 10');
  assert.deepEqual(referencesForVerseRequest(range), ['Psalms 1:5', 'Psalms 1:6', 'Psalms 1:7', 'Psalms 1:8', 'Psalms 1:9', 'Psalms 1:10']);
  const chapter = parseExplicitVerseRequest('Give me John chapter 3');
  assert.equal(referencesForVerseRequest(chapter).length, 20);
  const prefixed = parseExplicitVerseRequest('Give me Psalms 119:105-110');
  assert.deepEqual(prefixed, { book: 'Psalms', chapter: 119, start: 105, end: 110, kind: 'range' });
});

test('tries the fallback model after a provider failure', async () => {
  const models = [];
  const result = await requestOpenRouter({
    apiKey: 'test', primaryModel: 'primary/model', fallbackModel: 'fallback/model', payload: { messages: [] },
    referer: 'https://example.com', title: 'test',
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      models.push(body.model);
      if (models.length === 1) return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ choices: [] }) };
    },
  });
  assert.deepEqual(models, ['primary/model', 'fallback/model']);
  assert.equal(result.model, 'fallback/model');
});
