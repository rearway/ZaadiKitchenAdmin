import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAreas, useUpdateArea, useBuildings } from '@/features/areas/api/areas.queries';
import {
  type Area,
  type AreaStatus,
  AREA_STATUS_LABEL,
  AREA_STATUS_COLOR,
} from '@/features/areas/model/areas.schema';

type Filter = 'All' | AreaStatus;

export default function AreaManagement() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('All');
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: areas = [], isLoading, isError, error } = useAreas();
  const updateArea = useUpdateArea();

  const filteredAreas = areas.filter((a) => filter === 'All' || a.status === filter);

  const handleStatusChange = (area: Area, status: AreaStatus) => {
    setErrorMsg(null);
    updateArea.mutate(
      { areaId: area.id, input: { status } },
      {
        onError: (err) =>
          setErrorMsg(err instanceof Error ? err.message : 'Failed to update area status'),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Delivery Zones
        </h1>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#F87171',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠ {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {(['All', 'active', 'coming_soon', 'paused'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              backgroundColor: filter === f ? '#333' : '#1A1A1A',
              color: filter === f ? '#FFF' : '#9CA3AF',
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #333',
              fontSize: '14px',
            }}
          >
            {f === 'All' ? 'All' : AREA_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {isLoading && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
          Loading areas…
        </div>
      )}
      {isError && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
          {error instanceof Error ? error.message : 'Failed to load areas. Please try again.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAreas.map((area) => {
          const statusColor = AREA_STATUS_COLOR[area.status];
          const statusLabel = AREA_STATUS_LABEL[area.status];
          const isPendingStatus =
            updateArea.isPending && updateArea.variables?.areaId === area.id;
          return (
            <div
              key={area.id}
              style={{
                backgroundColor: '#1A1A1A',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #333',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: statusColor,
                      }}
                    />
                    <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{area.name}</h3>
                  </div>
                  <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
                    {area.description ?? '—'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#222',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ color: statusColor, fontWeight: 600, fontSize: '13px' }}>
                    ● {statusLabel}
                  </span>
                  <span style={{ color: '#6B7280' }}>|</span>
                  <AreaBuildingCount areaId={area.id} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-ghost"
                  style={{ border: '1px solid #333', padding: '8px 16px' }}
                  onClick={() => setEditArea(area)}
                >
                  ✏️ Edit
                </button>

                {area.status === 'active' && (
                  <button
                    className="btn-ghost"
                    style={{
                      backgroundColor: 'rgba(255, 115, 64, 0.1)',
                      color: 'var(--danger)',
                      padding: '8px 16px',
                      opacity: isPendingStatus ? 0.5 : 1,
                    }}
                    disabled={isPendingStatus}
                    onClick={() => handleStatusChange(area, 'paused')}
                  >
                    {isPendingStatus ? '…' : '⏸ Pause'}
                  </button>
                )}

                {area.status === 'paused' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', opacity: isPendingStatus ? 0.5 : 1 }}
                    disabled={isPendingStatus}
                    onClick={() => handleStatusChange(area, 'active')}
                  >
                    {isPendingStatus ? '…' : '▶ Activate'}
                  </button>
                )}

                {area.status === 'coming_soon' && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', opacity: isPendingStatus ? 0.5 : 1 }}
                    disabled={isPendingStatus}
                    onClick={() => handleStatusChange(area, 'active')}
                  >
                    {isPendingStatus ? '…' : '▶ Activate'}
                  </button>
                )}

                <button
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => navigate(`/areas/${area.id}/buildings`)}
                >
                  🏢 Buildings →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-primary"
        style={{ alignSelf: 'flex-start', marginTop: '8px' }}
        onClick={() => navigate('/areas/new')}
      >
        + Add New Area
      </button>

      {editArea && (
        <EditAreaModal
          area={editArea}
          isPending={updateArea.isPending}
          onClose={() => setEditArea(null)}
          onSave={(input) => {
            setErrorMsg(null);
            updateArea.mutate(
              { areaId: editArea.id, input },
              {
                onSuccess: () => setEditArea(null),
                onError: (err) =>
                  setErrorMsg(err instanceof Error ? err.message : 'Failed to update area'),
              },
            );
          }}
        />
      )}
    </div>
  );
}

function AreaBuildingCount({ areaId }: { areaId: string }) {
  const { data: buildings = [], isLoading } = useBuildings(areaId);
  return (
    <span style={{ color: '#FFF', fontSize: '13px', fontWeight: 600 }}>
      {isLoading ? '…' : `${buildings.length} building${buildings.length !== 1 ? 's' : ''} registered`}
    </span>
  );
}

function EditAreaModal({
  area,
  isPending,
  onClose,
  onSave,
}: {
  area: Area;
  isPending: boolean;
  onClose: () => void;
  onSave: (input: { name?: string; status?: AreaStatus }) => void;
}) {
  const [name, setName] = useState(area.name);
  const [status, setStatus] = useState<AreaStatus>(area.status);

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#222',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#FFF',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9CA3AF',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div
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
        style={{
          backgroundColor: '#1A1A1A',
          width: '100%',
          maxWidth: '600px',
          borderRadius: '24px 24px 0 0',
          padding: '32px',
          position: 'relative',
          borderTop: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#444',
            borderRadius: '2px',
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />

        <h2 style={{ fontSize: '22px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Edit Area
        </h2>

        <div>
          <label style={labelStyle}>Area Name *</label>
          <input
            style={fieldStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Al Nakheel"
          />
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['active', 'coming_soon', 'paused'] as AreaStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: '8px',
                  border: `1px solid ${status === s ? AREA_STATUS_COLOR[s] : '#444'}`,
                  backgroundColor: status === s ? 'rgba(228,40,29,.08)' : '#222',
                  color: status === s ? AREA_STATUS_COLOR[s] : '#9CA3AF',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {AREA_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            className="btn-ghost"
            style={{ flex: 1, backgroundColor: '#222' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2, opacity: isPending ? 0.7 : 1 }}
            disabled={!name.trim() || isPending}
            onClick={() => onSave({ name: name.trim(), status })}
          >
            {isPending ? 'Saving…' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
