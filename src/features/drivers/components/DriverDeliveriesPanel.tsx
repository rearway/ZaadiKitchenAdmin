import { ApiError } from '@/shared/types/api';
import { useDriverDeliveries } from '../api/drivers.queries';
import {
  deliveryReviewView,
  deliveryStatusLabel,
  formatOpsDayLabel,
  mealTypeLabel,
  type DeliveryMealStatus,
  type DriverDelivery,
} from '../model/driver-deliveries.schema';

const DELIVERY_COLUMNS =
  'minmax(120px, 1.2fr) minmax(130px, 1fr) minmax(150px, 1.5fr) minmax(90px, 0.7fr) minmax(130px, 0.9fr) minmax(180px, 1.6fr)';

type Props = {
  driverId: string;
  date: string;
  onAssign: () => void;
};

function statusColor(status: DeliveryMealStatus): string {
  if (status === 'delivered') return 'var(--grn)';
  if (status === 'skipped') return 'var(--warn)';
  if (status === 'paused') return 'var(--purple)';
  return 'var(--soft)';
}

function cellText(value: string): string {
  return value.trim() ? value : '—';
}

function ReviewCell({ delivery }: { delivery: DriverDelivery }) {
  const view = deliveryReviewView(delivery);
  const isReview = delivery.status === 'delivered' && delivery.review;
  return (
    <span style={{ color: isReview ? 'var(--text-3)' : 'var(--mid)', lineHeight: 1.4 }}>
      {view}
    </span>
  );
}

export default function DriverDeliveriesPanel({ driverId, date, onAssign }: Props) {
  const deliveries = useDriverDeliveries(driverId, date);
  const rows = deliveries.data?.deliveries ?? [];
  const delivered = rows.filter((row) => row.status === 'delivered').length;
  const dateLabel = formatOpsDayLabel(date);

  return (
    <div
      style={{
        padding: 'var(--space-16) var(--space-20) var(--space-20)',
        backgroundColor: 'var(--blk2)',
        borderTop: '1px solid var(--border-ui)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--space-12)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-13)', color: 'var(--soft)' }}>
            Deliveries for {dateLabel}
          </div>
          {deliveries.data && (
            <div
              style={{
                fontSize: 'var(--text-13)',
                color: 'var(--mid)',
                marginTop: 'var(--space-4)',
              }}
            >
              {rows.length} meal{rows.length === 1 ? '' : 's'} this day ({delivered} delivered)
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ padding: 'var(--space-8) var(--space-16)', fontSize: 'var(--text-13)' }}
          onClick={onAssign}
        >
          Assign area…
        </button>
      </div>

      {deliveries.isLoading && (
        <div
          role="status"
          style={{ color: 'var(--soft)', fontSize: 'var(--text-14)', padding: 'var(--space-16) 0' }}
        >
          Loading deliveries…
        </div>
      )}

      {deliveries.isError && (
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
          {deliveries.error instanceof ApiError
            ? deliveries.error.message
            : 'Failed to load deliveries for this day.'}
        </div>
      )}

      {deliveries.data && rows.length === 0 && (
        <div
          role="status"
          style={{
            padding: 'var(--space-24)',
            textAlign: 'center',
            color: 'var(--soft)',
            border: '1px dashed var(--border-ui)',
            borderRadius: 'var(--radius-12)',
            fontSize: 'var(--text-14)',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: 'var(--space-6)' }}>
            No deliveries
          </div>
          No meals assigned to this driver on the selected date.
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: DELIVERY_COLUMNS,
              gap: 'var(--space-12)',
              padding: 'var(--space-8) 0',
              fontSize: 'var(--text-12)',
              color: 'var(--soft)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              minWidth: '860px',
            }}
          >
            <span>Customer</span>
            <span>Phone</span>
            <span>Meal</span>
            <span>Type</span>
            <span>Status</span>
            <span>Review</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: DELIVERY_COLUMNS,
                gap: 'var(--space-12)',
                padding: 'var(--space-12) 0',
                borderTop: '1px solid var(--border-ui)',
                alignItems: 'start',
                fontSize: 'var(--text-14)',
                minWidth: '860px',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--white)' }}>
                {cellText(row.customerName)}
              </span>
              <span dir="ltr" style={{ color: 'var(--text-3)', textAlign: 'start' }}>
                {cellText(row.phone)}
              </span>
              <span style={{ color: 'var(--text-3)' }}>{cellText(row.mealName)}</span>
              <span style={{ color: 'var(--text-3)' }}>{mealTypeLabel(row.mealType)}</span>
              <span
                style={{
                  color: statusColor(row.status),
                  fontWeight: 600,
                  fontSize: 'var(--text-13)',
                }}
              >
                {deliveryStatusLabel(row.status)}
              </span>
              <ReviewCell delivery={row} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
