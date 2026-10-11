import { useAreas } from '@/features/areas';
import { useAutomations } from '@/features/comms';
import { useIssues } from '@/features/daily-ops';
import { useWeeks, type Week } from '@/features/menu';
import { formatRevenueSar, useRevenueSummary } from '@/features/revenue';

export type DashboardTileId = 'ops' | 'revenue' | 'menu' | 'customers' | 'comms' | 'areas';

const LOADING = '…';
const UNAVAILABLE = '—';

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function summarize<T>(
  query: { data: T | undefined; isLoading: boolean; isError: boolean },
  format: (data: T) => string,
): string {
  if (query.isLoading) return LOADING;
  if (query.isError || query.data === undefined) return UNAVAILABLE;
  return format(query.data);
}

function menuSubtitle(weeks: Week[]): string {
  const week = weeks[0];
  if (!week) return 'No weeks scheduled';
  const range = week.date_range ?? week.label ?? week.start_date;
  if (week.status === 'published') return `${range} · Published`;
  if (week.fill_status) {
    return `${range} · ${week.fill_status.filled_days}/${week.fill_status.total_days} days filled`;
  }
  return `${range} · Draft`;
}

export function useDashboardSubtitles(): Record<DashboardTileId, string> {
  const issues = useIssues();
  const revenue = useRevenueSummary();
  const weeks = useWeeks();
  const automations = useAutomations();
  const areas = useAreas();

  return {
    ops: summarize(issues, (d) =>
      d.open_count === 0 ? 'No open issues' : plural(d.open_count, 'open issue', 'open issues'),
    ),
    revenue: summarize(revenue, (d) => `${formatRevenueSar(d.mrr.amount_sar)} MRR`),
    menu: summarize(weeks, menuSubtitle),
    customers: summarize(revenue, (d) => `${d.subscriber_counts.active} active`),
    comms: summarize(automations, (d) =>
      plural(
        d.automations.filter((a) => a.is_enabled).length,
        'automation live',
        'automations live',
      ),
    ),
    areas: summarize(areas, (d) =>
      plural(d.filter((a) => a.status === 'active').length, 'active zone', 'active zones'),
    ),
  };
}
