type WeekAheadLockNoteProps = {
  message: string;
};

/** Locked state for the week after next, before Thursday 18:00 Asia/Riyadh. */
export default function WeekAheadLockNote({ message }: WeekAheadLockNoteProps) {
  return (
    <div
      role="status"
      style={{
        backgroundColor: 'var(--warn-a10)',
        color: 'var(--danger)',
        padding: 'var(--space-12) var(--space-16)',
        borderRadius: 'var(--radius-8)',
        fontSize: 'var(--text-14)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-8)',
      }}
    >
      <span aria-hidden="true">🔒</span>
      <span>{message}</span>
    </div>
  );
}
