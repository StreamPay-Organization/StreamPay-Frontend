import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

test('Dashboard StreamSection exposes aria-live for async stream updates', () => {
  const source = read('src/pages/Dashboard.jsx');
  assert.match(source, /aria-live="polite"/, 'Dashboard should expose a polite live region for stream updates');
});

test('CreateStream exposes assertive aria-live for submit errors', () => {
  const source = read('src/pages/CreateStream.jsx');
  assert.match(source, /aria-live="assertive"/, 'CreateStream should expose an assertive live region for submit errors');
});

test('StreamDetail exposes assertive aria-live for async action errors', () => {
  const source = read('src/pages/StreamDetail.jsx');
  assert.match(source, /aria-live="assertive"/, 'StreamDetail should expose an assertive live region for action errors');
});

test('Loader exposes polite status live region', () => {
  const source = read('src/components/Loader.jsx');
  assert.match(source, /role="status"/, 'Loader should expose role=status');
  assert.match(source, /aria-live="polite"/, 'Loader should expose a polite live region');
});

test('ErrorMessage exposes assertive alert live region', () => {
  const source = read('src/components/ErrorMessage.jsx');
  assert.match(source, /role="alert"/, 'ErrorMessage should expose role=alert');
});
