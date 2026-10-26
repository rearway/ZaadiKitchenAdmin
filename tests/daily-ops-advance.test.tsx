// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/daily-ops-advance.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PipelineAdvanceControl from '../src/features/daily-ops/components/PipelineAdvanceControl.tsx';

function renderControl(
  props: Partial<{
    stage: string;
    canAdvance: boolean;
    advanceLabel: string | null;
    isPending: boolean;
  }> = {}
) {
  return renderToStaticMarkup(
    createElement(PipelineAdvanceControl, {
      stage: props.stage ?? 'locked',
      canAdvance: props.canAdvance ?? false,
      advanceLabel: props.advanceLabel ?? null,
      isPending: props.isPending ?? false,
      onAdvance: () => undefined,
    })
  );
}

describe('pipeline advance control', () => {
  it('shows an enabled advance button for locked when can_advance is false', () => {
    const html = renderControl({ stage: 'locked', canAdvance: false, advanceLabel: null });
    assert.match(html, /<button/);
    assert.match(html, /Advance →/);
    assert.doesNotMatch(html, /disabled/);
  });

  it('shows the advance button for dispatch when can_advance is false', () => {
    const html = renderControl({
      stage: 'dispatch',
      canAdvance: false,
      advanceLabel: 'Mark as Delivered →',
    });
    assert.match(html, /Mark as Delivered →/);
    assert.doesNotMatch(html, /disabled/);
  });

  it('keeps the API label when can_advance is true', () => {
    const html = renderControl({
      stage: 'locked',
      canAdvance: true,
      advanceLabel: 'Mark as Dispatched →',
    });
    assert.match(html, /Mark as Dispatched →/);
  });

  it('hides the control for pending and delivered when can_advance is false', () => {
    assert.equal(renderControl({ stage: 'pending', canAdvance: false }), '');
    assert.equal(renderControl({ stage: 'delivered', canAdvance: false }), '');
  });

  it('still shows pending and delivered when can_advance is true', () => {
    assert.match(
      renderControl({ stage: 'pending', canAdvance: true, advanceLabel: 'Advance →' }),
      /<button/
    );
    assert.match(
      renderControl({ stage: 'delivered', canAdvance: true, advanceLabel: 'Advance →' }),
      /<button/
    );
  });

  it('disables the control only while the advance request is in flight', () => {
    const html = renderControl({ stage: 'locked', canAdvance: false, isPending: true });
    assert.match(html, /disabled/);
    assert.match(html, /Advancing…/);
  });
});
