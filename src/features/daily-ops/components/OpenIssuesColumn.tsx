import {
  formatOpsDeliveryDate,
  formatOpsSubmittedAt,
  mealTypeLabel,
  type Issue,
} from '../model/daily-ops.schema';

const MEAL_TYPE_EMOJI: Record<string, string> = { executive: '🍛', salad: '🥗' };
const ISSUE_TYPE_EMOJI: Record<string, string> = {
  missing: '📦',
  quality: '😟',
  wrong_order: '🔄',
  late: '⏰',
  other: '❓',
};

type OpenIssuesColumnProps = {
  issues: Issue[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onCredit: (issue: Issue) => void;
  onReject: (issue: Issue) => void;
};

export default function OpenIssuesColumn({
  issues,
  isLoading,
  isError,
  error,
  onCredit,
  onReject,
}: OpenIssuesColumnProps) {
  return (
    <div>
      <h3
        style={{
          fontSize: '14px',
          color: '#9CA3AF',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}
      >
        OPEN ISSUES
        {isLoading || isError ? '' : ` (${issues.length})`}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading ? (
          <div
            style={{
              padding: 'var(--space-24)',
              textAlign: 'center',
              color: 'var(--soft)',
              border: '1px dashed var(--border-ui)',
              borderRadius: 'var(--radius-12)',
              fontSize: 'var(--text-14)',
            }}
          >
            Loading issues…
          </div>
        ) : isError ? (
          <div
            role="alert"
            style={{
              padding: 'var(--space-24)',
              textAlign: 'center',
              color: 'var(--danger)',
              border: '1px dashed var(--danger)',
              borderRadius: 'var(--radius-12)',
              fontSize: 'var(--text-14)',
            }}
          >
            {error instanceof Error ? error.message : 'Failed to load issues.'}
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#9CA3AF',
              border: '1px dashed #333',
              borderRadius: '12px',
            }}
          >
            No open issues. Great job!
          </div>
        ) : (
          issues.map((issue) => (
            <OpenIssueCard
              key={issue.issue_id}
              issue={issue}
              onCredit={onCredit}
              onReject={onReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OpenIssueCard({
  issue,
  onCredit,
  onReject,
}: {
  issue: Issue;
  onCredit: (issue: Issue) => void;
  onReject: (issue: Issue) => void;
}) {
  const phone = issue.customer_phone?.trim() ?? '';
  const mealName = issue.meal_name?.trim() ?? '';
  const mealLabel = mealTypeLabel(issue.meal_type);
  const mealEmoji = MEAL_TYPE_EMOJI[issue.meal_type?.trim().toLowerCase() ?? ''] ?? '';
  const mealLine = [mealName, mealLabel].filter(Boolean).join(' · ');
  const delivery = formatOpsDeliveryDate(issue.delivery_date);
  const submitted = formatOpsSubmittedAt(issue.submitted_at);

  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #333',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          backgroundColor: 'rgba(255, 115, 64, 0.1)',
          color: 'var(--danger)',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '12px',
        }}
      >
        {ISSUE_TYPE_EMOJI[issue.issue_type ?? ''] ?? ''} {issue.issue_type_label}
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
        {issue.customer_name}
      </h4>
      <div style={{ marginBottom: 'var(--space-12)' }}>
        {phone ? (
          <a
            href={`tel:${phone}`}
            style={{
              color: 'var(--soft)',
              fontSize: 'var(--text-14)',
              textDecoration: 'underline',
              display: 'inline-block',
              marginBottom: 'var(--space-4)',
            }}
          >
            {phone}
          </a>
        ) : null}
        <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '0 0 var(--space-4)' }}>
          {issue.delivery_address ?? '—'}
        </p>
        {mealLine ? (
          <p
            style={{
              color: 'var(--text-4)',
              fontSize: 'var(--text-14)',
              margin: '0 0 var(--space-4)',
            }}
          >
            {mealEmoji ? `${mealEmoji} ` : ''}
            {mealLine}
          </p>
        ) : null}
        {delivery || submitted ? (
          <p style={{ color: 'var(--soft)', fontSize: 'var(--text-13)', margin: 0 }}>
            {delivery ? `Delivery ${delivery}` : ''}
            {delivery && submitted ? ' · ' : ''}
            {submitted ? `Submitted ${submitted}` : ''}
          </p>
        ) : null}
      </div>
      {issue.description && (
        <p
          style={{
            fontSize: '15px',
            fontStyle: 'italic',
            marginBottom: '20px',
            backgroundColor: '#222',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          "{issue.description}"
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          className="btn-primary"
          style={{ padding: '8px 16px', flex: 1 }}
          onClick={() => onCredit(issue)}
        >
          💳 Credit Wallet
        </button>
        <button
          style={{
            backgroundColor: 'transparent',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            flex: 1,
          }}
          onClick={() => onReject(issue)}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}
