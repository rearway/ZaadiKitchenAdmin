// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/daily-ops-date-nav.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OpsDateNav from '../src/features/daily-ops/components/OpsDateNav.tsx';
import {
  dailyOpsQueryParams,
  isOpsIsoDate,
  opsDateFromSearchParams,
  shiftOpsDate,
  withOpsDateParam,
} from '../src/features/daily-ops/model/daily-ops-date.ts';

const TODAY = '2026-10-26';

describe('daily ops date from the URL', () => {
  it('selects ?date=YYYY-MM-DD on load', () => {
    const params = new URLSearchParams('date=2026-10-28');
    assert.equal(opsDateFromSearchParams(params, TODAY), '2026-10-28');
  });

  it('accepts delivery_date when date is absent', () => {
    const params = new URLSearchParams('delivery_date=2026-10-28');
    assert.equal(opsDateFromSearchParams(params, TODAY), '2026-10-28');
  });

  it('prefers date over delivery_date', () => {
    const params = new URLSearchParams('date=2026-10-28&delivery_date=2026-10-27');
    assert.equal(opsDateFromSearchParams(params, TODAY), '2026-10-28');
  });

  it('falls back to today when the query is missing or not a calendar day', () => {
    assert.equal(opsDateFromSearchParams(new URLSearchParams(), TODAY), TODAY);
    assert.equal(opsDateFromSearchParams(new URLSearchParams('date=tomorrow'), TODAY), TODAY);
    assert.equal(opsDateFromSearchParams(new URLSearchParams('date=2026-02-31'), TODAY), TODAY);
    assert.equal(isOpsIsoDate('2026-10-28'), true);
    assert.equal(isOpsIsoDate('2026-13-01'), false);
  });
});

describe('daily ops date navigation', () => {
  it('moves one calendar day at a time, including past days', () => {
    assert.equal(shiftOpsDate('2026-10-28', -1), '2026-10-27');
    assert.equal(shiftOpsDate('2026-10-28', 1), '2026-10-29');
    assert.equal(shiftOpsDate('2026-10-01', -1), '2026-09-30');
  });

  it('sends the selected day as the daily ops date query', () => {
    assert.deepEqual(dailyOpsQueryParams('2026-10-28'), { date: '2026-10-28' });
  });

  it('writes ?date= when the selected day is not today and clears it for today', () => {
    const locked = withOpsDateParam(new URLSearchParams('role=admin'), '2026-10-28', TODAY);
    assert.equal(locked.get('date'), '2026-10-28');
    assert.equal(locked.get('delivery_date'), null);

    const today = withOpsDateParam(new URLSearchParams('date=2026-10-28'), TODAY, TODAY);
    assert.equal(today.get('date'), null);
    assert.equal(today.get('delivery_date'), null);
  });

  it('renders previous, next, and a date input for the selected day', () => {
    const html = renderToStaticMarkup(
      createElement(OpsDateNav, {
        date: '2026-10-28',
        onChange: () => undefined,
      })
    );
    assert.match(html, /aria-label="Previous day"/);
    assert.match(html, /aria-label="Next day"/);
    assert.match(html, /type="date"/);
    assert.match(html, /value="2026-10-28"/);
    assert.match(html, /aria-label="Daily ops date"/);
  });
});
