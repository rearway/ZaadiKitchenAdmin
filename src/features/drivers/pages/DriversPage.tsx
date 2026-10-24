import { useMemo, useState, type ReactNode } from 'react';
import { useAreas } from '@/features/areas';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { ApiError } from '@/shared/types/api';
import DeleteDriverDialog from '../components/DeleteDriverDialog';
import DriverFormSheet from '../components/DriverFormSheet';
import {
  useCreateDriver,
  useDeleteDriver,
  useDriver,
  useDrivers,
  useUpdateDriver,
} from '../api/drivers.queries';
import {
  driverAreaLabels,
  filterDrivers,
  type CreateDriverInput,
  type Driver,
  type UpdateDriverInput,
} from '../model/drivers.schema';

const DRIVER_COLUMNS = 'minmax(180px, 1.4fr) minmax(160px, 1fr) minmax(180px, 1.8fr) 110px 150px';

function messageFrom(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function DriversPage() {
  const [query, setQuery] = useState('');
  const debouncedQ = useDebouncedValue(query, 400);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const list = useDrivers();
  const detail = useDriver(editingId);
  const areasQuery = useAreas();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();

  const areas = areasQuery.data ?? [];
  const areaNameById = useMemo(
    () => new Map((areasQuery.data ?? []).map((area) => [area.id, area.name])),
    [areasQuery.data]
  );

  const drivers = list.data?.drivers ?? [];
  const visibleDrivers = useMemo(
    () => filterDrivers(list.data?.drivers ?? [], debouncedQ),
    [list.data, debouncedQ]
  );
  const isSaving = createDriver.isPending || updateDriver.isPending;

  const closeEditor = () => {
    if (isSaving) return;
    setCreating(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = (input: CreateDriverInput | UpdateDriverInput) => {
    setErrorMsg(null);
    setFormError(null);
    const onSuccess = () => {
      setSuccessMsg(creating ? `${input.full_name} added.` : `${input.full_name} updated.`);
      setCreating(false);
      setEditingId(null);
    };
    const onError = (err: unknown) => {
      setFormError(messageFrom(err, 'Failed to save driver.'));
    };
    if (creating) {
      createDriver.mutate(
        { full_name: input.full_name, phone: input.phone, area_ids: input.area_ids },
        { onSuccess, onError }
      );
      return;
    }
    if (!editingId || !('is_active' in input)) return;
    updateDriver.mutate({ driverId: editingId, input }, { onSuccess, onError });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setErrorMsg(null);
    const name = deleteTarget.fullName || deleteTarget.phone;
    deleteDriver.mutate(deleteTarget.id, {
      onSuccess: () => {
        setSuccessMsg(`${name} removed.`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        setDeleteTarget(null);
        setErrorMsg(messageFrom(err, 'Failed to delete driver.'));
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-16)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--text-32)', fontFamily: 'var(--font-brand)', margin: 0 }}>
            Drivers
            {!list.isLoading && drivers.length > 0 && (
              <span style={{ color: 'var(--soft)', fontSize: 'var(--text-20)' }}>
                {' '}
                · {drivers.length} total
              </span>
            )}
          </h1>
          <p
            style={{
              color: 'var(--soft)',
              fontSize: 'var(--text-14)',
              margin: 'var(--space-8) 0 0',
            }}
          >
            Rider accounts and the areas they deliver
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setErrorMsg(null);
            setFormError(null);
            setEditingId(null);
            setCreating(true);
          }}
        >
          + Add driver
        </button>
      </div>

      {successMsg && (
        <Banner tone="success" onDismiss={() => setSuccessMsg(null)}>
          ✓ {successMsg}
        </Banner>
      )}
      {errorMsg && (
        <Banner tone="error" onDismiss={() => setErrorMsg(null)}>
          ⚠ {errorMsg}
        </Banner>
      )}

      <input
        type="search"
        placeholder="Search by name or phone…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search drivers"
        style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--blk3)' }}
      />

      {list.isLoading && (
        <div style={{ padding: 'var(--space-32)', textAlign: 'center', color: 'var(--soft)' }}>
          Loading drivers…
        </div>
      )}

      {list.isError && (
        <div style={{ padding: 'var(--space-32)', textAlign: 'center', color: 'var(--danger)' }}>
          {list.error instanceof ApiError
            ? list.error.message
            : 'Failed to load drivers. Please try again.'}
        </div>
      )}

      {!list.isLoading && !list.isError && visibleDrivers.length === 0 && (
        <div
          style={{
            padding: 'var(--space-32)',
            textAlign: 'center',
            color: 'var(--soft)',
            border: '1px dashed var(--border-ui)',
            borderRadius: 'var(--radius-12)',
          }}
        >
          {debouncedQ.trim()
            ? 'No drivers match this search.'
            : 'No drivers yet. Add one to assign delivery areas.'}
        </div>
      )}

      {!list.isLoading && !list.isError && visibleDrivers.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--blk3)',
            borderRadius: 'var(--radius-12)',
            border: '1px solid var(--border-ui)',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: DRIVER_COLUMNS,
              gap: 'var(--space-12)',
              padding: 'var(--space-12) var(--space-20)',
              borderBottom: '1px solid var(--border-ui)',
              fontSize: 'var(--text-12)',
              color: 'var(--soft)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              minWidth: '760px',
            }}
          >
            <span>Driver</span>
            <span>Phone</span>
            <span>Areas</span>
            <span>Status</span>
            <span />
          </div>
          {visibleDrivers.map((driver) => (
            <DriverRow
              key={driver.id}
              driver={driver}
              areaLabels={driverAreaLabels(driver, areaNameById)}
              onEdit={() => {
                setErrorMsg(null);
                setFormError(null);
                setCreating(false);
                setEditingId(driver.id);
              }}
              onDelete={() => {
                setErrorMsg(null);
                setDeleteTarget(driver);
              }}
            />
          ))}
        </div>
      )}

      {creating && (
        <DriverFormSheet
          mode="create"
          driver={null}
          areas={areas}
          areasLoading={areasQuery.isLoading}
          areasError={
            areasQuery.isError ? messageFrom(areasQuery.error, 'Failed to load areas.') : null
          }
          serverError={formError}
          isPending={isSaving}
          onClose={closeEditor}
          onSubmit={handleSubmit}
        />
      )}

      {editingId && !detail.data && detail.isLoading && (
        <FetchNotice message="Loading driver…" onClose={closeEditor} />
      )}
      {editingId && !detail.data && detail.isError && (
        <FetchNotice
          message={messageFrom(detail.error, 'Failed to load driver.')}
          onClose={closeEditor}
        />
      )}
      {editingId && detail.data && (
        <DriverFormSheet
          key={detail.data.id}
          mode="edit"
          driver={detail.data}
          areas={areas}
          areasLoading={areasQuery.isLoading}
          areasError={
            areasQuery.isError ? messageFrom(areasQuery.error, 'Failed to load areas.') : null
          }
          serverError={formError}
          isPending={isSaving}
          onClose={closeEditor}
          onSubmit={handleSubmit}
        />
      )}

      {deleteTarget && (
        <DeleteDriverDialog
          driver={deleteTarget}
          isPending={deleteDriver.isPending}
          onCancel={() => {
            if (!deleteDriver.isPending) setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function DriverRow({
  driver,
  areaLabels,
  onEdit,
  onDelete,
}: {
  driver: Driver;
  areaLabels: string[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: DRIVER_COLUMNS,
        gap: 'var(--space-12)',
        padding: 'var(--space-16) var(--space-20)',
        borderBottom: '1px solid var(--surface)',
        alignItems: 'center',
        fontSize: 'var(--text-14)',
        minWidth: '760px',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--white)' }}>{driver.fullName || '—'}</div>
      <span dir="ltr" style={{ color: 'var(--text-3)' }}>
        {driver.phone || '—'}
      </span>
      <span style={{ color: areaLabels.length ? 'var(--text-3)' : 'var(--mid)' }}>
        {areaLabels.length ? areaLabels.join(', ') : 'Unassigned'}
      </span>
      <span
        style={{
          color: driver.isActive ? 'var(--grn)' : 'var(--mid)',
          fontWeight: 600,
          fontSize: 'var(--text-13)',
        }}
      >
        {driver.isActive ? 'Active' : 'Inactive'}
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-8)', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn-ghost"
          style={{
            padding: 'var(--space-6) var(--space-10)',
            fontSize: 'var(--text-13)',
            border: '1px solid var(--border-ui)',
          }}
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn-ghost"
          style={{
            padding: 'var(--space-6) var(--space-10)',
            fontSize: 'var(--text-13)',
            color: 'var(--text-err)',
            border: '1px solid var(--danger-a30)',
          }}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function FetchNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="presentation"
      onClick={onClose}
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
        role="status"
        onClick={(event) => event.stopPropagation()}
        style={{
          backgroundColor: 'var(--blk3)',
          width: '100%',
          maxWidth: '600px',
          borderRadius: 'var(--radius-24) var(--radius-24) 0 0',
          borderTop: '1px solid var(--border-ui)',
          padding: 'var(--space-32)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-16)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--soft)', fontSize: 'var(--text-14)' }}>{message}</p>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function Banner({
  tone,
  onDismiss,
  children,
}: {
  tone: 'success' | 'error';
  onDismiss: () => void;
  children: ReactNode;
}) {
  const isError = tone === 'error';
  return (
    <div
      style={{
        backgroundColor: isError ? 'rgba(220,38,38,0.1)' : 'rgba(0, 200, 150, 0.1)',
        border: isError ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(0, 200, 150, 0.3)',
        borderRadius: 'var(--radius-8)',
        padding: 'var(--space-12) var(--space-16)',
        color: isError ? 'var(--text-err)' : '#6EE7B7',
        fontSize: 'var(--text-14)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-12)',
      }}
    >
      <span>{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--soft)',
          cursor: 'pointer',
          fontSize: 'var(--text-18)',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
