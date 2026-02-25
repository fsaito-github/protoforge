import test from 'node:test';
import assert from 'node:assert/strict';

import { parseFigmaUrl } from '../src/shared/figma-url.ts';

test('parseFigmaUrl extracts fileKey and node-id', () => {
  const src = parseFigmaUrl('https://www.figma.com/file/AbCdEf123/My-Design?node-id=10%3A20');
  assert.equal(src.fileKey, 'AbCdEf123');
  assert.equal(src.nodeId, '10:20');
});
