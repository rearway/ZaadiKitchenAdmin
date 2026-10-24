import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useWeeks,
  useWeekDetail,
  useMeals,
  useMealDetail,
  useAssignableMeals,
  useAssignSlot,
  useAddDaySlot,
  useSetDayDefault,
  useClearSlot,
  usePublishWeek,
  useUnpublishWeek,
  useUpdateMeal,
  useUpdateMealStatus,
  usePhotoUpload,
} from '@/features/menu/api/menu.queries';
import MealRatingsPanel from '@/features/menu/components/MealRatingsPanel';
import WeekPlannerDay from '@/features/menu/components/WeekPlannerDay';
import type {
  Meal,
  MealLibraryStatusFilter,
  MealStatus,
  MealType,
  PlannerSlot,
  Week,
  WeekDetail,
} from '@/features/menu/model/menu.schema';
import {
  DAY_LABEL,
  SLOT_ERROR,
  WEEK_ERROR,
  classifyAssignError,
  findPlannerSlot,
  isWeekEditable,
  mealEditableFields,
  parseMealPublishedWeekConflict,
  toKeyIngredientsArray,
} from '@/features/menu/model/menu.schema';
import { queryKeys } from '@/shared/lib/api/queryKeys';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { ApiError } from '@/shared/types/api';

type MealTypeFilter = 'all' | 'executive' | 'salad';

type LiveMenuConfirm = {
  meal: Meal;
  targetStatus: 'active' | 'draft';
  message: string;
  affectedWeeks: string[];
};

function mealStatusLabel(status: MealStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'updated') return 'Updated';
  return 'Draft';
}

