import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBuildings, useAddBuilding, useUpdateBuilding, useDeleteBuilding } from '@/features/areas/api/areas.queries';
import { useAreas } from '@/features/areas/api/areas.queries';

export default function BuildingManagement() {
  const { areaId = '' } = useParams<{ areaId: string }>();
  const navigate = useNavigate();

  const { data: areas = [] } = useAreas();
  const area = areas.find((a) => a.id === areaId);
  const areaName = area?.name ?? 'Unknown Area';

  const { data: buildings = [], isLoading, isError } = useBuildings(areaId);
  const addBuilding = useAddBuilding(areaId);
  const updateBuilding = useUpdateBuilding(areaId);
  const deleteBuilding = useDeleteBuilding(areaId);

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setErrorMsg(null);
    addBuilding.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setNewName('');
          setAddingNew(false);
        },
        onError: (err) =>
          setErrorMsg(err instanceof Error ? err.message : 'Failed to add building'),
      },
    );
  };

  const handleEditSave = (buildingId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setErrorMsg(null);
    updateBuilding.mutate(
      { buildingId, name: trimmed },
      {
        onSuccess: () => setEditingId(null),
        onError: (err) =>
          setErrorMsg(err instanceof Error ? err.message : 'Failed to update building'),
      },
    );
  };

  const handleDelete = (buildingId: string) => {
    setErrorMsg(null);
    deleteBuilding.mutate(buildingId, {
      onSuccess: () => setConfirmDeleteId(null),
      onError: (err) => {
        setConfirmDeleteId(null);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to delete building');
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-ghost"
            style={{ padding: '8px 12px' }}
            onClick={() => navigate('/areas')}
          >
            ←
          </button>
          <h1 style={{ fontSize: '28px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
            Buildings — {areaName}
          </h1>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '8px 20px' }}
          onClick={() => {
            setAddingNew(true);
            setEditingId(null);
            setConfirmDeleteId(null);
          }}
        >
          + Add Building
        </button>
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

      <div
        style={{
          backgroundColor: 'rgba(228,40,29,0.07)',
          border: '1px solid rgba(228,40,29,0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#F87171',
          lineHeight: 1.5,
        }}
      >
        ℹ️ Only admin-added buildings appear in the customer auto-suggest. Customer free-text
        entries are not stored here and are never added automatically.
      </div>

      {addingNew && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #444',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setAddingNew(false);
                setNewName('');
              }
            }}
            placeholder="Building name, e.g. Al Nakheel Tower, King Fahad Rd"
            style={{ flex: 1, backgroundColor: '#222', fontSize: '14px' }}
            disabled={addBuilding.isPending}
          />
          <button
            className="btn-primary"
            style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}
            onClick={handleAdd}
            disabled={addBuilding.isPending}
          >
            {addBuilding.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '8px 14px' }}
            onClick={() => {
              setAddingNew(false);
              setNewName('');
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
          Loading buildings…
        </div>
      )}
      {isError && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--danger)' }}>
          Failed to load buildings.
        </div>
      )}

      <div
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '12px',
          border: '1px solid #333',
          overflow: 'hidden',
        }}
      >
        {buildings.length === 0 && !addingNew && !isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
            No buildings added yet. Click "+ Add Building" to start.
          </div>
        ) : (
          buildings.map((building, index) => {
            const isEditPending =
              updateBuilding.isPending && updateBuilding.variables?.buildingId === building.id;
            const isDeletePending =
              deleteBuilding.isPending && deleteBuilding.variables === building.id;
            return (
              <div key={building.id}>
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: index < buildings.length - 1 ? '1px solid #2A2A2A' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: isDeletePending ? 0.4 : 1,
                  }}
                >
                  {editingId === building.id ? (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(building.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        style={{ flex: 1, backgroundColor: '#222', fontSize: '14px' }}
                        disabled={isEditPending}
                      />
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 16px', fontSize: '13px', opacity: isEditPending ? 0.6 : 1 }}
                        onClick={() => handleEditSave(building.id)}
                        disabled={isEditPending}
                      >
                        {isEditPending ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
                        {building.name}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                        onClick={() => {
                          setEditingId(building.id);
                          setEditName(building.name);
                          setConfirmDeleteId(null);
                          setAddingNew(false);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost"
                        style={{
                          padding: '6px 14px',
                          fontSize: '13px',
                          color: 'var(--danger)',
                          borderColor: 'rgba(220,38,38,0.3)',
                        }}
                        onClick={() => {
                          setConfirmDeleteId(building.id);
                          setEditingId(null);
                          setAddingNew(false);
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                {confirmDeleteId === building.id && (
                  <div
                    style={{
                      backgroundColor: 'rgba(220,38,38,0.06)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: '8px',
                      margin: '0 12px 12px',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--danger)',
                        marginBottom: '4px',
                      }}
                    >
                      Remove building?
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#F87171',
                        marginBottom: '10px',
                        lineHeight: 1.5,
                      }}
                    >
                      Existing customer addresses referencing this building are not affected.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '6px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: 'var(--danger)',
                          color: '#FFF',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: isDeletePending ? 0.6 : 1,
                        }}
                        disabled={isDeletePending}
                        onClick={() => handleDelete(building.id)}
                      >
                        {isDeletePending ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
