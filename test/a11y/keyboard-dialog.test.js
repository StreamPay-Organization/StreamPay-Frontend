import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

test('ModalDialog component exports semantic modal dialog accessibility attributes', () => {
  const source = read('src/components/ModalDialog.jsx');
  assert.match(source, /role=\{role\}/, 'ModalDialog must set dynamic ARIA role (dialog/alertdialog)');
  assert.match(source, /aria-modal="true"/, 'ModalDialog must specify aria-modal="true"');
  assert.match(source, /aria-labelledby=\{titleId\}/, 'ModalDialog must connect aria-labelledby to title element ID');
  assert.match(source, /aria-describedby=\{description \? descriptionId : undefined\}/, 'ModalDialog must connect aria-describedby to description ID');
});

test('ModalDialog implements keyboard Escape key dismiss and focus trap', () => {
  const source = read('src/components/ModalDialog.jsx');
  assert.match(source, /e\.key === 'Escape'/, 'ModalDialog must handle Escape key to close dialog');
  assert.match(source, /e\.key === 'Tab'/, 'ModalDialog must intercept Tab key for focus trapping');
  assert.match(source, /getFocusableElements/, 'ModalDialog must discover focusable elements for containment');
});

test('ModalDialog implements focus restoration to trigger element on close', () => {
  const source = read('src/components/ModalDialog.jsx');
  assert.match(source, /previousFocusRef\.current/, 'ModalDialog must track previous active element');
  assert.match(source, /triggerRef\?\.current/, 'ModalDialog must support explicit triggerRef focus restoration');
  assert.match(source, /focus\(\)/, 'ModalDialog must restore focus on dismissal');
});

test('StreamDetail integrates confirmation dialogs for withdraw and cancel flows', () => {
  const source = read('src/pages/StreamDetail.jsx');
  assert.match(source, /ModalDialog/, 'StreamDetail must import and render ModalDialog');
  assert.match(source, /confirmingAction === 'withdraw'/, 'StreamDetail must manage withdraw confirmation modal state');
  assert.match(source, /confirmingAction === 'cancel'/, 'StreamDetail must manage cancel confirmation modal state');
  assert.match(source, /withdrawBtnRef/, 'StreamDetail must pass withdraw trigger ref for focus restoration');
  assert.match(source, /cancelBtnRef/, 'StreamDetail must pass cancel trigger ref for focus restoration');
});

test('StreamDetail confirmation dialogs contain field/error association and outcome announcements', () => {
  const source = read('src/pages/StreamDetail.jsx');
  assert.match(source, /aria-invalid=\{!!withdrawFieldError\}/, 'Withdraw form field must set aria-invalid on error');
  assert.match(source, /aria-errormessage/, 'Withdraw form field must set aria-errormessage on error');
  assert.match(source, /role="status"/, 'StreamDetail must declare status live region for outcome announcements');
  assert.match(source, /aria-live="polite"/, 'StreamDetail outcome announcements must use polite live region');
});
