import { useMemo, useState, type ReactNode } from 'react';
import { useAreas } from '@/features/areas';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { ApiError } from '@/shared/types/api';
import DeleteDriverDialog from '../components/DeleteDriverDialog';
import DriverFormSheet from '../components/DriverFormSheet';
import {
  useCreateDriver,
  useDeleteDriver,
  useDrivers,
  useUpdateDriver,
} from '../api/drivers.queries';
import {
  driverAreaLabels,
  driverLanguageLabel,
  type Driver,
  type DriverWriteInput,
} from '../model/drivers.schema';

type Editor = { mode: 'create' } | { mode: 'edit'; driver: Driver };

function messageFrom(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function DriversPage() {
  const [query, setQuery] = useState('');
  const debouncedQ = useDebouncedValue(query, 400);
  const [page, setPage] = useState(1);
  const [trackedQ, setTrackedQ] = useState(debouncedQ);
  if (trackedQ !== debouncedQ) {
    setTrackedQ(debouncedQ);
    setPage(1);
  }

  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const list = useDrivers({
    q: debouncedQ.trim() || undefined,
    page,
  });
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
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 1;
  const isSaving = createDriver.isPending || updateDriver.isPending;

  const handleSubmit = (input: DriverWriteInput) => {
    if (!editor) return;
    setErrorMsg(null);
    setFormError(null);
    const onSuccess = () => {
      setSuccessMsg(
        editor.mode === 'create' ? `${input.full_name} added.` : `${input.full_name} updated.`
      );
      setEditor(null);
    };
    const onError = (err: unknown) => {
      setFormError(messageFrom(err, 'Failed to save driver.'));
    };
    if (editor.mode === 'create') {
      createDriver.mutate(input, { onSuccess, onError });
      return;
    }
    updateDriver.mutate({ id: editor.driver.id, input }, { onSuccess, onError });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setErrorMsg(null);
    const name = deleteTarget.fullName || deleteTarget.phone;
    deleteDriver.mutate(deleteTarget.id, {
      onSuccess: () => {
        setSuccessMsg(`${name} deleted.`);
        setDeleteTarget(null);
        if (drivers.length === 1 && page > 1) setPage(page - 1);
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
            {!list.isLoading && total > 0 && (
              <span style={{ color: 'var(--soft)', fontSize: 'var(--text-20)' }}>
                {' '}
                · {total} total
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
            setEditor({ mode: 'create' });
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

      {!list.isLoading && !list.isError && drivers.length === 0 && (
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

      {!list.isLoading && !list.isError && drivers.length > 0 && (
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
              gridTemplateColumns:
                'minmax(160px, 1.3fr) minmax(150px, 1fr) minmax(180px, 1.6fr) 110px 100px 150px',
              gap: 'var(--space-12)',
              padding: 'var(--space-12) var(--space-20)',
              borderBottom: '1px solid var(--border-ui)',
              fontSize: 'var(--text-12)',
              color: 'var(--soft)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              minWidth: '820px',
            }}
          >
            <span>Driver</span>
            <span>Phone</span>
            <span>Areas</span>
            <span>Language</span>
            <span>Status</span>
            <span />
          </div>
          {drivers.map((driver) => (
            <DriverRow
              key={driver.id}
              driver={driver}
              areaLabels={driverAreaLabels(driver, areaNameById)}
              onEdit={() => {
                setErrorMsg(null);
                setFormError(null);
                setEditor({ mode: 'edit', driver });
              }}
              onDelete={() => {
                setErrorMsg(null);
                setDeleteTarget(driver);
              }}
            />
          ))}
        </div>
      )}

      {!list.isError && totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-12)',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: 'var(--space-6) var(--space-16)', opacity: page <= 1 ? 0.4 : 1 }}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 'var(--text-14)', color: 'var(--soft)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost"
            style={{
              padding: 'var(--space-6) var(--space-16)',
              opacity: page >= totalPages ? 0.4 : 1,
            }}
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {editor && (
        <DriverFormSheet
          key={editor.mode === 'edit' ? editor.driver.id : 'create'}
          mode={editor.mode}
          driver={editor.mode === 'edit' ? editor.driver : null}
          areas={areas}
          areasLoading={areasQuery.isLoading}
          areasError={
            areasQuery.isError ? messageFrom(areasQuery.error, 'Failed to load areas.') : null
          }
          serverError={formError}
          isPending={isSaving}
          onClose={() => {
            if (!isSaving) setEditor(null);
          }}
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
        gridTemplateColumns:
          'minmax(160px, 1.3fr) minmax(150px, 1fr) minmax(180px, 1.6fr) 110px 100px 150px',
        gap: 'var(--space-12)',
        padding: 'var(--space-16) var(--space-20)',
        borderBottom: '1px solid var(--surface)',
        alignItems: 'center',
        fontSize: 'var(--text-14)',
        minWidth: '820px',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--white)' }}>{driver.fullName || '—'}</div>
      <span dir="ltr" style={{ color: 'var(--text-3)' }}>
        {driver.phone}
      </span>
      <span style={{ color: areaLabels.length ? 'var(--text-3)' : 'var(--mid)' }}>
        {areaLabels.length ? areaLabels.join(', ') : 'Unassigned'}
      </span>
      <span>{driverLanguageLabel(driver.language)}</span>
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
