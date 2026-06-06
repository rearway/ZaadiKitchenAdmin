import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAreas } from '@/features/areas/api/areas.queries';
import {
  type AreaStatus,
  AREA_STATUS_LABEL,
  AREA_STATUS_COLOR,
} from '@/features/areas/model/areas.schema';

type Filter = 'All' | AreaStatus;

export default function AreaManagement() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('All');
  const { data: areas = [], isLoading, isError, error } = useAreas();

  const filteredAreas = areas.filter((a) => filter === 'All' || a.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Delivery Zones
        </h1>
      </div>

      {/* Filters */}
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

      {/* Area List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAreas.map((area) => {
          const statusColor = AREA_STATUS_COLOR[area.status];
          const statusLabel = AREA_STATUS_LABEL[area.status];
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
                  <span style={{ color: '#FFF', fontSize: '13px', fontWeight: 600 }}>
                    {area.buildings_count ?? 0} buildings registered
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-ghost"
                  style={{ border: '1px solid #333', padding: '8px 16px' }}
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
                    }}
                  >
                    ⏸ Pause
                  </button>
                )}

                {area.status === 'coming_soon' && (
                  <button className="btn-primary" style={{ padding: '8px 16px' }}>
                    ▶ Activate
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
    </div>
  );
}
