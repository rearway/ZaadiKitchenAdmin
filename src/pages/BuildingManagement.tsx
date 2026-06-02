import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type Building = {
  id: string;
  name: string;
};

const MOCK_BUILDINGS: Record<string, Building[]> = {
  '1': [
    { id: 'b1', name: 'Al Nakheel Tower, King Fahad Rd' },
    { id: 'b2', name: 'Nakheel Business Park Tower A' },
    { id: 'b3', name: 'Al Nakheel Plaza, Office Tower' },
  ],
  '2': [
    { id: 'b4', name: 'Olaya Tower B' },
    { id: 'b5', name: 'Kingdom Centre, Office Wing' },
    { id: 'b6', name: 'Al Faisaliah Tower' },
  ],
  '3': [],
  '4': [{ id: 'b7', name: 'Al Malaz Business Complex' }],
};

const AREA_NAMES: Record<string, string> = {
  '1': 'Al Nakheel',
  '2': 'Olaya Business District',
  '3': 'Al Zahra',
  '4': 'Al Malaz',
};

export default function BuildingManagement() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();

  const areaName = AREA_NAMES[areaId ?? ''] ?? 'Unknown Area';
  const [buildings, setBuildings] = useState<Building[]>(MOCK_BUILDINGS[areaId ?? ''] ?? []);

  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setBuildings([...buildings, { id: Date.now().toString(), name: trimmed }]);
    setNewName('');
    setAddingNew(false);
  };

  const handleEditSave = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setBuildings(buildings.map((b) => (b.id === id ? { ...b, name: trimmed } : b)));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setBuildings(buildings.filter((b) => b.id !== id));
    setConfirmDeleteId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="btn-ghost"
            style={{ padding: '8px 12px' }}
            onClick={() => navigate('/areas')}
          >
            &larr;
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

      {/* Info note */}
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

      {/* Add new building inline form */}
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
          />
          <button
            className="btn-primary"
            style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}
            onClick={handleAdd}
          >
            Save
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

      {/* Building list */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '12px',
          border: '1px solid #333',
          overflow: 'hidden',
        }}
      >
        {buildings.length === 0 && !addingNew ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
            No buildings added yet. Click "+ Add Building" to start.
          </div>
        ) : (
          buildings.map((building, index) => (
            <div key={building.id}>
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: index < buildings.length - 1 ? '1px solid #2A2A2A' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
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
                    />
                    <button
                      className="btn-primary"
                      style={{ padding: '6px 16px', fontSize: '13px' }}
                      onClick={() => handleEditSave(building.id)}
                    >
                      Save
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

              {/* Inline delete confirmation */}
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
                      }}
                      onClick={() => handleDelete(building.id)}
                    >
                      Confirm delete
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
          ))
        )}
      </div>
    </div>
  );
}
