import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const tokenFile = new URL('../src/styles/tokens.css', import.meta.url);
const indexFile = new URL('../src/index.css', import.meta.url);

test('shared design tokens define the application visual contract', async () => {
  const css = await readFile(tokenFile, 'utf8');

  assert.match(css, /:root\s*\{/);

  const expectedTokens = {
    '--color-bg': '#0b1020',
    '--color-primary': '#5b8cff',
    '--color-success': '#36d399',
    '--color-danger': '#ff6b6b',
    '--radius': '12px',
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.35)',
    '--max-width': '1100px',
    '--font-family-sans': 'system-ui',
  };

  for (const [name, value] of Object.entries(expectedTokens)) {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(css, new RegExp(`${name}:\\s*${escapedValue}`));
  }
});

test('global stylesheet imports the shared design tokens', async () => {
  const css = await readFile(indexFile, 'utf8');

  assert.match(css, /@import '\.\/styles\/tokens\.css';/);
  assert.doesNotMatch(css, /:root\s*\{/);
});
