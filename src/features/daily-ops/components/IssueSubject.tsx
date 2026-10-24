import type { Issue } from '../model/daily-ops.schema';

type IssueSubjectProps = {
  issue: Issue;
};

/** Customer name and phone repeated on credit and reject modals. */
export default function IssueSubject({ issue }: IssueSubjectProps) {
  const phone = issue.customer_phone?.trim() ?? '';

  return (
    <>
      {issue.issue_type_label} — {issue.customer_name}
      {phone ? (
        <>
          {' · '}
          <a href={`tel:${phone}`} style={{ color: 'var(--text-3)', textDecoration: 'underline' }}>
            {phone}
          </a>
        </>
      ) : null}
    </>
  );
}
