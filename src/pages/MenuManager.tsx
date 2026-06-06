import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeks, useWeekDetail, useMeals, useAssignSlot, useClearSlot, usePublishWeek, useUpdateMeal, useUpdateMealStatus } from '@/features/menu/api/menu.queries';
import type { Meal, MealType, Slot, Week } from '@/features/menu/model/menu.schema';
import { DAY_LABEL } from '@/features/menu/model/menu.schema';

type LibraryFilter = 'all' | 'executive' | 'salad';

export default function MenuManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'planner' | 'library'>('planner');
  const [weekIndex, setWeekIndex] = useState(0);
  const [assignModalSlot, setAssignModalSlot] = useState<Slot | null>(null);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');

  const { data: weeks = [], isLoading: weeksLoading } = useWeeks();
  const { data: meals = [], isLoading: mealsLoading } = useMeals();

  const currentWeek: Week | undefined = weeks[weekIndex];
  const { data: weekDetail, isLoading: slotsLoading } = useWeekDetail(currentWeek?.id ?? '');
  const publishWeek = usePublishWeek();
  const assignSlot = useAssignSlot(currentWeek?.id ?? '');
  const clearSlot = useClearSlot(currentWeek?.id ?? '');
  const updateMeal = useUpdateMeal();
  const updateMealStatus = useUpdateMealStatus();

  const filteredMeals = libraryFilter === 'all'
    ? meals
    : meals.filter((m) => m.meal_type === libraryFilter);

  const slots = weekDetail?.slots ?? [];
  const canPublish = weekDetail?.publishReady ?? false;

  const formatWeekRange = (week: Week) => {
    if (week.date_range) return week.date_range;
    if (!week.end_date) return week.start_date;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(week.start_date)} – ${fmt(week.end_date)}`;
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
            <button
              className="btn-ghost"
              style={{ padding: '8px 12px' }}
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
            >
              ‹
            </button>
            <div
              style={{
                backgroundColor: 'rgba(228,40,29,.10)',
                color: 'var(--danger)',
                padding: '8px 16px',
                borderRadius: '16px',
                fontWeight: 600,
              }}
            >
              {currentWeek ? formatWeekRange(currentWeek) : '…'}
            </div>
            <button
              className="btn-ghost"
              style={{ padding: '8px 12px' }}
              disabled={weekIndex >= weeks.length - 1}
              onClick={() => setWeekIndex((i) => Math.min(weeks.length - 1, i + 1))}
            >
              ›
            </button>
          </div>

          {(weeksLoading || slotsLoading) && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
              Loading week data…
            </div>
          )}

          {/* Daily Slots */}
          {!weeksLoading && !slotsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {slots.map((slot) => {
                const dayLabel = DAY_LABEL[slot.day] ?? slot.day.toUpperCase();
                const isFirst = slot.day === slots[0]?.day;
                return (
                  <div
                    key={slot.id}
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
                        color: isFirst ? 'var(--danger)' : '#9CA3AF',
                        fontWeight: isFirst ? 'bold' : 'normal',
                      }}
                    >
                      {dayLabel}
                    </div>

                    <div style={{ flex: 1 }}>
                      {slot.meal ? (
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
                              {slot.meal_type === 'executive' ? '🍛' : '🥗'}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                                {slot.meal.name_en}
                              </h4>
                              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                                {slot.meal_type === 'executive' ? 'Executive' : 'Salad'}
                                {slot.meal.kcal ? ` · ${slot.meal.kcal} kcal` : ''}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-ghost"
                              style={{ padding: '8px' }}
                              onClick={() => setAssignModalSlot(slot)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ padding: '8px', color: '#9CA3AF' }}
                              onClick={() => clearSlot.mutate(slot.id)}
                              disabled={clearSlot.isPending}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setAssignModalSlot(slot)}
                          style={{
                            border: '1px dashed #444',
                            borderRadius: '8px',
                            padding: '16px',
                            textAlign: 'center',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--danger)')}
                          onMouseOut={(e) => (e.currentTarget.style.borderColor = '#444')}
                        >
                          + Add meal
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
            {!canPublish && weekDetail?.publishBlockedReason && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 230, 66, 0.1)',
                  color: 'var(--danger)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>⚠️</span> {weekDetail.publishBlockedReason}
              </div>
            )}
            <button
              className="btn-primary"
              style={{ padding: '12px 32px', fontSize: '16px', opacity: publishWeek.isPending ? 0.7 : 1 }}
              disabled={publishWeek.isPending}
              onClick={() => currentWeek && publishWeek.mutate(currentWeek.id)}
            >
              {publishWeek.isPending ? 'Publishing…' : "📅 Publish Week's Menu"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {([['all', 'All'], ['executive', '🍛 Exec'], ['salad', '🥗 Salad']] as [LibraryFilter, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() => setLibraryFilter(value)}
                  style={{
                    backgroundColor: libraryFilter === value ? '#333' : '#1A1A1A',
                    color: libraryFilter === value ? '#FFF' : '#9CA3AF',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${libraryFilter === value ? '#555' : '#333'}`,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          {mealsLoading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
              Loading meals…
            </div>
          )}

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredMeals.map((meal) => {
              const isStatusPending =
                updateMealStatus.isPending && updateMealStatus.variables?.id === meal.id;
              return (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    opacity: meal.status === 'draft' ? 0.6 : 1,
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
                      flexShrink: 0,
                    }}
                  >
                    {meal.meal_type === 'executive' ? '🍛' : '🥗'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{meal.name_en}</h4>
                    <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                      {meal.meal_type === 'executive' ? 'Executive' : 'Salad'}
                      {meal.kcal ? ` · ${meal.kcal} kcal` : ''}
                      {meal.macros ? ` · ${meal.macros.protein_g}g protein` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor:
                          meal.status === 'active' ? 'rgba(228,40,29,.10)' : 'transparent',
                        color: meal.status === 'active' ? 'var(--danger)' : '#6B7280',
                        border: meal.status === 'draft' ? '1px solid #444' : 'none',
                      }}
                    >
                      {meal.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                    <button
                      className="btn-ghost"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setEditMeal(meal)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-ghost"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        opacity: isStatusPending ? 0.5 : 1,
                        color: meal.status === 'active' ? '#9CA3AF' : 'var(--danger)',
                      }}
                      disabled={isStatusPending}
                      onClick={() =>
                        updateMealStatus.mutate({
                          id: meal.id,
                          status: meal.status === 'active' ? 'draft' : 'active',
                        })
                      }
                    >
                      {isStatusPending
                        ? '…'
                        : meal.status === 'active'
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
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

      {assignModalSlot && currentWeek && (
        <AssignDishModal
          slot={assignModalSlot}
          library={meals.filter((m) => m.status === 'active')}
          weekSlots={slots}
          isPending={assignSlot.isPending}
          onClose={() => setAssignModalSlot(null)}
          onAssign={(meal: Meal) => {
            assignSlot.mutate(
              { slotId: assignModalSlot.id, mealId: meal.id },
              { onSuccess: () => setAssignModalSlot(null) },
            );
          }}
        />
      )}

      {editMeal && (
        <EditMealModal
          meal={editMeal}
          isPending={updateMeal.isPending}
          onClose={() => setEditMeal(null)}
          onSave={(input) => {
            updateMeal.mutate(
              { id: editMeal.id, input },
              { onSuccess: () => setEditMeal(null) },
            );
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
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

function AssignDishModal({
  slot,
  library,
  weekSlots,
  isPending,
  onClose,
  onAssign,
}: {
  slot: Slot;
  library: Meal[];
  weekSlots: Slot[];
  isPending: boolean;
  onClose: () => void;
  onAssign: (meal: Meal) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Meal | null>(null);

  const assignedMealIds = new Set(
    weekSlots.filter((s) => s.id !== slot.id && s.meal).map((s) => s.meal!.id),
  );

  const filtered = library.filter((m) =>
    m.name_en.toLowerCase().includes(search.toLowerCase()),
  );

  const dayLabel = DAY_LABEL[slot.day] ?? slot.day.toUpperCase();

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
          {dayLabel} — choose from your active meal library
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
          {filtered.map((meal) => {
            const isUsed = assignedMealIds.has(meal.id);
            return (
              <div
                key={meal.id}
                onClick={() => setSelected(meal)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${selected?.id === meal.id ? 'var(--danger)' : '#333'}`,
                  backgroundColor: selected?.id === meal.id ? 'rgba(0, 200, 150, 0.05)' : '#222',
                  cursor: 'pointer',
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
                  {meal.meal_type === 'executive' ? '🍛' : '🥗'}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{meal.name_en}</h4>
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {meal.meal_type === 'executive' ? 'Executive' : 'Salad'}
                    {meal.kcal ? ` · ${meal.kcal} kcal` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isUsed && (
                    <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 600 }}>
                      Used
                    </span>
                  )}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${selected?.id === meal.id ? 'var(--danger)' : '#666'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selected?.id === meal.id && (
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--danger)',
                        }}
                      />
                    )}
                  </div>
                </div>
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
            style={{ flex: 2, opacity: isPending ? 0.7 : 1 }}
            disabled={!selected || isPending}
            onClick={async () => {
              if (selected) {
                await onAssign(selected); // <-- Waits for the assignment to complete
                onClose();                // <-- Closes only if successful
              }
            }}
          >
            {isPending ? 'Assigning…' : `✓ Assign ${selected ? selected.name_en : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMealModal({
  meal,
  isPending,
  onClose,
  onSave,
}: {
  meal: Meal;
  isPending: boolean;
  onClose: () => void;
  onSave: (input: { name_en?: string; name_ar?: string; meal_type?: MealType; kcal?: number; macros?: { protein_g: number; carbs_g: number; fat_g: number } }) => void;
}) {
  const [nameEn, setNameEn] = useState(meal.name_en);
  const [nameAr, setNameAr] = useState(meal.name_ar ?? '');
  const [mealType, setMealType] = useState<MealType>(meal.meal_type ?? 'executive');
  const [kcal, setKcal] = useState(meal.kcal?.toString() ?? '');
  const [proteinG, setProteinG] = useState(meal.macros?.protein_g.toString() ?? '');
  const [carbsG, setCarbsG] = useState(meal.macros?.carbs_g.toString() ?? '');
  const [fatG, setFatG] = useState(meal.macros?.fat_g.toString() ?? '');

  const handleSave = () => {
    if (!nameEn.trim()) return;
    const hasMacros = proteinG || carbsG || fatG;
    onSave({
      name_en: nameEn.trim(),
      name_ar: nameAr.trim() || undefined,
      meal_type: mealType,
      kcal: kcal ? Number(kcal) : undefined,
      macros: hasMacros
        ? {
            protein_g: Number(proteinG) || 0,
            carbs_g: Number(carbsG) || 0,
            fat_g: Number(fatG) || 0,
          }
        : undefined,
    });
  };

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
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
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
          Edit Meal
        </h2>

        <div>
          <label style={labelStyle}>Name (EN) *</label>
          <input
            style={fieldStyle}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Grilled Chicken"
          />
        </div>

        <div>
          <label style={labelStyle}>Name (AR)</label>
          <input
            style={{ ...fieldStyle, direction: 'rtl' }}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="الاسم بالعربية"
          />
        </div>

        <div>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['executive', 'salad'] as MealType[]).map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1px solid ${mealType === t ? 'var(--danger)' : '#444'}`,
                  backgroundColor: mealType === t ? 'rgba(228,40,29,.10)' : '#222',
                  color: mealType === t ? 'var(--danger)' : '#9CA3AF',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {t === 'executive' ? '🍛 Executive' : '🥗 Salad'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Calories (kcal)</label>
          <input
            style={fieldStyle}
            type="number"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="e.g. 450"
          />
        </div>

        <div>
          <label style={labelStyle}>Macros (g)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Protein</label>
              <input style={fieldStyle} type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Carbs</label>
              <input style={fieldStyle} type="number" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={{ ...labelStyle, fontSize: '11px' }}>Fat</label>
              <input style={fieldStyle} type="number" value={fatG} onChange={(e) => setFatG(e.target.value)} placeholder="0" />
            </div>
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
            disabled={!nameEn.trim() || isPending}
            onClick={handleSave}
          >
            {isPending ? 'Saving…' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
