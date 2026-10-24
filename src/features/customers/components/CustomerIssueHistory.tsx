import {
  formatHistoryCreatedAt,
  formatHistoryDeliveryDate,
  issueHistoryOutcome,
  issueHistorySectionTitle,
  issueHistoryStatusLabel,
  issueHistoryTypeLabel,
  type IssueRecord,
} from '../model/customers.schema';

type CustomerIssueHistoryProps = {
  issues: IssueRecord[];
};

export default function CustomerIssueHistory({ issues }: CustomerIssueHistoryProps) {
  if (issues.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          color: '#6B7280',
          fontWeight: 600,
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {issueHistorySectionTitle(issues)}
      </div>
      {issues.map((issue, i) => {
        const statusLabel = issueHistoryStatusLabel(issue.status);
        const delivery = formatHistoryDeliveryDate(issue.deliveryDate);
        const created = formatHistoryCreatedAt(issue.createdAt);
        const outcome = issueHistoryOutcome(issue);
        const resolved = issue.resolvedAt ? formatHistoryCreatedAt(issue.resolvedAt) : '';
        const meta = [delivery ? `Delivery ${delivery}` : '', outcome ?? '']
          .filter(Boolean)
          .join(' · ');
        const showResolved = resolved !== '' && issue.status.trim().toLowerCase() !== 'open';

        return (
          <div
            key={issue.id || i}
            style={{
              fontSize: '13px',
              color: '#D1D5DB',
              padding: '6px 0',
              borderBottom: '1px solid #222',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div>
                {issueHistoryTypeLabel(issue.issueType)}
                {statusLabel ? ` · ${statusLabel}` : ''}
              </div>
              {meta ? (
                <div style={{ color: 'var(--soft)', fontSize: 'var(--text-12)', marginTop: '2px' }}>
                  {meta}
                </div>
              ) : null}
              {issue.description ? (
                <div
                  style={{
                    color: 'var(--soft)',
                    fontSize: 'var(--text-12)',
                    fontStyle: 'italic',
                    marginTop: '2px',
                  }}
                >
                  {issue.description}
                </div>
              ) : null}
              {showResolved ? (
                <div style={{ color: 'var(--mid)', fontSize: 'var(--text-12)', marginTop: '2px' }}>
                  Resolved {resolved}
                </div>
              ) : null}
            </div>
            <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{created}</span>
          </div>
        );
      })}
    </div>
  );
}
