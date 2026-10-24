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
        backgroundColor: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>{customer.primary}</div>
        {customer.secondary && (
          <div
            dir="ltr"
            style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'start', marginTop: '4px' }}
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
          gap: '8px',
        }}
      >
        <span role="img" aria-label={`${rating.stars} out of 5 stars`}>
          <StarMeter value={rating.stars} />
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              backgroundColor: '#111',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#E5E7EB',
              fontSize: '12px',
              padding: '4px 8px',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isLoading && (
        <div role="status" style={{ color: '#9CA3AF', fontSize: '14px', padding: '16px 0' }}>
          Loading ratings…
        </div>
      )}

      {isError && (
        <div
          role="alert"
          style={{
            backgroundColor: 'rgba(220,38,38,0.06)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: '14px',
          }}
        >
          {ratingsErrorMessage(error)}
        </div>
      )}

      {data && data.ratingCount === 0 && !isError && (
        <div role="status" style={{ color: '#9CA3AF', fontSize: '14px', padding: '16px 0' }}>
          No ratings for this meal yet.
        </div>
      )}

      {data && data.ratingCount > 0 && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: 600 }}>
            Average
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFF' }}>
              {formatAverageRating(data.averageRating)}
            </div>
            {data.averageRating != null && (
              <span
                role="img"
                aria-label={`Average ${formatAverageRating(data.averageRating)} out of 5`}
              >
                <StarMeter value={data.averageRating} />
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            {formatRatingCount(data.ratingCount)}
          </div>
        </div>
      )}

      {data && data.ratingCount > 0 && data.ratings.length === 0 && !isError && (
        <div style={{ color: '#9CA3AF', fontSize: '14px' }}>No ratings on this page.</div>
      )}

      {data && data.ratings.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
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
            gap: '12px',
            padding: '8px 0',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px 16px', opacity: page <= 1 ? 0.4 : 1 }}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px 16px', opacity: page >= totalPages ? 0.4 : 1 }}
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
