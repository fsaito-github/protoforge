import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeFigmaToDesignSpec } from '../src/figma/normalizer.ts';

test('normalizeFigmaToDesignSpec returns baseline shape', () => {
  const out = normalizeFigmaToDesignSpec({ any: 'payload' });
  assert.equal(typeof out.projectName, 'string');
  assert.ok(Array.isArray(out.pages));
  assert.equal(out.pages.length, 1);
});
