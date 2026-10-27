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

const hodorList = {
  id: 'user-hodor',
  fullName: 'Hodor',
  phone: '+966500000098',
  email: 'hodor@example.com',
  isActive: true,
  subscriptionStatus: 'expired',
  planName: 'Week Plan',
  endDate: '2026-01-01',
  walletBalanceSar: 0,
  totalMealDays: 22,
  deliveredCount: 22,
  skippedCount: 0,
  days_remaining: 0,
  mealsLeft: 0,
  subscription: {
    status: 'expired',
    planName: 'Week Plan',
    endDate: '2026-01-01',
    totalMealDays: 22,
    deliveredCount: 22,
    skippedCount: 0,
    days_remaining: 0,
    mealsLeft: 0,
  },
};

const theonList = {
  id: 'user-theon',
  fullName: 'Theon Greyjoy',
  phone: '+966500000097',
  email: 'theon@example.com',
  isActive: false,
  deletedAt: '2026-10-20T00:00:00.000Z',
  subscriptionStatus: 'paused',
  planName: 'Month Plan',
  endDate: '2026-11-01',
  walletBalanceSar: 10,
  totalMealDays: 22,
  deliveredCount: 4,
  skippedCount: 1,
  days_remaining: 17,
  mealsLeft: 17,
  subscription: {
    status: 'paused',
    planName: 'Month Plan',
    endDate: '2026-11-01',
    totalMealDays: 22,
    deliveredCount: 4,
    skippedCount: 1,
    days_remaining: 17,
    mealsLeft: 17,
  },
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
  it('renders account and plan badges and hides days for empty or expired plans', async () => {
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
      customers: [nedStarkList, hodorList, theonList, noraList],
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

    const ned = html.slice(html.indexOf('Ned Stark'), html.indexOf('Hodor'));
    assert.match(ned, /Not subscribed/);
    assert.match(ned, /Account/);
    assert.match(ned, /Active/);
    assert.equal(ned.includes('No plan'), false);
    assert.equal(ned.includes('days left'), false);
    assert.equal(ned.includes('meals left'), false);
    assert.equal(ned.includes('—'), false);
    assert.match(ned, /var\(--danger\)/);
    assert.equal(ned.includes('var(--grn)'), false);

    const hodor = html.slice(html.indexOf('Hodor'), html.indexOf('Theon Greyjoy'));
    assert.match(hodor, /Week Plan/);
    assert.match(hodor, /Expired/);
    assert.match(hodor, /background-color:var\(--border-ui\)/);
    assert.match(hodor, /color:var\(--soft\)/);
    assert.equal(hodor.includes('days left'), false);
    assert.equal(hodor.includes('meals left'), false);

    const theon = html.slice(html.indexOf('Theon Greyjoy'), html.indexOf('Nora Ali'));
    assert.match(theon, /Month Plan/);
    assert.match(theon, /Paused/);
    assert.match(theon, /Inactive/);
    assert.match(theon, /var\(--mid\)/);
    assert.match(theon, /17 days left/);
    assert.match(theon, /17 meals left/);

    const nora = html.slice(html.indexOf('Nora Ali'));
    const noraColumn = nora.slice(nora.indexOf('flex-direction:column'));
    assert.ok(noraColumn.indexOf('Month Plan') < noraColumn.indexOf('>Active<'));
    assert.match(noraColumn, /var\(--grn\)/);
    assert.equal(nora.includes('Month Plan · Active'), false);
    assert.equal(nora.includes('·'), false);
    assert.match(nora, /17 days left/);
    assert.match(nora, /17 meals left/);

    const nedColumn = ned.slice(
      ned.indexOf('flex-direction:column'),
      ned.indexOf('Not subscribed') + 'Not subscribed'.length
    );
    assert.match(nedColumn, /Not subscribed/);
    assert.equal(nedColumn.includes('font-size:14px'), false);
    queryClient.clear();
  });
});
