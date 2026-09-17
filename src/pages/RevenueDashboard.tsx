import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRevenueSummary, useRevenueDaily } from '@/features/revenue';
import {
  currentMonthKsa,
  formatMrrChangeBadge,
  formatRevenueSar,
  formatSkipRateChange,
  PLAN_BAR_COLORS,
} from '@/features/revenue/model/revenue.schema';
import { ApiError } from '@/shared/types/api';

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKsa);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useRevenueSummary();
  const { data: daily, isLoading: dailyLoading, error: dailyError } = useRevenueDaily(selectedMonth);

  const monthOptions = useMemo(() => {
    if (daily?.available_months.length) return daily.available_months;
    return [{ value: selectedMonth, label: daily?.month_label ?? selectedMonth }];
  }, [daily, selectedMonth]);

  const maxDailyRevenue = useMemo(() => {
    const values = daily?.days.map((d) => d.revenue_sar) ?? [];
    return Math.max(...values, 1);
  }, [daily]);

  const planTotal = useMemo(
    () => summary?.subscribers_by_plan.reduce((sum, p) => sum + p.count, 0) ?? 0,
    [summary],
  );

  const error =
    summaryError instanceof ApiError
      ? summaryError.message
      : dailyError instanceof ApiError
        ? dailyError.message
        : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* 5a. DARK HEADER — MRR BLOCK */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #333',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <span
            style={{
              backgroundColor: '#333',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Admin
          </span>
        </div>

        <div
          style={{
            color: '#9CA3AF',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '8px',
          }}
        >
          MONTHLY RECURRING REVENUE
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontFamily: 'Montserrat, sans-serif',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {summaryLoading ? '…' : formatRevenueSar(summary?.mrr.amount_sar ?? 0)}
          </h1>
          {!summaryLoading && summary && (
            <div
              style={{
                backgroundColor: 'rgba(0, 200, 150, 0.15)',
                color: 'var(--danger)',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              {formatMrrChangeBadge(
                summary.mrr.change_pct,
                summary.mrr.change_direction,
                summary.mrr.comparison_label,
              )}
            </div>
          )}
        </div>

        {/* 3 Stat Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatTile
            label="ACTIVE"
            value={summaryLoading ? '…' : String(summary?.subscriber_counts.active ?? 0)}
            onClick={() => navigate('/customers?status=active')}
          />
          <StatTile
            label="NEW TODAY"
            value={summaryLoading ? '…' : String(summary?.subscriber_counts.new_today ?? 0)}
            color="var(--danger)"
            onClick={() => navigate('/customers?filter=new')}
          />
          <StatTile
            label="CHURNED"
            value={summaryLoading ? '…' : String(summary?.subscriber_counts.churned ?? 0)}
            color="var(--danger)"
            onClick={() => navigate('/customers?status=churned')}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* 5b. DAILY REVENUE BAR CHART */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', margin: 0 }}>
              DAILY REVENUE
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                backgroundColor: '#222',
                color: '#FFF',
                border: '1px solid #333',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {dailyLoading ? (
            <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '48px 0', textAlign: 'center' }}>
              Loading daily revenue…
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '180px',
                paddingTop: '20px',
              }}
            >
              {(daily?.days ?? []).map((day) => {
                const heightPct = (day.revenue_sar / maxDailyRevenue) * 100;
                const opacity = day.is_today ? 1 : day.revenue_sar > 0 ? 0.3 : 0.1;
                return (
                  <BarChartCol
                    key={day.date}
                    day={day.day_label}
                    height={`${heightPct}%`}
                    opacity={opacity}
                    today={day.is_today}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 5c. SUBSCRIBERS BY PLAN */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              margin: 0,
              marginBottom: '24px',
            }}
          >
            SUBSCRIBERS BY PLAN
          </h3>

          {summaryLoading ? (
            <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '48px 0', textAlign: 'center' }}>
              Loading plan breakdown…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(summary?.subscribers_by_plan ?? []).map((plan, index) => (
                <HorizontalBar
                  key={plan.plan_id}
                  label={plan.plan_label}
                  planId={plan.plan_id}
                  count={plan.count}
                  width={planTotal > 0 ? `${(plan.count / planTotal) * 100}%` : '0%'}
                  color={PLAN_BAR_COLORS[index % PLAN_BAR_COLORS.length]}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5d. KEY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            AVG SKIP RATE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontSize: '32px',
                fontFamily: 'Montserrat, sans-serif',
                color: 'var(--danger)',
              }}
            >
              {summaryLoading ? '…' : summary?.key_metrics.avg_skip_rate.value ?? 0}
            </span>
            {!summaryLoading && summary && (
              <span style={{ color: '#9CA3AF', fontSize: '14px' }}>
                {formatSkipRateChange(
                  summary.key_metrics.avg_skip_rate.change,
                  summary.key_metrics.avg_skip_rate.change_direction,
                  summary.key_metrics.avg_skip_rate.comparison_label,
                )}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            SALAD MEAL %
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontSize: '32px',
                fontFamily: 'Montserrat, sans-serif',
                color: 'var(--danger)',
              }}
            >
              {summaryLoading ? '…' : `${summary?.key_metrics.salad_meal_pct.value ?? 0}%`}
            </span>
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>
              {summary?.key_metrics.salad_meal_pct.label || 'of active subs'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

type StatTileProps = {
  label: string;
  value: string;
  color?: string;
  onClick: () => void;
};

function StatTile({ label, value, color = '#FFF', onClick }: StatTileProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#222',
        padding: '16px 20px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#222')}
    >
      <div style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '1px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontFamily: 'Montserrat, sans-serif', color }}>{value}</div>
    </div>
  );
}

type BarChartColProps = {
  day: string;
  height: string;
  opacity: number;
  today?: boolean;
};

function BarChartCol({ day, height, opacity, today }: BarChartColProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '60%',
            height: height,
            backgroundColor: 'var(--danger)',
            opacity,
            borderRadius: '4px 4px 0 0',
            minHeight: height === '0%' ? '2px' : height,
          }}
        />
      </div>
      <div
        style={{
          fontSize: '12px',
          color: today ? '#FFF' : '#9CA3AF',
          fontWeight: today ? 600 : 400,
          backgroundColor: today ? '#333' : 'transparent',
          padding: '2px 8px',
          borderRadius: '4px',
        }}
      >
        {day}
      </div>
    </div>
  );
}

type HorizontalBarProps = {
  label: string;
  planId: string;
  count: number;
  width: string;
  color: string;
};

function HorizontalBar({ label, planId, count, width, color }: HorizontalBarProps) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/customers?plan=${encodeURIComponent(planId)}`)}
      style={{ cursor: 'pointer' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '14px',
        }}
      >
        <span style={{ color: '#E5E7EB' }}>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{count}</span>
      </div>
      <div
        style={{ height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden' }}
      >
        <div style={{ height: '100%', backgroundColor: color, width, borderRadius: '4px' }} />
      </div>
    </div>
  );
}
