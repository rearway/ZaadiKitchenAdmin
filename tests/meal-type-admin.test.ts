import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_DISHES_PER_STREAM,
  classifyAssignError,
  mapApiDayToWeekDayDetail,
  mealEditableFields,
  parseMealDetail,
} from '../src/features/menu/model/menu.schema.ts';
import { mealTypeText, parseMealTypes } from '../src/features/settings/model/meal-types.ts';
import { ApiError } from '../src/shared/types/api.ts';

describe('pending meal type', () => {
  it('keeps a pending executive to salad change on the edit form', () => {
    const detail = parseMealDetail({
      meal_id: 'meal-1',
      name_en: 'Chicken Kabsa',
      meal_type: 'executive',
      status: 'updated',
      pending: {
        name_en: 'Chicken Kabsa',
        meal_type: 'salad',
      },
    });

    assert.equal(detail.meal_type, 'executive');
    assert.equal(detail.pending?.meal_type, 'salad');
    assert.equal(mealEditableFields(detail).meal_type, 'salad');
  });

  it('keeps a pending salad to executive change and accepts camelCase', () => {
    const detail = parseMealDetail({
      id: 'meal-2',
      nameEn: 'Greek Salad',
      mealType: 'salad',
      status: 'updated',
      pending: { mealType: 'executive' },
    });

    assert.equal(detail.pending?.meal_type, 'executive');
    assert.equal(mealEditableFields(detail).meal_type, 'executive');
  });

  it('leaves the live type when pending omits meal_type', () => {
    const detail = parseMealDetail({
      meal_id: 'meal-3',
      name_en: 'Chicken Kabsa',
      meal_type: 'executive',
      status: 'updated',
      pending: { name_en: 'Spiced Kabsa' },
    });

    assert.equal(detail.pending?.meal_type, undefined);
    assert.equal(mealEditableFields(detail).meal_type, 'executive');
    assert.equal(mealEditableFields(detail).name_en, 'Spiced Kabsa');
  });
});

describe('dishes per day', () => {
  it('allows a fourth dish when the API omits can_add flags', () => {
    const slots = [1, 2, 3].map((n) => ({
      slot_id: `slot-${n}`,
      meal_type: 'executive' as const,
      meal: null,
    }));
    const day = mapApiDayToWeekDayDetail({
      delivery_date: '2026-10-26',
      day_label: 'MON',
      date_label: '26 Oct',
      slots: [],
      executive_slots: slots,
      salad_slots: [],
    });

    assert.equal(MAX_DISHES_PER_STREAM, 4);
    assert.equal(day.can_add_executive, true);
    assert.equal(day.can_add_salad, true);
  });

  it('stops at four dishes and still honors an explicit API flag', () => {
    const slots = [1, 2, 3, 4].map((n) => ({
      slot_id: `slot-${n}`,
      meal_type: 'salad' as const,
      meal: null,
    }));
    const full = mapApiDayToWeekDayDetail({
      delivery_date: '2026-10-26',
      day_label: 'MON',
      date_label: '26 Oct',
      slots: [],
      executive_slots: [],
      salad_slots: slots,
    });
    const blocked = mapApiDayToWeekDayDetail({
      delivery_date: '2026-10-26',
      day_label: 'MON',
      date_label: '26 Oct',
      can_add_executive: false,
      slots: [],
      executive_slots: [],
      salad_slots: [],
    });

    assert.equal(full.can_add_salad, false);
    assert.equal(blocked.can_add_executive, false);
  });

  it('uses 4 in the local limit message', () => {
    const error = classifyAssignError(new ApiError('', 409, { errorCode: 'DAY_MEAL_TYPE_LIMIT' }));
    assert.equal(error.kind, 'day_meal_type_limit');
    if (error.kind === 'day_meal_type_limit') {
      assert.match(error.message, /4 dishes/);
    }
  });
});

describe('meal type display names', () => {
  it('reads the settings contract and fills a missing slug from the default', () => {
    const displays = parseMealTypes([
      {
        slug: 'salad',
        name_en: 'Light Box',
        name_ar: 'لايت',
        short_en: 'Box',
        short_ar: 'ب',
        sort: 2,
      },
      {
        slug: 'breakfast',
        name_en: 'Ignored',
        name_ar: 'x',
        short_en: 'x',
        short_ar: 'x',
        sort: 9,
      },
    ]);

    assert.deepEqual(
      displays.map((item) => item.slug),
      ['executive', 'salad']
    );
    assert.equal(mealTypeText('salad', 'name', displays), 'Light Box');
    assert.equal(mealTypeText('salad', 'short', displays), 'Box');
    assert.equal(mealTypeText('executive', 'name', displays), 'Platio Balanced');
    assert.equal(mealTypeText('executive', 'short', displays), 'Balanced');
  });

  it('falls back to Platio names when no catalog is loaded', () => {
    assert.equal(mealTypeText('executive'), 'Platio Balanced');
    assert.equal(mealTypeText('salad', 'short'), 'Light');
    assert.equal(mealTypeText(null), '');
    assert.equal(mealTypeText('custom'), 'custom');
  });

  it('rejects a payload that is not the settings array', () => {
    assert.throws(() => parseMealTypes(undefined), /meal_types/);
  });
});
