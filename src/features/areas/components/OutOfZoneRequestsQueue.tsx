import { useState } from 'react';
import { useOutOfZoneRequests } from '../api/areas.queries';
import { formatOutOfZoneTimestamp, formatRequestCount } from '../model/out-of-zone.schema';

export default function OutOfZoneRequestsQueue() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isPlaceholderData } = useOutOfZoneRequests({ page });

  const totalPages = data?.pagination.totalPages ?? 0;
  if (data && totalPages > 0 && page > totalPages) {
    setPage(totalPages);
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      <div>
        <h2
          style={{
            fontSize: 'var(--text-20)',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Requested areas
        </h2>
        <p
          style={{
            color: 'var(--soft)',
            fontSize: 'var(--text-14)',
            margin: 'var(--space-8) 0 0',
          }}
        >
          Customers asked for delivery outside current zones. Adding a zone still uses Add New Area.
        </p>
        {data && (
          <p
            style={{
              color: 'var(--text-4)',
              fontSize: 'var(--text-13)',
              margin: 'var(--space-8) 0 0',
            }}
          >
            {formatRequestCount(data.totalRequests)} · {data.pagination.total}{' '}
            {data.pagination.total === 1 ? 'area' : 'areas'}
          </p>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            padding: 'var(--space-32)',
            textAlign: 'center',
            color: 'var(--soft)',
            fontSize: 'var(--text-14)',
          }}
        >
          Loading requests…
        </div>
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
          {error instanceof Error
            ? error.message
            : 'Failed to load area requests. Please try again.'}
        </div>
      )}

      {data && data.areas.length === 0 && !isError && (
        <div
          style={{
            backgroundColor: 'var(--blk3)',
            border: '1px solid var(--border-ui)',
            borderRadius: 'var(--radius-12)',
            padding: 'var(--space-32)',
            textAlign: 'center',
            color: 'var(--soft)',
            fontSize: 'var(--text-14)',
          }}
        >
          No customer area requests yet.
        </div>
      )}

      {data && data.areas.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-12)',
            opacity: isPlaceholderData ? 0.6 : 1,
          }}
        >
          {data.areas.map((area, index) => (
            <article
              key={`${area.areaName}-${area.firstRequested}-${index}`}
              style={{
                backgroundColor: 'var(--blk3)',
                border: '1px solid var(--border-ui)',
                borderRadius: 'var(--radius-12)',
                padding: 'var(--space-16) var(--space-24)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-16)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--text-16)', fontWeight: 600, margin: 0 }}>
                  {area.areaName.trim() || '—'}
                </h3>
                <p
                  style={{
                    color: 'var(--soft)',
                    fontSize: 'var(--text-13)',
                    margin: 'var(--space-4) 0 0',
                  }}
                >
                  First {formatOutOfZoneTimestamp(area.firstRequested)} · Last{' '}
                  {formatOutOfZoneTimestamp(area.lastRequested)}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  padding: 'var(--space-8) var(--space-16)',
                  borderRadius: 'var(--radius-8)',
                  fontWeight: 600,
                  fontSize: 'var(--text-13)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatRequestCount(area.requestCount)}
              </div>
            </article>
          ))}
        </div>
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
