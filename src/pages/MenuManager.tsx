import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Dish = {
  id: string;
  name: string;
  type: 'Executive' | 'Salad';
  kcal: number;
  protein: number;
  starred: boolean;
  status: 'Active' | 'Draft';
};

const MOCK_LIBRARY: Dish[] = [
  {
    id: '1',
    name: 'Lemon Herb Grilled Chicken',
    type: 'Executive',
    kcal: 650,
    protein: 45,
    starred: true,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Mediterranean Quinoa Bowl',
    type: 'Salad',
    kcal: 420,
    protein: 18,
    starred: false,
    status: 'Active',
  },
  {
    id: '3',
    name: 'Spicy Beef Stir Fry',
    type: 'Executive',
    kcal: 710,
    protein: 52,
    starred: false,
    status: 'Draft',
  },
];

export default function MenuManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'planner' | 'library'>('planner');
  const [weekMeals, setWeekMeals] = useState<Record<string, Dish | null>>({
    MON: MOCK_LIBRARY[0],
    TUE: null,
    WED: null,
    THU: null,
    FRI: MOCK_LIBRARY[1],
  });

  const [assignModalOpen, setAssignModalOpen] = useState<string | null>(null);

  const missingDaysCount = Object.values(weekMeals).filter((v) => v === null).length;
  const canPublish = missingDaysCount === 0;

  const handleAssign = (day: string, dish: Dish) => {
    setWeekMeals({ ...weekMeals, [day]: dish });
    setAssignModalOpen(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Menu Manager
        </h1>

        <div
          style={{
            display: 'flex',
            backgroundColor: '#1A1A1A',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <TabButton active={activeTab === 'planner'} onClick={() => setActiveTab('planner')}>
            📅 Week Planner
          </TabButton>
          <TabButton active={activeTab === 'library'} onClick={() => setActiveTab('library')}>
            📚 Meal Library
          </TabButton>
        </div>
      </div>

      {activeTab === 'planner' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Week Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-ghost" style={{ padding: '8px 12px' }}>
              &lsaquo;
            </button>
            <div
              style={{
                backgroundColor: 'rgba(228,40,29,.10)',
                color: 'var(--err)',
                padding: '8px 16px',
                borderRadius: '16px',
                fontWeight: 600,
              }}
            >
              Apr 7 – Apr 11, 2025
            </div>
            <button className="btn-ghost" style={{ padding: '8px 12px' }}>
              &rsaquo;
            </button>
          </div>

          {/* Daily Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(weekMeals).map(([day, dish]) => (
              <div
                key={day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  backgroundColor: '#1A1A1A',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: '1px solid #333',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    color: day === 'MON' ? 'var(--err)' : '#9CA3AF',
                    fontWeight: day === 'MON' ? 'bold' : 'normal',
                  }}
                >
                  {day}
                </div>

                <div style={{ flex: 1 }}>
                  {dish ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #E4281D, #F5A623)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          {dish.type === 'Executive' ? '🍛' : '🥗'}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                            {dish.name}
                          </h4>
                          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                            {dish.type} · {dish.kcal} kcal
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '8px' }}
                          onClick={() => setAssignModalOpen(day)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: '8px', color: dish.starred ? 'var(--err)' : '#9CA3AF' }}
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setAssignModalOpen(day)}
                      style={{
                        border: '1px dashed #444',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--err)')}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = '#444')}
                    >
                      + Add meal
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Publish Block */}
          <div
            style={{
              marginTop: '16px',
              borderTop: '1px solid #333',
              paddingTop: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            {!canPublish && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 230, 66, 0.1)',
                  color: 'var(--err)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span> {missingDaysCount} days still need meals assigned before you can
                publish.
              </div>
            )}
            <button
              className={canPublish ? 'btn-primary' : 'btn-disabled'}
              style={{ padding: '12px 32px', fontSize: '16px' }}
              disabled={!canPublish}
            >
              📅 Publish Week's Menu
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', '🍛 Exec', '🥗 Salad', '🍗 Chicken', '🥩 Lamb'].map((filter, i) => (
              <button
                key={filter}
                style={{
                  backgroundColor: i === 0 ? '#333' : '#1A1A1A',
                  color: i === 0 ? '#FFF' : '#9CA3AF',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid #333',
                  fontSize: '14px',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_LIBRARY.map((dish) => (
              <div
                key={dish.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#1A1A1A',
                  borderRadius: '12px',
                  border: '1px solid #333',
                  opacity: dish.status === 'Draft' ? 0.5 : 1,
                }}
              >
                <span style={{ marginRight: '16px', color: dish.starred ? 'var(--err)' : '#444' }}>
                  {dish.starred ? '⭐' : '☆'}
                </span>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #E4281D, #F5A623)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginRight: '16px',
                  }}
                >
                  {dish.type === 'Executive' ? '🍛' : '🥗'}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{dish.name}</h4>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {dish.type} · {dish.kcal} kcal · {dish.protein}g protein
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor:
                        dish.status === 'Active' ? 'rgba(228,40,29,.10)' : 'transparent',
                      color: dish.status === 'Active' ? 'var(--err)' : '#6B7280',
                      border: dish.status === 'Draft' ? '1px solid #6B7280' : 'none',
                    }}
                  >
                    {dish.status}
                  </span>
                  <button className="btn-ghost" style={{ padding: '8px' }}>
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: '16px' }}
            onClick={() => navigate('/menu/add')}
          >
            + Add New Dish to Library
          </button>
        </div>
      )}

      {assignModalOpen && (
        <AssignDishModal
          day={assignModalOpen}
          library={MOCK_LIBRARY}
          weekMeals={weekMeals}
          onClose={() => setAssignModalOpen(null)}
          onAssign={(dish: Dish) => handleAssign(assignModalOpen, dish)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '14px',
        backgroundColor: active ? '#333' : 'transparent',
        color: active ? '#FFF' : '#9CA3AF',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function AssignDishModal({ day, library, weekMeals, onClose, onAssign }: any) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Dish | null>(null);

  // Check which dishes are already assigned to other days
  const assignedDishes = Object.entries(weekMeals).reduce((acc: any, [d, dish]: any) => {
    if (dish && d !== day) acc[dish.id] = d;
    return acc;
  }, {});

  const filtered = library.filter(
    (d: Dish) => d.name.toLowerCase().includes(search.toLowerCase()) && d.status === 'Active'
  );

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
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
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

        <h2 style={{ fontSize: '24px', fontFamily: 'Montserrat, sans-serif', marginBottom: '4px' }}>
          Assign Dish
        </h2>
        <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px' }}>
          {day}, Apr 2025 — choose from your active meal library
        </p>

        <input
          type="text"
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '24px' }}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '24px',
            paddingRight: '8px',
          }}
        >
          {filtered.map((dish: Dish) => {
            const usedDay = assignedDishes[dish.id];
            const isUsed = !!usedDay;
            return (
              <div
                key={dish.id}
                onClick={() => !isUsed && setSelected(dish)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${selected?.id === dish.id ? 'var(--err)' : '#333'}`,
                  backgroundColor: selected?.id === dish.id ? 'rgba(0, 200, 150, 0.05)' : '#222',
                  opacity: isUsed ? 0.45 : 1,
                  cursor: isUsed ? 'not-allowed' : 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #E4281D, #F5A623)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    marginRight: '16px',
                  }}
                >
                  {dish.type === 'Executive' ? '🍛' : '🥗'}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{dish.name}</h4>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {dish.type} · {dish.kcal} kcal
                  </div>
                </div>

                {isUsed ? (
                  <span style={{ color: 'var(--err)', fontSize: '13px', fontWeight: 600 }}>
                    Already used — {usedDay}
                  </span>
                ) : (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${selected?.id === dish.id ? 'var(--err)' : '#666'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selected?.id === dish.id && (
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--err)',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
          <button
            className="btn-ghost"
            style={{ flex: 1, backgroundColor: '#222' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2 }}
            disabled={!selected}
            onClick={() => selected && onAssign(selected)}
          >
            ✓ Assign {selected ? selected.name : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
