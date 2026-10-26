import { useMemo, useState, type ReactNode } from 'react';
import { useAreas } from '@/features/areas';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { ApiError } from '@/shared/types/api';
import AssignDriverAreaDialog from '../components/AssignDriverAreaDialog';
import DeleteDriverDialog from '../components/DeleteDriverDialog';
import DriverDeliveriesPanel from '../components/DriverDeliveriesPanel';
import DriverFormSheet from '../components/DriverFormSheet';
import {
  useAssignDriverArea,
  useCreateDriver,
  useDeleteDriver,
  useDriver,
  useDrivers,
  useUnassignedDriverAreas,
  useUpdateDriver,
} from '../api/drivers.queries';
import {
  areaAssignErrorMessage,
  formatOpsDayLabel,
  todayKsa,
  unassignedAreas,
  type AreaChoice,
} from '../model/driver-deliveries.schema';
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
  const [deliveryDate, setDeliveryDate] = useState(todayKsa);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<Driver | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const list = useDrivers();
  const detail = useDriver(editingId);
  const areasQuery = useAreas();
  const unassignedQuery = useUnassignedDriverAreas();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const deleteDriver = useDeleteDriver();
  const assignArea = useAssignDriverArea();

  const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data]);
  const areaNameById = useMemo(
    () => new Map((areasQuery.data ?? []).map((area) => [area.id, area.name])),
    [areasQuery.data]
  );

  const drivers = useMemo(() => list.data?.drivers ?? [], [list.data]);
  const visibleDrivers = useMemo(
    () => filterDrivers(list.data?.drivers ?? [], debouncedQ),
    [list.data, debouncedQ]
  );
  const areaChoices = useMemo<AreaChoice[]>(
    () => areas.map((area) => ({ id: area.id, name: area.name })),
    [areas]
  );
  const freeAreas = useMemo(() => {
    if (unassignedQuery.data?.available) return unassignedQuery.data.areas;
    return unassignedAreas(areaChoices, drivers);
  }, [unassignedQuery.data, areaChoices, drivers]);
  const takenAreaIds = useMemo(() => {
    const ownAreas = editingId
      ? (drivers.find((driver) => driver.id === editingId)?.areas ?? [])
      : [];
    const ownIds = new Set(ownAreas.map((area) => area.id));
    if (unassignedQuery.data?.available) {
      const freeIds = new Set(unassignedQuery.data.areas.map((area) => area.id));
      const taken = new Set<string>();
      for (const area of areas) {
        if (!freeIds.has(area.id) && !ownIds.has(area.id)) taken.add(area.id);
      }
      return taken;
    }
    const taken = new Set<string>();
    for (const driver of drivers) {
      if (editingId && driver.id === editingId) continue;
      for (const area of driver.areas) taken.add(area.id);
    }
    return taken;
  }, [unassignedQuery.data, areas, drivers, editingId]);
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
      const conflict = areaAssignErrorMessage(err);
      const message = conflict ?? messageFrom(err, 'Failed to save driver.');
      setFormError(message);
      if (conflict) setErrorMsg(message);
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

  const handleAssign = (areaId: string) => {
    if (!assignFor) return;
    setAssignError(null);
    setErrorMsg(null);
    const driver = assignFor;
    assignArea.mutate(
      { driverId: driver.id, areaId },
      {
        onSuccess: () => {
          const areaName = freeAreas.find((area) => area.id === areaId)?.name ?? 'Area';
          const driverName = driver.fullName || driver.phone;
          setSuccessMsg(`${areaName} assigned to ${driverName}.`);
          setAssignFor(null);
          setAssignError(null);
        },
        onError: (err) => {
          const conflict = areaAssignErrorMessage(err);
          const message = conflict ?? messageFrom(err, 'Failed to assign area.');
          setAssignError(message);
          setErrorMsg(message);
        },
      }
    );
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

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-12)',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search drivers"
          style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--blk3)' }}
        />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-8)',
            color: 'var(--soft)',
            fontSize: 'var(--text-14)',
          }}
        >
          <span>Delivery date</span>
          <input
            type="date"
            className="drivers-date-input"
            value={deliveryDate}
            aria-label="Delivery date"
            onChange={(event) => setDeliveryDate(event.target.value || todayKsa())}
          />
          <span>{formatOpsDayLabel(deliveryDate)}</span>
        </label>
      </div>

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
              isExpanded={expandedId === driver.id}
              deliveryDate={deliveryDate}
              onToggle={() => setExpandedId(expandedId === driver.id ? null : driver.id)}
              onAssign={() => {
                setAssignError(null);
                setErrorMsg(null);
                setAssignFor(driver);
              }}
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
          takenAreaIds={takenAreaIds}
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
          takenAreaIds={takenAreaIds}
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

      {assignFor && (
        <AssignDriverAreaDialog
          driverName={assignFor.fullName || assignFor.phone || 'this driver'}
          areas={freeAreas}
          isLoading={areasQuery.isLoading && !unassignedQuery.data}
          error={assignError}
          isPending={assignArea.isPending}
          onClose={() => {
            if (!assignArea.isPending) {
              setAssignFor(null);
              setAssignError(null);
            }
          }}
          onAssign={handleAssign}
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
  isExpanded,
  deliveryDate,
  onToggle,
  onAssign,
  onEdit,
  onDelete,
}: {
  driver: Driver;
  areaLabels: string[];
  isExpanded: boolean;
  deliveryDate: string;
  onToggle: () => void;
  onAssign: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--surface)',
        borderInlineStart: isExpanded ? '4px solid var(--danger)' : '4px solid transparent',
        minWidth: '760px',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: DRIVER_COLUMNS,
          gap: 'var(--space-12)',
          padding: 'var(--space-16) var(--space-20)',
          alignItems: 'center',
          fontSize: 'var(--text-14)',
          cursor: 'pointer',
          backgroundColor: isExpanded ? 'var(--surface)' : 'transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-8)',
            fontWeight: 600,
            color: 'var(--white)',
          }}
        >
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} deliveries for ${driver.fullName || driver.phone || 'driver'}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--soft)',
              transform: isExpanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
              fontSize: 'var(--text-12)',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ▶
          </button>
          <span>{driver.fullName || '—'}</span>
        </div>
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
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
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
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      </div>
      {isExpanded && (
        <DriverDeliveriesPanel driverId={driver.id} date={deliveryDate} onAssign={onAssign} />
      )}
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
      role={isError ? 'alert' : 'status'}
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
