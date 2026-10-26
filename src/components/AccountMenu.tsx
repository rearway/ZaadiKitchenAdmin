type Props = {
  name: string;
  email: string;
  roleLabel: string;
  onSignOut: () => void;
};

export default function AccountMenu({ name, email, roleLabel, onSignOut }: Props) {
  return (
    <div
      role="menu"
      aria-label="Account"
      style={{
        position: 'absolute',
        top: '44px',
        insetInlineEnd: 0,
        width: '240px',
        backgroundColor: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        zIndex: 20,
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>{name}</div>
      <div
        style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', wordBreak: 'break-word' }}
      >
        {email}
      </div>
      <div style={{ fontSize: '12px', color: '#D1D5DB', marginTop: '8px' }}>{roleLabel}</div>
      <div style={{ height: '1px', backgroundColor: '#333', margin: '12px 0' }} />
      <button
        type="button"
        role="menuitem"
        onClick={onSignOut}
        style={{
          width: '100%',
          textAlign: 'start',
          background: 'none',
          border: 'none',
          color: '#F87171',
          fontSize: '14px',
          fontWeight: 600,
          padding: '8px 4px',
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
