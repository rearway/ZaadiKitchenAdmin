// JSX tests need the app tsconfig runtime: npx tsx --tsconfig tsconfig.app.json --test tests/soft-delete-ui.test.tsx
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DeleteAreaDialog from '../src/features/areas/components/DeleteAreaDialog.tsx';
import type { Area } from '../src/features/areas/model/areas.schema.ts';
import DeleteMealDialog from '../src/features/menu/components/DeleteMealDialog.tsx';
import type { Meal } from '../src/features/menu/model/menu.schema.ts';

const meal = {
  id: 'meal-1',
  name_en: 'Chicken Kabsa',
  name_ar: 'كبسة دجاج',
  meal_type: 'executive',
  kcal: 640,
  status: 'active',
  chef_note: null,
  key_ingredients: null,
  emoji: null,
  photo_url: null,
  has_pending_changes: false,
} as Meal;

const area = {
  id: 'area-1',
  name: 'Al Nakheel',
  status: 'active',
} as Area;

describe('soft-delete confirm dialogs', () => {
  it('asks before deleting a meal and offers no restore', () => {
    const html = renderToStaticMarkup(
      createElement(DeleteMealDialog, {
        meal,
        isPending: false,
        onCancel: () => undefined,
        onConfirm: () => undefined,
      })
    );
    assert.match(html, /Delete Chicken Kabsa\?/);
    assert.match(html, /removed from this list/);
    assert.match(html, /Delete meal/);
    assert.match(html, /Cancel/);
    assert.equal(html.includes('Restore'), false);
  });

  it('shows the pending label while a meal delete is in flight', () => {
    const html = renderToStaticMarkup(
      createElement(DeleteMealDialog, {
        meal,
        isPending: true,
        onCancel: () => undefined,
        onConfirm: () => undefined,
      })
    );
    assert.match(html, /Deleting…/);
    assert.equal(html.includes('Delete meal'), false);
  });

  it('asks before deleting an area and offers no restore', () => {
    const html = renderToStaticMarkup(
      createElement(DeleteAreaDialog, {
        area,
        isPending: false,
        onCancel: () => undefined,
        onConfirm: () => undefined,
      })
    );
    assert.match(html, /Delete Al Nakheel\?/);
    assert.match(html, /removed from this list/);
    assert.match(html, /Delete area/);
    assert.match(html, /Cancel/);
    assert.equal(html.includes('Restore'), false);
  });
});
