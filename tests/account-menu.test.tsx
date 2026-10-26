import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('BUG-012 account menu', () => {
  it('opens from the header avatar and does not sign out on that click', async () => {
    if (!globalThis.localStorage) {
      const memory = new Map<string, string>();
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: (key: string) => memory.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memory.set(key, value);
          },
          removeItem: (key: string) => {
            memory.delete(key);
          },
          clear: () => memory.clear(),
          key: () => null,
          length: 0,
        },
      });
    }

    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MemoryRouter } = await import('react-router-dom');
    const { default: TopNav } = await import('../src/components/TopNav.tsx');

    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(TopNav, {
          user: { id: 'admin-1', name: 'Ada Admin', email: 'ada@platio.sa', role: 'admin' },
        })
      )
    );

    assert.match(html, /aria-label="Account"/);
    assert.match(html, /aria-expanded="false"/);
    assert.doesNotMatch(html, /title="Sign out"/);
    assert.doesNotMatch(html, />Sign out</);
    assert.match(html, />A</);
  });
});
