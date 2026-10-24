import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MealRatingsResponseSchema,
  formatAverageRating,
  formatRatingCount,
  formatRatingCreatedAt,
  formatRatingDeliveryDate,
  ratingCustomerLines,
} from '../src/features/menu/model/meal-ratings.schema.ts';

const documentedPayload = {
  meal_id: '7c1e',
  average_rating: 4.25,
  rating_count: 25,
  ratings: [
    {
      id: 'rating-uuid',
      user_id: 'user-uuid',
      phone: '+966500000001',
      full_name: 'Nora Ali',
      stars: 5,
      tags: ['Great portion'],
      delivery_date: '2026-09-02',
      created_at: '2026-09-03T08:15:00.000Z',
    },
  ],
  pagination: {
    page: 1,
    per_page: 20,
    total: 25,
    total_pages: 2,
  },
};

describe('MealRatingsResponseSchema', () => {
  it('parses the admin meal ratings payload', () => {
    const parsed = MealRatingsResponseSchema.parse(documentedPayload);

    assert.equal(parsed.mealId, '7c1e');
    assert.equal(parsed.averageRating, 4.25);
    assert.equal(parsed.ratingCount, 25);
    assert.equal(parsed.pagination.page, 1);
    assert.equal(parsed.pagination.perPage, 20);
    assert.equal(parsed.pagination.total, 25);
    assert.equal(parsed.pagination.totalPages, 2);
    assert.deepEqual(parsed.ratings[0], {
      id: 'rating-uuid',
      userId: 'user-uuid',
      phone: '+966500000001',
      fullName: 'Nora Ali',
      stars: 5,
      tags: ['Great portion'],
      deliveryDate: '2026-09-02',
      createdAt: '2026-09-03T08:15:00.000Z',
    });
  });

  it('accepts an empty meal with a null average', () => {
    const parsed = MealRatingsResponseSchema.parse({
      meal_id: '7c1e',
      average_rating: null,
      rating_count: 0,
      ratings: [],
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
    });

    assert.equal(parsed.averageRating, null);
    assert.equal(parsed.ratingCount, 0);
    assert.deepEqual(parsed.ratings, []);
    assert.equal(parsed.pagination.totalPages, 0);
  });

  it('accepts a rating whose customer phone and name are null', () => {
    const parsed = MealRatingsResponseSchema.parse({
      ...documentedPayload,
      ratings: [
        {
          ...documentedPayload.ratings[0],
          phone: null,
          full_name: null,
          tags: [],
        },
      ],
    });

    assert.equal(parsed.ratings[0]?.phone, null);
    assert.equal(parsed.ratings[0]?.fullName, null);
    assert.deepEqual(parsed.ratings[0]?.tags, []);
  });

  it('rejects stars outside 1–5 and a missing ratings list', () => {
    const badStars = MealRatingsResponseSchema.safeParse({
      ...documentedPayload,
      ratings: [{ ...documentedPayload.ratings[0], stars: 0 }],
    });
    const missingList = MealRatingsResponseSchema.safeParse({
      meal_id: '7c1e',
      average_rating: null,
      rating_count: 0,
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
    });

    assert.equal(badStars.success, false);
    assert.equal(missingList.success, false);
  });
});

describe('meal rating display formatters', () => {
  it('formats the average, count, delivery date, and Riyadh created time', () => {
    assert.equal(formatAverageRating(null), '—');
    assert.equal(formatAverageRating(4.25), '4.25');
    assert.equal(formatAverageRating(5), '5');
    assert.equal(formatRatingCount(1), '1 rating');
    assert.equal(formatRatingCount(25), '25 ratings');
    assert.equal(formatRatingDeliveryDate('2026-09-02'), 'Sep 2, 2026');
    assert.equal(formatRatingDeliveryDate(''), '—');
    assert.equal(formatRatingDeliveryDate('not-a-date'), 'not-a-date');
    assert.match(formatRatingCreatedAt('2026-09-03T08:15:00.000Z'), /Sep 3, 2026, 11:15\sAM/);
    assert.equal(formatRatingCreatedAt(''), '—');
    assert.equal(formatRatingCreatedAt('not-a-date'), 'not-a-date');
  });

  it('shows the customer name and phone, and a fallback when both are missing', () => {
    assert.deepEqual(ratingCustomerLines({ fullName: 'Nora Ali', phone: '+966500000001' }), {
      primary: 'Nora Ali',
      secondary: '+966500000001',
    });
    assert.deepEqual(ratingCustomerLines({ fullName: null, phone: '+966500000001' }), {
      primary: '+966500000001',
      secondary: null,
    });
    assert.deepEqual(ratingCustomerLines({ fullName: '  ', phone: null }), {
      primary: 'Unknown customer',
      secondary: null,
    });
  });
});
