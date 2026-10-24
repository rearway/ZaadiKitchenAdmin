import { useState } from 'react';
import { ApiError } from '@/shared/types/api';
import { useMealRatings } from '../api/menu.queries';
import {
  formatAverageRating,
  formatRatingCount,
  formatRatingCreatedAt,
  formatRatingDeliveryDate,
  ratingCustomerLines,
  type MealRating,
} from '../model/meal-ratings.schema';

type MealRatingsPanelProps = {
  mealId: string;
};

function ratingsErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.statusCode === 404 &&
    error.errorCode === 'RESOURCE_NOT_FOUND'
  ) {
    return 'This meal was not found.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Failed to load ratings. Please try again.';
}

function StarMeter({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-hidden="true" style={{ fontSize: 'var(--text-14)', letterSpacing: '0.08em' }}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} style={{ color: index < filled ? 'var(--white)' : 'var(--faint)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function RatingRow({ rating }: { rating: MealRating }) {
  const customer = ratingCustomerLines(rating);
  const tags = rating.tags.map((tag) => tag.trim()).filter(Boolean);

  return (
    <li
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-ui)',
        borderRadius: 'var(--radius-8)',
        padding: 'var(--space-12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--text-14)', fontWeight: 600 }}>{customer.primary}</div>
        {customer.secondary && (
          <div
            dir="ltr"
            style={{ color: 'var(--soft)', fontSize: 'var(--text-13)', textAlign: 'start' }}
          >
            {customer.secondary}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-8)',
        }}
      >
        <span role="img" aria-label={`${rating.stars} out of 5 stars`}>
          <StarMeter value={rating.stars} />
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              backgroundColor: 'var(--blk3)',
              border: '1px solid var(--border-med)',
              borderRadius: 'var(--radius-8)',
              color: 'var(--text-4)',
              fontSize: 'var(--text-12)',
              padding: 'var(--space-4) var(--space-8)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-12)' }}>
        Delivery {formatRatingDeliveryDate(rating.deliveryDate)} · Rated{' '}
        {formatRatingCreatedAt(rating.createdAt)}
      </p>
    </li>
  );
}

export default function MealRatingsPanel({ mealId }: MealRatingsPanelProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isPlaceholderData } = useMealRatings(mealId, { page });

  const totalPages = data?.pagination.totalPages ?? 0;
  if (data && totalPages > 0 && page > totalPages) {
    setPage(totalPages);
  }

  return (
    <section
      aria-label="Meal ratings"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}
    >
      <h3 style={{ margin: 0, fontSize: 'var(--text-12)', fontWeight: 600, color: 'var(--soft)' }}>
        Ratings
      </h3>

      {isLoading && (
        <p role="status" style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-14)' }}>
          Loading ratings…
        </p>
      )}

      {isError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--danger-a06)',
            border: '1px solid var(--danger-a30)',
            borderRadius: 'var(--radius-8)',
            padding: 'var(--space-12) var(--space-16)',
            color: 'var(--text-err)',
            fontSize: 'var(--text-14)',
          }}
        >
          {ratingsErrorMessage(error)}
        </div>
      )}

      {data && data.ratingCount === 0 && !isError && (
        <p role="status" style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-14)' }}>
          No ratings for this meal yet.
        </p>
      )}

      {data && data.ratingCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <span style={{ fontSize: 'var(--text-24)', fontWeight: 700, lineHeight: 1 }}>
              {formatAverageRating(data.averageRating)}
            </span>
            {data.averageRating != null && (
              <span
                role="img"
                aria-label={`Average ${formatAverageRating(data.averageRating)} out of 5`}
              >
                <StarMeter value={data.averageRating} />
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-13)' }}>
            {formatRatingCount(data.ratingCount)}
          </p>
        </div>
      )}

      {data && data.ratingCount > 0 && data.ratings.length === 0 && !isError && (
        <p style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-14)' }}>
          No ratings on this page.
        </p>
      )}

      {data && data.ratings.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-8)',
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {data.ratings.map((rating) => (
            <RatingRow key={rating.id} rating={rating} />
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--space-12)',
            padding: 'var(--space-8) 0',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: 'var(--space-6) var(--space-16)', opacity: page <= 1 ? 0.4 : 1 }}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 'var(--text-14)', color: 'var(--soft)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: 'var(--space-6) var(--space-16)',
              opacity: page >= totalPages ? 0.4 : 1,
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
