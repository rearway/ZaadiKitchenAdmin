// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/issues-ui.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CustomerIssueHistory from '../src/features/customers/components/CustomerIssueHistory.tsx';
import { CustomerHistorySchema } from '../src/features/customers/model/customers.schema.ts';
import CreditModal from '../src/features/daily-ops/components/CreditModal.tsx';
import OpenIssuesColumn from '../src/features/daily-ops/components/OpenIssuesColumn.tsx';
import RejectModal from '../src/features/daily-ops/components/RejectModal.tsx';
import { creditPrefillSar, type Issue } from '../src/features/daily-ops/model/daily-ops.schema.ts';

const mealTypes = [
  {
    slug: 'executive',
    name_en: 'Custom Balanced',
    name_ar: 'متوازن',
    short_en: 'Custom',
    short_ar: 'م',
    sort: 1,
  },
  {
    slug: 'salad',
    name_en: 'Custom Light',
    name_ar: 'لايت',
    short_en: 'Lite',
    short_ar: 'ل',
    sort: 2,
  },
];

function renderWithSettings(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryDefaults(['app', 'settings'], {
    queryFn: async () => mealTypes,
    staleTime: Infinity,
  });
  client.setQueryData(['app', 'settings'], mealTypes);
  return renderToStaticMarkup(createElement(QueryClientProvider, { client }, node));
}

const issue: Issue = {
  issue_id: 'iss_1',
  customer_name: 'Nora Ali',
  customer_phone: '+966500000001',
  delivery_address: 'Building 4, Al Olaya',
  issue_type: 'wrong_order',
  issue_type_label: 'Wrong order',
  description: 'Received the salad box',
  meal_name: 'Chicken Kabsa',
  meal_type: 'executive',
  delivery_date: '2026-10-20',
  submitted_at: '2026-10-21T08:15:00.000Z',
  plan_price_sar: 28,
};

describe('open issues column', () => {
  it('renders phone, meal, delivery date, and submitted time', () => {
    const html = renderWithSettings(
      createElement(OpenIssuesColumn, {
        issues: [issue],
        isLoading: false,
        isError: false,
        error: null,
        onCredit: () => undefined,
        onReject: () => undefined,
      })
    );

    assert.match(html, /Nora Ali/);
    assert.match(html, /href="tel:\+966500000001"/);
    assert.match(html, /Chicken Kabsa · Custom Balanced/);
    assert.match(html, /Delivery Oct 20, 2026/);
    assert.match(html, /Submitted Oct 21, 2026, 11:15 AM/);
    assert.match(html, /Received the salad box/);
    assert.doesNotMatch(html, /No open issues/);
  });

  it('shows the issues error instead of an empty queue', () => {
    const html = renderToStaticMarkup(
      createElement(OpenIssuesColumn, {
        issues: [],
        isLoading: false,
        isError: true,
        error: new Error('Issues unavailable'),
        onCredit: () => undefined,
        onReject: () => undefined,
      })
    );

    assert.match(html, /Issues unavailable/);
    assert.doesNotMatch(html, /No open issues/);
    assert.doesNotMatch(html, /OPEN ISSUES \(0\)/);
  });
});

describe('credit and reject modals', () => {
  it('repeats the customer name and phone and prefills the plan price', () => {
    const amount = creditPrefillSar(issue.plan_price_sar);
    const credit = renderToStaticMarkup(
      createElement(CreditModal, {
        issue,
        amount,
        setAmount: () => undefined,
        isPending: false,
        onClose: () => undefined,
        onConfirm: () => undefined,
      })
    );
    const reject = renderToStaticMarkup(
      createElement(RejectModal, {
        issue,
        reason: '',
        setReason: () => undefined,
        isPending: false,
        onClose: () => undefined,
        onConfirm: () => undefined,
      })
    );

    for (const html of [credit, reject]) {
      assert.match(html, /Nora Ali/);
      assert.match(html, /href="tel:\+966500000001"/);
    }
    assert.match(credit, /value="28"/);
  });
});

describe('customer issue history', () => {
  it('labels open rows as Issues and shows type, date, status, and time', () => {
    const issues = CustomerHistorySchema.parse({
      issues: [
        {
          issueType: 'not_delivered',
          deliveryDate: '2026-10-20',
          status: 'open',
          createdAt: '2026-10-21T08:15:00.000Z',
          description: 'Box was swapped',
        },
      ],
    }).issues;
    const html = renderToStaticMarkup(createElement(CustomerIssueHistory, { issues }));

    assert.match(html, />Issues</);
    assert.doesNotMatch(html, /Resolved Issues/);
    assert.match(html, /Not delivered · Open/);
    assert.match(html, /Delivery Oct 20, 2026/);
    assert.match(html, /Box was swapped/);
    assert.match(html, /Oct 21, 2026, 11:15 AM/);
  });

  it('shows credit or rejection reason on resolved rows', () => {
    const issues = CustomerHistorySchema.parse({
      issues: [
        {
          issueType: 'quality_issue',
          deliveryDate: '2026-10-18',
          status: 'credited',
          creditedAmountSar: 28,
          createdAt: '2026-10-19T05:00:00.000Z',
          resolvedAt: '2026-10-19T06:00:00.000Z',
        },
        {
          issueType: 'damaged',
          deliveryDate: '2026-10-17',
          status: 'rejected',
          rejectionReason: 'Outside policy',
          createdAt: '2026-10-17T12:00:00.000Z',
        },
      ],
    }).issues;
    const html = renderToStaticMarkup(createElement(CustomerIssueHistory, { issues }));

    assert.match(html, /Resolved Issues/);
    assert.match(html, /Quality issue · Credited/);
    assert.match(html, /SAR 28/);
    assert.match(html, /Resolved Oct 19, 2026/);
    assert.match(html, /Damaged · Rejected/);
    assert.match(html, /Outside policy/);
  });
});
