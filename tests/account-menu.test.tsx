// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/account-menu.test.tsx
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AccountMenu from '../src/components/AccountMenu.tsx';

describe('account menu', () => {
  it('shows the signed-in account and a separate sign-out action', () => {
    const html = renderToStaticMarkup(
      createElement(AccountMenu, {
        name: 'Nora Ali',
        email: 'nora@platio.test',
        roleLabel: 'Admin',
        onSignOut: () => undefined,
      })
    );
    assert.match(html, /Nora Ali/);
    assert.match(html, /nora@platio.test/);
    assert.match(html, /Admin/);
    assert.match(html, /Sign out/);
    assert.match(html, /role="menu"/);
  });

  it('opens the account menu from the header control instead of signing out', () => {
    const source = readFileSync(new URL('../src/components/TopNav.tsx', import.meta.url), 'utf8');
    assert.match(source, /aria-label="Account"/);
    assert.match(source, /setIsAccountOpen\(\(open\) => !open\)/);
    assert.doesNotMatch(source, /title="Sign out"/);
    assert.doesNotMatch(source, /onClick=\{handleLogout\}/);
  });
});