function mealStatusBadgeStyle(status: MealStatus): React.CSSProperties {
  if (status === 'active') {
    return { backgroundColor: 'rgba(228,40,29,.10)', color: 'var(--danger)', border: 'none' };
  }
  if (status === 'updated') {
    return {
      backgroundColor: 'var(--warn-a10)',
      color: 'var(--danger)',
      border: '1px solid rgba(245, 230, 66, 0.3)',
    };
  }
  return { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #444' };
}

const EMOJI_OPTIONS = ['🍛', '🥘', '🍗', '🥗', '🥙', '🍖'];
const ACCEPTED_PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

function withPhotoCacheBust(url: string, version: number) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${version}`;
}

/** Renders a meal's photo thumbnail, emoji, or a type-based fallback emoji. */
function MealIcon({
  meal,
  size = 40,
  photoCacheVersion,
}: {
  meal: Meal;
  size?: number;
  photoCacheVersion?: number;
}) {
  const fallback = meal.meal_type === 'executive' ? '🍛' : '🥗';
  if (meal.photo_url) {
    const src =
      photoCacheVersion != null
        ? withPhotoCacheBust(meal.photo_url, photoCacheVersion)
        : meal.photo_url;
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src={src}
          alt={meal.name_en}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #E4281D, #F5A623)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {meal.emoji ?? fallback}
    </div>
  );
}

export default function MenuManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'planner' | 'library'>('planner');
  const [weekIndex, setWeekIndex] = useState(0);
  const [assignModalSlot, setAssignModalSlot] = useState<PlannerSlot | null>(null);
  const [pendingAddKey, setPendingAddKey] = useState<string | null>(null);
  const qc = useQueryClient();
  const [editMealId, setEditMealId] = useState<string | null>(null);
  /** Bumps CDN photo URLs in the library after a successful upload (same path, new bytes). */
  const [mealPhotoCacheVersion, setMealPhotoCacheVersion] = useState<Record<string, number>>({});
  const [libraryStatusFilter, setLibraryStatusFilter] = useState<MealLibraryStatusFilter>('all');
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<MealTypeFilter>('all');
  const [confirmClearSlotId, setConfirmClearSlotId] = useState<string | null>(null);
  const [confirmStatusMealId, setConfirmStatusMealId] = useState<string | null>(null);
  const [expandedRatingsMealId, setExpandedRatingsMealId] = useState<string | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [liveMenuConfirm, setLiveMenuConfirm] = useState<LiveMenuConfirm | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [assignErrorMsg, setAssignErrorMsg] = useState<string | null>(null);

  const { data: weeks = [], isLoading: weeksLoading } = useWeeks();
  const { data: meals = [], isLoading: mealsLoading } = useMeals({
    status: libraryStatusFilter,
    meal_type: libraryTypeFilter === 'all' ? undefined : libraryTypeFilter,
  });

  const currentWeek: Week | undefined = weeks[weekIndex];
  const { data: weekDetail, isLoading: slotsLoading } = useWeekDetail(currentWeek?.id ?? '');
  const publishWeek = usePublishWeek();
  const unpublishWeek = useUnpublishWeek();
  const assignSlot = useAssignSlot(currentWeek?.id ?? '');
  const addDaySlot = useAddDaySlot(currentWeek?.id ?? '');
  const setDayDefault = useSetDayDefault(currentWeek?.id ?? '');
  const clearSlot = useClearSlot(currentWeek?.id ?? '');
  const updateMeal = useUpdateMeal();
  const updateMealStatus = useUpdateMealStatus();

  const plannerDays = weekDetail?.days ?? [];
  const canPublish = weekDetail?.publishReady ?? false;
  const canEditWeek = isWeekEditable(weekDetail);

  const openAssignModal = (slot: PlannerSlot) => {
    setConfirmClearSlotId(null);
    setAssignErrorMsg(null);
    setAssignModalSlot(slot);
  };

  const closeAssignModal = () => {
    setAssignModalSlot(null);
    setAssignErrorMsg(null);
  };

  const handleAssign = (slotId: string, meal: Meal) => {
    setErrorMsg(null);
    setAssignErrorMsg(null);
    assignSlot.mutate(
      { slotId, meal },
      {
        onSuccess: closeAssignModal,
        onError: (err) => {
          const assignError = classifyAssignError(err);
          if (assignError.kind === 'day_meal_type_limit' || assignError.kind === 'meal_is_draft') {
            setAssignErrorMsg(assignError.message);
            return;
          }
          closeAssignModal();
          setErrorMsg(assignError.message);
        },
      },
    );
  };

  const handleAddSlot = (deliveryDate: string, mealType: MealType) => {
    if (!currentWeek) return;
    setErrorMsg(null);
    const key = `${deliveryDate}-${mealType}`;
    setPendingAddKey(key);
    addDaySlot.mutate(
      { deliveryDate, meal_type: mealType },
      {
        onSuccess: async (res) => {
          setPendingAddKey(null);
          await qc.refetchQueries({ queryKey: queryKeys.menu.weekDetail(currentWeek.id) });
          if (!res.meal) {
            const detail = qc.getQueryData<WeekDetail>(queryKeys.menu.weekDetail(currentWeek.id));
            const slot = detail ? findPlannerSlot(detail, res.slot_id) : undefined;
            if (slot) openAssignModal(slot);
          }
        },
        onError: (err) => {
          setPendingAddKey(null);
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to add slot');
        },
      },
    );
  };

  const handleSetDefault = (slot: PlannerSlot) => {
    if (!currentWeek || !slot.meal?.id || !slot.delivery_date) return;
    setErrorMsg(null);
    setDayDefault.mutate(
      {
        deliveryDate: slot.delivery_date,
        meal_type: slot.meal_type,
        meal_id: slot.meal.id,
      },
      {
        onError: (err) => {
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to set default dish');
        },
      },
    );
  };

  const formatWeekRange = (week: Week) => {
    if (week.date_range) return week.date_range;
    if (!week.end_date) return week.start_date;
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(week.start_date)} – ${fmt(week.end_date)}`;
  };

  const handleClearSlot = (slotId: string) => {
    setErrorMsg(null);
    clearSlot.mutate(slotId, {
      onSuccess: () => setConfirmClearSlotId(null),
      onError: (err) => {
        setConfirmClearSlotId(null);
        if (err instanceof ApiError && err.errorCode === SLOT_ERROR.CANNOT_CLEAR_DEFAULT) {
          setErrorMsg(
            err.message || 'Set another default dish on this stream first, then clear this slot.',
          );
          return;
        }
        setErrorMsg(err instanceof Error ? err.message : 'Failed to clear slot');
      },
    });
  };

  const requestMealStatusChange = (
    meal: Meal,
    targetStatus: 'active' | 'draft',
    confirmPublishedEdit?: boolean,
  ) => {
    setErrorMsg(null);
    updateMealStatus.mutate(
      { id: meal.id, status: targetStatus, confirmPublishedEdit },
      {
        onSuccess: () => {
          setConfirmStatusMealId(null);
          setLiveMenuConfirm(null);
        },
        onError: (err) => {
          setConfirmStatusMealId(null);
          const conflict = parseMealPublishedWeekConflict(err);
          if (conflict) {
            setLiveMenuConfirm({
              meal,
              targetStatus,
              message: conflict.message,
              affectedWeeks: conflict.affectedWeeks,
            });
            return;
          }
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to update meal status');
        },
      },
    );
  };

  const handleStatusChange = (meal: Meal) => {
    const targetStatus: 'active' | 'draft' =
      meal.status === 'active' || meal.status === 'updated' ? 'draft' : 'active';
    requestMealStatusChange(meal, targetStatus);
  };

  const handleActivateUpdated = (meal: Meal) => {
    requestMealStatusChange(meal, 'active');
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
              {currentWeek?.fill_status?.label && (
                <span style={{ fontSize: '12px', color: '#9CA3AF', paddingInlineStart: '4px' }}>
                  {currentWeek.fill_status.label}
                </span>
              )}
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

          {!weeksLoading && !slotsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {plannerDays.map((day) => (
                <WeekPlannerDay
                  key={day.delivery_date}
                  day={day}
                  canEditWeek={canEditWeek}
                  confirmClearSlotId={confirmClearSlotId}
                  clearPendingSlotId={clearSlot.isPending ? clearSlot.variables ?? null : null}
                  highlightSlotId={null}
                  mealPhotoCacheVersion={mealPhotoCacheVersion}
                  MealIcon={MealIcon}
                  onOpenAssign={openAssignModal}
                  onRequestClear={(slotId) =>
                    setConfirmClearSlotId(confirmClearSlotId === slotId ? null : slotId)
                  }
                  onConfirmClear={handleClearSlot}
                  onCancelClear={() => setConfirmClearSlotId(null)}
                  onSetDefault={handleSetDefault}
                  onAddSlot={handleAddSlot}
                  pendingAddKey={pendingAddKey}
                  setDefaultPending={setDayDefault.isPending}
                />
              ))}
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
            {weekDetail?.status === 'published' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
                <button
                  style={{
                    padding: '12px 32px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(220,38,38,0.1)',
                    color: 'var(--danger)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setConfirmUnpublish(true)}
                >
                  Unpublish Week
                </button>
                {confirmUnpublish && (
                  <div
                    style={{
                      backgroundColor: 'rgba(220,38,38,0.06)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '14px', color: '#F87171', lineHeight: 1.5 }}>
                      Are you sure you want to unpublish this week? Customers will no longer see these meals until you publish it again.
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 700,
                          backgroundColor: 'var(--danger)',
                          color: '#FFF',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: unpublishWeek.isPending ? 0.6 : 1,
                        }}
                        disabled={unpublishWeek.isPending}
                        onClick={() => {
                          if (!currentWeek) return;
                          setErrorMsg(null);
                          unpublishWeek.mutate(currentWeek.id, {
                            onSuccess: async () => {
                              setConfirmUnpublish(false);
                              await Promise.all([
                                qc.invalidateQueries({ queryKey: queryKeys.menu.weeks }),
                                qc.invalidateQueries({
                                  queryKey: queryKeys.menu.weekDetail(currentWeek.id),
                                }),
                              ]);
                            },
                            onError: (err) =>
                              setErrorMsg(err instanceof Error ? err.message : 'Failed to unpublish week'),
                          });
                        }}
                      >
                        {unpublishWeek.isPending ? 'Unpublishing…' : 'Yes, Unpublish'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                        onClick={() => setConfirmUnpublish(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  opacity: publishWeek.isPending || !canPublish || weekDetail?.status === 'past' ? 0.7 : 1,
                }}
                disabled={publishWeek.isPending || !canPublish || weekDetail?.status === 'past'}
                onClick={() => {
                  if (!currentWeek) return;
                  setErrorMsg(null);
                  publishWeek.mutate(currentWeek.id, {
                    onError: (err) => {
                      if (err instanceof ApiError && err.errorCode === WEEK_ERROR.WEEK_NOT_COMPLETE) {
                        setErrorMsg(err.message);
                        return;
                      }
                      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish week');
                    },
                  });
                }}
              >
                {publishWeek.isPending ? 'Publishing…' : "📅 Publish Week's Menu"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                ['all', 'All'],
                ['draft', 'Draft'],
                ['active', 'Active'],
                ['updated', 'Updated'],
              ] as [MealLibraryStatusFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setLibraryStatusFilter(value)}
                style={{
                  backgroundColor: libraryStatusFilter === value ? '#333' : '#1A1A1A',
                  color: libraryStatusFilter === value ? '#FFF' : '#9CA3AF',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: `1px solid ${libraryStatusFilter === value ? '#555' : '#333'}`,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {([['all', 'All types'], ['executive', '🍛 Exec'], ['salad', '🥗 Salad']] as [MealTypeFilter, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLibraryTypeFilter(value)}
                  style={{
                    backgroundColor: libraryTypeFilter === value ? '#333' : '#1A1A1A',
                    color: libraryTypeFilter === value ? '#FFF' : '#9CA3AF',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${libraryTypeFilter === value ? '#555' : '#333'}`,
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
            {meals.map((meal) => {
              const isStatusPending =
                updateMealStatus.isPending && updateMealStatus.variables?.id === meal.id;
              const isConfirmingStatus = confirmStatusMealId === meal.id;
              const isRatingsOpen = expandedRatingsMealId === meal.id;
              const isAttachedBelow = isConfirmingStatus || isRatingsOpen;
              return (
                <div key={meal.id}>
                  <div
                    onClick={() =>
                      setExpandedRatingsMealId(isRatingsOpen ? null : meal.id)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: '#1A1A1A',
                      borderRadius: isAttachedBelow ? '12px 12px 0 0' : '12px',
                      border: '1px solid #333',
                      borderBottom: isAttachedBelow ? 'none' : '1px solid #333',
                      borderLeft: isRatingsOpen ? '4px solid var(--danger)' : '1px solid #333',
                      opacity: meal.status === 'draft' ? 0.6 : meal.status === 'updated' ? 0.85 : 1,
                      cursor: 'pointer',
                    }}
                  >
                    <MealIcon
                      meal={meal}
                      size={40}
                      photoCacheVersion={mealPhotoCacheVersion[meal.id]}
                    />

                    <div style={{ flex: 1, marginLeft: '16px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '15px', marginBottom: meal.name_ar ? '2px' : 0 }}>
                        {meal.name_en}
                      </h4>
                      {meal.name_ar && (
                        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 2px', direction: 'rtl', textAlign: 'left' }}>
                          {meal.name_ar}
                        </p>
                      )}
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                        {meal.meal_type === 'executive' ? 'Executive' : 'Salad'}
                        {meal.kcal ? ` · ${meal.kcal} kcal` : ''}
                        {meal.macros ? ` · ${meal.macros.protein_g}g protein` : ''}
                      </div>
                    </div>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          ...mealStatusBadgeStyle(meal.status),
                        }}
                      >
                        {mealStatusLabel(meal.status)}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setEditMealId(meal.id)}
                      >
                        ✏️ Edit
                      </button>
                      {meal.status !== 'active' && (
                        <button
                          className="btn-ghost"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            opacity: isStatusPending ? 0.5 : 1,
                            color: 'var(--danger)',
                          }}
                          disabled={isStatusPending}
                          onClick={() => {
                            if (meal.status === 'updated') {
                              handleActivateUpdated(meal);
                              return;
                            }
                            setConfirmStatusMealId(isConfirmingStatus ? null : meal.id);
                          }}
                        >
                          {isStatusPending ? '…' : 'Activate'}
                        </button>
                      )}
                      {meal.status !== 'draft' && (
                        <button
                          className="btn-ghost"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            opacity: isStatusPending ? 0.5 : 1,
                            color: '#9CA3AF',
                          }}
                          disabled={isStatusPending}
                          onClick={() =>
                            setConfirmStatusMealId(isConfirmingStatus ? null : meal.id)
                          }
                        >
                          {isStatusPending ? '…' : '→ Draft'}
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginLeft: '12px',
                        flexShrink: 0,
                        color: '#9CA3AF',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Ratings</span>
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          transform: isRatingsOpen ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      >
                        ▶
                      </span>
                    </div>
                  </div>

                  {isRatingsOpen && (
                    <div
                      style={{
                        backgroundColor: '#111',
                        border: '1px solid #333',
                        borderTop: 'none',
                        borderLeft: '4px solid var(--danger)',
                        borderBottom: isConfirmingStatus ? 'none' : '1px solid #333',
                        borderRadius: isConfirmingStatus ? 0 : '0 0 12px 12px',
                        padding: '24px',
                      }}
                    >
                      <MealRatingsPanel mealId={meal.id} />
                    </div>
                  )}

                  {/* Inline status change confirmation */}
                  {isConfirmingStatus && (
                    <div
                      style={{
                        backgroundColor: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.2)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#F87171', flex: 1 }}>
                        {meal.status === 'draft'
                          ? 'Activate this meal? It will appear in slot assignment.'
                          : meal.status === 'updated'
                            ? 'Move to draft? Pending edits will be discarded. Live menu slots keep the last confirmed version until you activate again.'
                            : 'Deactivate this meal? It will be removed from future slot options.'}
                      </span>
                      <button
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: meal.status === 'draft' ? 'var(--danger)' : '#444',
                          color: '#FFF',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: isStatusPending ? 0.6 : 1,
                        }}
                        disabled={isStatusPending}
                        onClick={() => handleStatusChange(meal)}
                      >
                        {isStatusPending ? '…' : 'Confirm'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => setConfirmStatusMealId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
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

      {/* Assign Dish Modal */}
      {assignModalSlot && currentWeek && (
        <AssignDishModal
          slot={assignModalSlot}
          isPending={assignSlot.isPending}
          errorMessage={assignErrorMsg}
          onSelectionChange={() => setAssignErrorMsg(null)}
          onClose={closeAssignModal}
          onAssign={(meal: Meal) => handleAssign(assignModalSlot.id, meal)}
        />
      )}

      {/* Edit Meal Modal */}
      {editMealId && (
        <EditMealModal
          mealId={editMealId}
          isPending={updateMeal.isPending}
          isStatusPending={updateMealStatus.isPending}
          onClose={() => setEditMealId(null)}
          onPhotoUploaded={(mealId) => {
            setMealPhotoCacheVersion((prev) => ({
              ...prev,
              [mealId]: Date.now(),
            }));
          }}
          onSave={(input) => {
            setErrorMsg(null);
            updateMeal.mutate(
              { id: editMealId, input },
              {
                onError: (err) => {
                  setErrorMsg(err instanceof Error ? err.message : 'Failed to update meal');
                },
              },
            );
          }}
          onActivate={(meal) => handleActivateUpdated(meal)}
        />
      )}

      {liveMenuConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              backgroundColor: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Montserrat, sans-serif' }}>
              {liveMenuConfirm.targetStatus === 'active'
                ? 'This will update the live menu'
                : 'Meal is in a published week'}
            </h3>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '14px', lineHeight: 1.6 }}>
              {liveMenuConfirm.message}
            </p>
            {liveMenuConfirm.affectedWeeks.length > 0 ? (
              <p style={{ margin: 0, color: '#D1D5DB', fontSize: '13px' }}>
                Affected weeks: {liveMenuConfirm.affectedWeeks.join(', ')}
              </p>
            ) : (
              <p style={{ margin: 0, color: '#D1D5DB', fontSize: '13px' }}>
                This meal may appear on multiple days in the live menu.
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setLiveMenuConfirm(null)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--danger)',
                  color: '#FFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: updateMealStatus.isPending ? 0.6 : 1,
                }}
                disabled={updateMealStatus.isPending}
                onClick={() =>
                  requestMealStatusChange(
                    liveMenuConfirm.meal,
                    liveMenuConfirm.targetStatus,
                    true,
                  )
                }
              >
                {updateMealStatus.isPending
                  ? '…'
                  : liveMenuConfirm.targetStatus === 'active'
                    ? 'Update live menu'
                    : 'Deactivate anyway'}
              </button>
            </div>
          </div>
        </div>
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
  isPending,
  errorMessage,
  onSelectionChange,
  onClose,
  onAssign,
}: {
  slot: PlannerSlot;
  isPending: boolean;
  errorMessage: string | null;
  onSelectionChange: () => void;
  onClose: () => void;
  onAssign: (meal: Meal) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Meal | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const streamType = slot.meal_type;

  const { data: meals = [], isLoading } = useAssignableMeals({
    q: debouncedSearch || undefined,
    meal_type: streamType,
  });

  const streamMeals = meals.filter((m) => m.meal_type === streamType);

  useEffect(() => {
    setSearch('');
    setSelected(null);
  }, [slot.id]);

  const handleSelect = (meal: Meal) => {
    setSelected(meal);
    onSelectionChange();
  };

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
          {dayLabel} — {streamType === 'executive' ? 'Executive' : 'Salad'} dishes only
        </p>

        <input
          type="text"
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '16px' }}
        />

        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#F87171',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            ⚠ {errorMessage}
          </div>
        )}

        {isLoading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
            Loading meals…
          </div>
        )}

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
          {!isLoading && streamMeals.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
              No active {streamType === 'executive' ? 'executive' : 'salad'} meals found. Activate a meal in the
              Meal Library to assign it.
            </div>
          )}
          {streamMeals.map((meal) => {
            return (
              <div
                key={meal.id}
                onClick={() => handleSelect(meal)}
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
                <MealIcon meal={meal} size={40} />

                <div style={{ flex: 1, marginLeft: '16px' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '15px', marginBottom: meal.name_ar ? '2px' : 0 }}>
                    {meal.name_en}
                  </h4>
                  {meal.name_ar && (
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 2px', direction: 'rtl', textAlign: 'left' }}>
                      {meal.name_ar}
                    </p>
                  )}
                  <div style={{ fontSize: '13px', color: '#9CA3AF' }}>
                    {meal.meal_type === 'executive' ? 'Executive' : 'Salad'}
                    {meal.kcal ? ` · ${meal.kcal} kcal` : ''}
                  </div>
                  {(meal.status === 'updated' || meal.has_pending_changes) && (
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                      Pending edits (live menu unchanged until Activate)
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            onClick={() => {
              if (selected) onAssign(selected);
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
  mealId,
  isPending,
  isStatusPending,
  onClose,
  onPhotoUploaded,
  onSave,
  onActivate,
}: {
  mealId: string;
  isPending: boolean;
  isStatusPending: boolean;
  onClose: () => void;
  onPhotoUploaded: (mealId: string) => void;
  onSave: (input: {
    name_en?: string;
    name_ar?: string;
    meal_type?: MealType;
    kcal?: number;
    macros?: { protein_g: number; carbs_g: number; fat_g: number };
    chef_note?: string;
    key_ingredients?: string[];
    emoji?: string;
    photo_url?: string | null;
  }) => void;
  onActivate: (meal: Meal) => void;
}) {
  const { data: detail, isLoading: detailLoading } = useMealDetail(mealId);
  const uploadPhoto = usePhotoUpload();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [mealType, setMealType] = useState<MealType>('executive');
  const [kcal, setKcal] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [chefNote, setChefNote] = useState('');
  const [keyIngredients, setKeyIngredients] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [showPendingBanner, setShowPendingBanner] = useState(false);

  const isSubmitting = isPending || uploadPhoto.isPending;

  useEffect(() => {
    if (!detail) return;
    const fields = mealEditableFields(detail);
    setNameEn(fields.name_en);
    setNameAr(fields.name_ar);
    setMealType(fields.meal_type ?? 'executive');
    setKcal(fields.kcal?.toString() ?? '');
    setProteinG(fields.macros?.protein_g.toString() ?? '');
    setCarbsG(fields.macros?.carbs_g.toString() ?? '');
    setFatG(fields.macros?.fat_g.toString() ?? '');
    setChefNote(fields.chef_note);
    setKeyIngredients(fields.key_ingredients ?? '');
    setSelectedEmoji(fields.emoji ?? null);
    setPhotoPreview(fields.photo_url ?? null);
    setUploadedPhotoUrl(null);
    setPhotoFile(null);
    setShowPendingBanner(detail.status === 'updated');
  }, [detail]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setUploadedPhotoUrl(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError('');
  };

  const handleUploadPhoto = () => {
    if (!photoFile || !mealId) return;
    setPhotoError('');
    uploadPhoto.mutate(
      { mealId, file: photoFile },
      {
        onSuccess: (url) => {
          setUploadedPhotoUrl(url);
          setPhotoFile(null);
          onPhotoUploaded(mealId);
          // Keep blob preview — CDN photo_url is often unchanged and would show a cached image.
        },
        onError: (err) => {
          setPhotoError(err instanceof ApiError ? err.message : 'Photo upload failed.');
        },
      },
    );
  };

  const handleSave = async () => {
    if (!nameEn.trim()) return;
    if (!mealId) {
      setPhotoError('Meal ID is missing. Close and reopen the editor.');
      return;
    }

    setPhotoError('');
    const hasMacros = proteinG || carbsG || fatG;

    let savedPhotoUrl =
      uploadedPhotoUrl ??
      (photoPreview && !photoPreview.startsWith('blob:') ? photoPreview : undefined) ??
      detail?.photo_url ??
      undefined;

    if (photoFile) {
      try {
        savedPhotoUrl = await uploadPhoto.mutateAsync({ mealId, file: photoFile });
        setUploadedPhotoUrl(savedPhotoUrl);
        setPhotoFile(null);
        onPhotoUploaded(mealId);
      } catch (err) {
        setPhotoError(err instanceof ApiError ? err.message : 'Photo upload failed.');
        return;
      }
    }

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
      chef_note: chefNote.trim() || undefined,
      key_ingredients: toKeyIngredientsArray(keyIngredients),
      emoji: selectedEmoji ?? undefined,
      ...(savedPhotoUrl ? { photo_url: savedPhotoUrl } : {}),
    });
    if (detail && detail.status !== 'draft') {
      setShowPendingBanner(true);
    }
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

        {detailLoading && (
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>Loading meal…</p>
        )}

        {detail && detail.status === 'updated' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '12px',
            }}
          >
            <div style={{ backgroundColor: '#222', borderRadius: '8px', padding: '12px', border: '1px solid #333' }}>
              <div style={{ color: '#9CA3AF', marginBottom: '6px', fontWeight: 600 }}>Live (customers)</div>
              <div style={{ color: '#FFF' }}>{detail.name_en}</div>
              {detail.name_ar && <div style={{ color: '#9CA3AF', direction: 'rtl' }}>{detail.name_ar}</div>}
              {detail.kcal != null && <div style={{ color: '#9CA3AF', marginTop: '4px' }}>{detail.kcal} kcal</div>}
            </div>
            <div style={{ backgroundColor: 'rgba(245, 230, 66, 0.06)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(245, 230, 66, 0.2)' }}>
              <div style={{ color: 'var(--danger)', marginBottom: '6px', fontWeight: 600 }}>Pending</div>
              <div style={{ color: '#FFF' }}>{detail.pending?.name_en ?? detail.name_en}</div>
              {(detail.pending?.name_ar ?? detail.name_ar) && (
                <div style={{ color: '#9CA3AF', direction: 'rtl' }}>{detail.pending?.name_ar ?? detail.name_ar}</div>
              )}
              {(detail.pending?.kcal ?? detail.kcal) != null && (
                <div style={{ color: '#9CA3AF', marginTop: '4px' }}>{detail.pending?.kcal ?? detail.kcal} kcal</div>
              )}
            </div>
          </div>
        )}

        {showPendingBanner && detail && detail.status !== 'draft' && (
          <div
            style={{
              backgroundColor: 'var(--warn-a10)',
              border: '1px solid rgba(245, 230, 66, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ color: '#E5E7EB', fontSize: '13px', lineHeight: 1.5 }}>
              Saved as pending. The live menu will not change until you Activate.
            </span>
            <button
              type="button"
              className="btn-primary"
              style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px', opacity: isStatusPending ? 0.7 : 1 }}
              disabled={isStatusPending}
              onClick={() => onActivate(detail)}
            >
              {isStatusPending ? '…' : 'Activate'}
            </button>
          </div>
        )}

        {/* Bilingual names */}
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

        {/* Type */}
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

        {/* Calories */}
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

        {/* Macros */}
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

        {/* Key Ingredients */}
        <div>
          <label style={labelStyle}>Key Ingredients</label>
          <input
            style={fieldStyle}
            value={keyIngredients}
            onChange={(e) => setKeyIngredients(e.target.value)}
            placeholder="e.g. Lamb, Saffron rice, Dried lime"
          />
        </div>

        {/* Chef's Note */}
        <div>
          <label style={labelStyle}>Chef's Note</label>
          <textarea
            value={chefNote}
            onChange={(e) => setChefNote(e.target.value)}
            placeholder="Heating or allergy notes…"
            style={{
              ...fieldStyle,
              height: '72px',
              fontFamily: 'Montserrat, sans-serif',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Emoji */}
        <div>
          <label style={labelStyle}>Emoji (fallback when no photo)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                style={{
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  backgroundColor: selectedEmoji === emoji ? 'rgba(228,40,29,.10)' : '#222',
                  borderRadius: '8px',
                  border: selectedEmoji === emoji ? '2px solid var(--danger)' : '1px solid #444',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>Photo</label>
          <input
            ref={photoInputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES}
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
          {photoPreview ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={photoPreview}
                alt="preview"
                style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {photoFile && (
                  <button
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--danger)',
                      color: '#FFF',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: uploadPhoto.isPending ? 0.6 : 1,
                    }}
                    disabled={uploadPhoto.isPending}
                    onClick={handleUploadPhoto}
                  >
                    {uploadPhoto.isPending ? 'Uploading…' : 'Upload photo'}
                  </button>
                )}
                {uploadedPhotoUrl && !photoFile && (
                  <span style={{ fontSize: '12px', color: '#4ADE80', fontWeight: 600 }}>
                    Photo uploaded
                  </span>
                )}
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={() => photoInputRef.current?.click()}
            >
              📷 Choose photo
            </button>
          )}
          {photoError && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#F87171' }}>{photoError}</p>
          )}
        </div>

        {/* Actions */}
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
            style={{ flex: 2, opacity: isSubmitting ? 0.7 : 1 }}
            disabled={!nameEn.trim() || isSubmitting}
            onClick={() => {
              void handleSave();
            }}
          >
            {isSubmitting ? 'Saving…' : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
