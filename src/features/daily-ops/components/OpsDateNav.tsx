import { shiftOpsDate } from '../model/daily-ops-date';

type OpsDateNavProps = {
  date: string;
  onChange: (isoDate: string) => void;
};

const stepButtonStyle = {
  padding: 'var(--space-8) var(--space-12)',
  border: '1px solid var(--border-ui)',
  lineHeight: 1,
  fontSize: 'var(--text-16)',
} as const;

export default function OpsDateNav({ date, onChange }: OpsDateNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-8)',
        marginTop: 'var(--space-8)',
      }}
    >
      <button
        type="button"
        className="btn-ghost"
        aria-label="Previous day"
        onClick={() => onChange(shiftOpsDate(date, -1))}
        style={stepButtonStyle}
      >
        ‹
      </button>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border-ui)',
          borderRadius: 'var(--radius-8)',
          padding: 'var(--space-6) var(--space-12)',
        }}
      >
        <input
          type="date"
          className="labels-date-input"
          dir="ltr"
          value={date}
          aria-label="Daily ops date"
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--white)',
            fontSize: 'var(--text-14)',
            fontFamily: 'var(--font-brand)',
            padding: 0,
            margin: 0,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </label>
      <button
        type="button"
        className="btn-ghost"
        aria-label="Next day"
        onClick={() => onChange(shiftOpsDate(date, 1))}
        style={stepButtonStyle}
      >
        ›
      </button>
    </div>
  );
}
