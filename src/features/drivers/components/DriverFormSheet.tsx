import { useEffect, useState, type CSSProperties } from 'react';
import type { Area, AreaStatus } from '@/features/areas';
import {
  CreateDriverSchema,
  UpdateDriverSchema,
  type CreateDriverInput,
  type Driver,
  type UpdateDriverInput,
} from '../model/drivers.schema';

type Props = {
  mode: 'create' | 'edit';
  driver: Driver | null;
  areas: Area[];
  areasLoading: boolean;
  areasError: string | null;
  serverError: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDriverInput | UpdateDriverInput) => void;
};

const AREA_STATUS_LABEL: Record<AreaStatus, string> = {
  active: 'Active',
  coming_soon: 'Coming soon',
  paused: 'Paused',
};

const fieldStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-med)',
  borderRadius: 'var(--radius-8)',
  padding: 'var(--space-10) var(--space-12)',
  color: 'var(--white)',
  fontSize: 'var(--text-14)',
};

const labelStyle: CSSProperties = {
  fontSize: 'var(--text-12)',
  color: 'var(--soft)',
  marginBottom: 'var(--space-6)',
  display: 'block',
  letterSpacing: '0.4px',
  textTransform: 'uppercase',
};

export default function DriverFormSheet({
  mode,
  driver,
  areas,
  areasLoading,
  areasError,
  serverError,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const [fullName, setFullName] = useState(driver?.fullName ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [isActive, setIsActive] = useState(driver?.isActive ?? true);
  const [areaIds, setAreaIds] = useState<string[]>(driver?.areas.map((area) => area.id) ?? []);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPending, onClose]);

  const toggleArea = (areaId: string) => {
    setAreaIds((current) =>
      current.includes(areaId) ? current.filter((id) => id !== areaId) : [...current, areaId]
    );
  };

  const handleSubmit = () => {
    setSubmitError(null);
    const parsed = (mode === 'edit' ? UpdateDriverSchema : CreateDriverSchema).safeParse({
      full_name: fullName,
      phone,
      area_ids: areaIds,
      is_active: isActive,
    });
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <div
      role="presentation"
      onClick={() => {
        if (!isPending) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-form-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: 'var(--blk3)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-24) var(--radius-24) 0 0',
          padding: 'var(--space-32)',
          position: 'relative',
          borderTop: '1px solid var(--border-ui)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'var(--border-med)',
            borderRadius: '2px',
            position: 'absolute',
            top: 'var(--space-12)',
            insetInlineStart: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-16)',
            paddingTop: 'var(--space-8)',
          }}
        >
          <h2
            id="driver-form-title"
            style={{ fontSize: 'var(--text-24)', fontFamily: 'var(--font-brand)', margin: 0 }}
          >
            {mode === 'create' ? 'Add driver' : `Edit ${driver?.fullName || 'driver'}`}
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--soft)' }}>
            Drivers sign in on the rider app with this phone. They cannot register themselves.
          </p>

          <div>
            <label htmlFor="driver-name" style={labelStyle}>
              Full name
            </label>
            <input
              id="driver-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Khalid Al Harbi"
              style={fieldStyle}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="driver-phone" style={labelStyle}>
              Phone
            </label>
            <input
              id="driver-phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+9665XXXXXXXX"
              style={fieldStyle}
              autoComplete="tel"
            />
            <p
              style={{
                margin: 'var(--space-6) 0 0',
                fontSize: 'var(--text-12)',
                color: 'var(--mid)',
              }}
            >
              OTP sign-in number. +966 and 9 digits, or a leading 0.
            </p>
          </div>

          {mode === 'edit' && (
            <div>
              <span style={labelStyle}>Status</span>
              <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                {(
                  [
                    [true, 'Active'],
                    [false, 'Inactive'],
                  ] as const
                ).map(([value, label]) => {
                  const selected = isActive === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setIsActive(value)}
                      style={{
                        padding: 'var(--space-8) var(--space-16)',
                        borderRadius: 'var(--radius-6)',
                        fontSize: 'var(--text-13)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: selected
                          ? '2px solid var(--danger)'
                          : '1px solid var(--border-med)',
                        backgroundColor: selected ? 'var(--brand-a10)' : 'var(--surface)',
                        color: selected ? 'var(--danger)' : 'var(--soft)',
                      }}
                    >
                      {selected ? '✓ ' : ''}
                      {label}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  margin: 'var(--space-6) 0 0',
                  fontSize: 'var(--text-12)',
                  color: 'var(--mid)',
                }}
              >
                Inactive drivers cannot sign in.
              </p>
            </div>
          )}

          <div>
            <span style={labelStyle}>Areas</span>
            <p
              style={{
                margin: '0 0 var(--space-8)',
                fontSize: 'var(--text-12)',
                color: 'var(--mid)',
              }}
            >
              {areaIds.length === 0
                ? 'No areas selected. A driver can cover more than one area.'
                : `${areaIds.length} area${areaIds.length === 1 ? '' : 's'} selected.`}
            </p>
            {areasLoading && (
              <p style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--soft)' }}>
                Loading areas…
              </p>
            )}
            {areasError && (
              <p style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--text-err)' }}>
                {areasError}
              </p>
            )}
            {!areasLoading && !areasError && areas.length === 0 && (
              <p style={{ margin: 0, fontSize: 'var(--text-13)', color: 'var(--soft)' }}>
                No delivery areas yet. You can still save the driver and assign areas later.
              </p>
            )}
            {areas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                {areas.map((area) => {
                  const selected = areaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleArea(area.id)}
                      style={{
                        padding: 'var(--space-8) var(--space-12)',
                        borderRadius: 'var(--radius-20)',
                        fontSize: 'var(--text-13)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selected ? '2px solid var(--danger)' : '1px solid var(--border-ui)',
                        backgroundColor: selected ? 'var(--brand-a10)' : 'var(--surface)',
                        color: selected ? 'var(--white)' : 'var(--soft)',
                      }}
                    >
                      {selected ? '✓ ' : ''}
                      {area.name}
                      <span style={{ color: 'var(--mid)', fontWeight: 500 }}>
                        {' '}
                        · {AREA_STATUS_LABEL[area.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {(submitError || serverError) && (
            <div style={{ color: 'var(--text-err)', fontSize: 'var(--text-13)' }}>
              {submitError ?? serverError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-12)', paddingTop: 'var(--space-8)' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ flex: 1, backgroundColor: 'var(--surface)' }}
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ flex: 2, opacity: isPending ? 0.7 : 1 }}
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? 'Saving…' : mode === 'create' ? 'Add driver' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
