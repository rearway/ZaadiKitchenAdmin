// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/customer-no-plan-ui.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const nedStarkList = {
  id: 'user-ned',
  fullName: 'Ned Stark',
  phone: '+966500000099',
  email: 'ned@example.com',
  isActive: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  subscriptionStatus: null,
  planName: null,
  endDate: null,
  walletBalanceSar: 0,
  totalMealDays: null,
  deliveredCount: null,
  skippedCount: null,
  days_remaining: null,
  mealsLeft: null,
  subscription: null,
};

const noraList = {
  id: 'user-1',
  fullName: 'Nora Ali',
  phone: '+966500000001',
  email: 'nora@example.com',
  isActive: true,
  subscriptionStatus: 'active',
  planName: 'Month Plan',
  endDate: '2026-09-15',
  walletBalanceSar: 1000,
  totalMealDays: 22,
  deliveredCount: 4,
  skippedCount: 1,
  days_remaining: 17,
  mealsLeft: 17,
  subscription: {
    status: 'active',
    planName: 'Month Plan',
    endDate: '2026-09-15',
    totalMealDays: 22,
    deliveredCount: 4,
    skippedCount: 1,
    days_remaining: 17,
    mealsLeft: 17,
  },
};

describe('customer list plan copy', () => {
  it('renders No plan for a null subscription and meal counts for an active plan', async () => {
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
    if (!globalThis.window) {
      Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true });
    }

    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const { MemoryRouter } = await import('react-router-dom');
    const { CustomerListResponseSchema } =
      await import('../src/features/customers/model/customers.schema.ts');
    const { queryKeys } = await import('../src/shared/lib/api/queryKeys.ts');
    const { default: CustomerManagement } = await import('../src/pages/CustomerManagement.tsx');

    const customers = CustomerListResponseSchema.parse({
      customers: [nedStarkList, noraList],
      pagination: { page: 1, perPage: 20, total: 2, totalPages: 1 },
    });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
      },
    });
    queryClient.setQueryData(
      queryKeys.customers.list({
        search: undefined,
        status: undefined,
        filter: undefined,
        plan: undefined,
        page: 1,
      }),
      customers
    );

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, createElement(CustomerManagement))
      )
    );

    const ned = html.slice(html.indexOf('Ned Stark'), html.indexOf('Nora Ali'));
    assert.ok(ned.includes('Ned Stark'));
    assert.equal(ned.split('No plan').length - 1, 4);
    assert.equal(ned.includes('Active'), false);
    assert.equal(ned.includes('—'), false);

    const nora = html.slice(html.indexOf('Nora Ali'));
    assert.match(nora, /Month Plan/);
    assert.match(nora, /Active/);
    assert.match(nora, /17 days left/);
    assert.match(nora, /17 meals left/);
    queryClient.clear();
  });
});
