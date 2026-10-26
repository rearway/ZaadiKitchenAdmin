import type { CSSProperties } from 'react';

type StatusStyle = { bg: string; color: string };

type PlanStatusLinesProps = {
  planLabel: string;
  showPlanName: boolean;
  statusLabel: string;
  statusStyle: StatusStyle;
  /** List name is the row size. Detail name matches the plan card title. */
  variant: 'list' | 'detail';
};

function statusChipStyle(style: StatusStyle): CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: style.bg,
    color: style.color,
  };
}

/** Plan name on the first line and the status chip on the second. Not subscribed is the chip only. */
export default function PlanStatusLines({
  planLabel,
  showPlanName,
  statusLabel,
  statusStyle,
  variant,
}: PlanStatusLinesProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        width: variant === 'list' ? '200px' : undefined,
      }}
    >
      {showPlanName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {variant === 'list' ? (
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger)',
                flexShrink: 0,
              }}
            />
          ) : null}
          <span
            style={{
              fontSize: variant === 'detail' ? '16px' : '14px',
              fontWeight: variant === 'detail' ? 600 : 400,
              color: variant === 'detail' ? '#FFF' : '#D1D5DB',
            }}
          >
            {planLabel}
          </span>
        </div>
      ) : null}
      <span style={statusChipStyle(statusStyle)}>{statusLabel}</span>
    </div>
  );
}
