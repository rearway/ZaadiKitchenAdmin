// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/customer-list-ui.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
    key: () => null,
    length: 0,
  },
});

describe('customer list plan rows', () => {
  it('shows days left and meals left and does not offer a Churned filter', async () => {
    const { default: CustomerManagement } = await import('../src/pages/CustomerManagement.tsx');
    const { queryKeys } = await import('../src/shared/lib/api/queryKeys.ts');
    const { CustomerSchema } = await import('../src/features/customers/model/customers.schema.ts');

    const customer = CustomerSchema.parse({
      id: 'user-1',
      fullName: 'Sara Al-Mutairi',
      phone: '+966500000111',
      subscriptionStatus: 'active',
      planName: 'Month',
      totalMealDays: 22,
      deliveredCount: 4,
      skippedCount: 1,
      mealsLeft: 17,
      walletBalanceSar: 1000,
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(
      queryKeys.customers.list({
        search: undefined,
        status: undefined,
        filter: undefined,
        plan: undefined,
        page: 1,
      }),
      { customers: [customer], total: 1, page: 1, pageSize: 20, totalPages: 1 }
    );

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(MemoryRouter, null, createElement(CustomerManagement))
      )
    );

    assert.match(html, /Sara Al-Mutairi/);
    assert.match(html, /17 days left/);
    assert.match(html, /17 meals left/);
    assert.match(html, />Active</);
    assert.match(html, />Paused</);
    assert.match(html, />Expired</);
    assert.doesNotMatch(html, /Churned/);
  });
});
