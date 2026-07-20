import assert from 'node:assert';
import { test } from 'node:test';
import { hashCode, mulberry32 } from '../../src/utils/identicon.js';

test('hashCode generates stable, deterministic hash', () => {
  const hash1 = hashCode('GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XQ');
  const hash2 = hashCode('GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XQ');
  const hash3 = hashCode('GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XY');

  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(hash1, hash3);
  assert.strictEqual(typeof hash1, 'number');
  assert.ok(hash1 >= 0);
});

test('mulberry32 generates deterministic random stream', () => {
  const seed = hashCode('GCQYWQ3LSTREAMPAYDEMOACCOUNT00000000000000000000000000XQ');
  const prng1 = mulberry32(seed);
  const prng2 = mulberry32(seed);

  const val1_1 = prng1();
  const val1_2 = prng1();

  const val2_1 = prng2();
  const val2_2 = prng2();

  assert.strictEqual(val1_1, val2_1);
  assert.strictEqual(val1_2, val2_2);
  assert.notStrictEqual(val1_1, val1_2);
  assert.ok(val1_1 >= 0 && val1_1 < 1);
  assert.ok(val1_2 >= 0 && val1_2 < 1);
});
