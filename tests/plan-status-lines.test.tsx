// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/plan-status-lines.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PlanStatusLines from '../src/features/customers/components/PlanStatusLines.tsx';
import { SUBSCRIPTION_STATUS_COLOR } from '../src/features/customers/model/customers.schema.ts';

function column(html: string): string {
  const at = html.indexOf('flex-direction:column');
  assert.ok(at >= 0);
  return html.slice(at);
}

describe('plan status lines', () => {
  it('stacks the plan name above the colored status', () => {
    const html = renderToStaticMarkup(
      createElement(PlanStatusLines, {
        variant: 'list',
        planLabel: 'Quarterly',
        showPlanName: true,
        statusLabel: 'Active',
        statusStyle: SUBSCRIPTION_STATUS_COLOR.active,
      })
    );
    const lines = column(html);
    assert.ok(lines.indexOf('Quarterly') < lines.indexOf('>Active<'));
    assert.match(lines, /color:var\(--grn\)/);
    assert.equal(html.includes('Quarterly · Active'), false);
    assert.equal(html.includes('·'), false);
  });

  it('keeps Not subscribed on one line with no plan name', () => {
    const html = renderToStaticMarkup(
      createElement(PlanStatusLines, {
        variant: 'detail',
        planLabel: '',
        showPlanName: false,
        statusLabel: 'Not subscribed',
        statusStyle: SUBSCRIPTION_STATUS_COLOR.none,
      })
    );
    assert.match(html, /Not subscribed/);
    assert.match(html, /color:var\(--danger\)/);
    assert.equal(html.includes('font-size:16px'), false);
    assert.equal(html.includes('·'), false);
  });

  it('keeps paused, cancelled, and expired colors on the status line', () => {
    for (const [status, label, color] of [
      ['paused', 'Paused', 'var(--purple)'],
      ['cancelled', 'Cancelled', 'var(--warn)'],
      ['expired', 'Expired', 'var(--soft)'],
    ] as const) {
      const html = renderToStaticMarkup(
        createElement(PlanStatusLines, {
          variant: 'detail',
          planLabel: 'Quarterly',
          showPlanName: true,
          statusLabel: label,
          statusStyle: SUBSCRIPTION_STATUS_COLOR[status],
        })
      );
      const lines = column(html);
      assert.ok(lines.indexOf('Quarterly') < lines.indexOf(`>${label}<`));
      assert.match(html, new RegExp(color.replace(/[()]/g, '\\$&')));
    }
  });
});
