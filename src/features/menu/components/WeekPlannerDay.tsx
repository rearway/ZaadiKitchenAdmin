import type { ReactNode } from 'react';
import { useMealTypeDisplays } from '@/features/settings';
import type { Meal } from '../model/menu.schema';
import type { PlannerSlot, WeekDayDetail } from '../model/menu.schema';

type MealIconProps = {
  meal: Meal;
  size?: number;
  photoCacheVersion?: number;
};

type WeekPlannerDayProps = {
  day: WeekDayDetail;
  canEditWeek: boolean;
  confirmClearSlotId: string | null;
  clearPendingSlotId: string | null;
  highlightSlotId: string | null;
  mealPhotoCacheVersion: Record<string, number>;
  MealIcon: (props: MealIconProps) => ReactNode;
  onOpenAssign: (slot: PlannerSlot) => void;
  onRequestClear: (slotId: string) => void;
  onConfirmClear: (slotId: string) => void;
  onCancelClear: () => void;
  onSetDefault: (slot: PlannerSlot) => void;
  onAddSlot: (deliveryDate: string, mealType: 'executive' | 'salad') => void;
  pendingAddKey: string | null;
  setDefaultPending: boolean;
};

function StreamColumn({
  title,
  slots,
  canAdd,
  mealType,
  deliveryDate,
  canEditWeek,
  confirmClearSlotId,
  clearPendingSlotId,
  highlightSlotId,
  mealPhotoCacheVersion,
  MealIcon,
  onOpenAssign,
  onRequestClear,
  onConfirmClear,
  onCancelClear,
  onSetDefault,
  onAddSlot,
  pendingAddKey,
  setDefaultPending,
}: {
  title: string;
  slots: PlannerSlot[];
  canAdd: boolean;
  mealType: 'executive' | 'salad';
  deliveryDate: string;
  canEditWeek: boolean;
  confirmClearSlotId: string | null;
  clearPendingSlotId: string | null;
  highlightSlotId: string | null;
  mealPhotoCacheVersion: Record<string, number>;
  MealIcon: (props: MealIconProps) => ReactNode;
  onOpenAssign: (slot: PlannerSlot) => void;
  onRequestClear: (slotId: string) => void;
  onConfirmClear: (slotId: string) => void;
  onCancelClear: () => void;
  onSetDefault: (slot: PlannerSlot) => void;
  onAddSlot: (deliveryDate: string, mealType: 'executive' | 'salad') => void;
  pendingAddKey: string | null;
  setDefaultPending: boolean;
}) {
  const { label: mealTypeName } = useMealTypeDisplays();
  const filledCount = slots.filter((s) => s.meal).length;
  const canAddInStream = canEditWeek && canAdd;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>{title}</div>
      {slots.map((slot) => {
        const isClearPending = clearPendingSlotId === slot.id;
        const canEditSlot = canEditWeek && slot.is_editable;
        const canMakeDefault = !slot.is_default && !!slot.meal && filledCount > 1;
        const border =
          highlightSlotId === slot.id || confirmClearSlotId === slot.id
            ? '1px solid var(--danger)'
            : '1px solid #333';

        return (
          <div key={slot.id}>
            <div
              style={{
                backgroundColor: '#222',
                borderRadius: confirmClearSlotId === slot.id ? '8px 8px 0 0' : '8px',
                border,
                borderBottom: confirmClearSlotId === slot.id ? 'none' : border,
                padding: '12px',
              }}
            >
              {slot.meal ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MealIcon
                    meal={slot.meal}
                    size={40}
                    photoCacheVersion={mealPhotoCacheVersion[slot.meal.id]}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{slot.meal.name_en}</span>
                      {slot.is_default && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(228,40,29,.10)',
                            color: 'var(--danger)',
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    {slot.meal.kcal != null && (
                      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{slot.meal.kcal} kcal</div>
                    )}
                    {slot.meal.status === 'updated' && (
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px', lineHeight: 1.4 }}>
                        Pending library edits — live menu unchanged until meal is activated
                      </div>
                    )}
                  </div>
                  {canEditSlot && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => onOpenAssign(slot)}
                      >
                        Edit
                      </button>
                      {canMakeDefault && (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--danger)',
                            opacity: setDefaultPending ? 0.6 : 1,
                          }}
                          disabled={setDefaultPending}
                          onClick={() => onSetDefault(slot)}
                          title="Set as the default dish for this day"
                        >
                          Make default
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '11px', color: '#9CA3AF' }}
                        disabled={isClearPending}
                        onClick={() => onRequestClear(slot.id)}
                      >
                        {isClearPending ? '…' : '✕'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => canEditSlot && onOpenAssign(slot)}
                  disabled={!canEditSlot}
                  style={{
                    width: '100%',
                    border: '1px dashed #444',
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    background: 'transparent',
                    cursor: canEditSlot ? 'pointer' : 'not-allowed',
                    opacity: canEditSlot ? 1 : 0.5,
                    fontSize: '13px',
                  }}
                >
                  + Assign dish
                </button>
              )}
            </div>
            {confirmClearSlotId === slot.id && (
              <div
                style={{
                  backgroundColor: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '12px', color: '#F87171', flex: 1 }}>
                  Remove this dish from the slot?
                </span>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: 'var(--danger)',
                    color: '#FFF',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isClearPending ? 0.6 : 1,
                  }}
                  disabled={isClearPending}
                  onClick={() => onConfirmClear(slot.id)}
                >
                  {isClearPending ? '…' : 'Confirm'}
                </button>
                <button type="button" className="btn-ghost" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={onCancelClear}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
      {canAddInStream && (
        <button
          type="button"
          className="btn-ghost"
          style={{
            padding: '10px',
            fontSize: '13px',
            border: '1px dashed #444',
            borderRadius: '8px',
            opacity: pendingAddKey === `${deliveryDate}-${mealType}` ? 0.6 : 1,
          }}
          disabled={pendingAddKey === `${deliveryDate}-${mealType}`}
          onClick={() => onAddSlot(deliveryDate, mealType)}
        >
          {pendingAddKey === `${deliveryDate}-${mealType}`
            ? '…'
            : `+ Add ${mealTypeName(mealType, 'short')}`}
        </button>
      )}
    </div>
  );
}

export default function WeekPlannerDay(props: WeekPlannerDayProps) {
  const {
    day,
    canEditWeek,
    confirmClearSlotId,
    clearPendingSlotId,
    highlightSlotId,
    mealPhotoCacheVersion,
    MealIcon,
    onOpenAssign,
    onRequestClear,
    onConfirmClear,
    onCancelClear,
    onSetDefault,
    onAddSlot,
    pendingAddKey,
    setDefaultPending,
  } = props;
  const { label: mealTypeName } = useMealTypeDisplays();

  return (
    <div
      style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px 20px',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{day.day_label}</h3>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9CA3AF' }}>{day.date_label}</p>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <StreamColumn
          title={mealTypeName('executive')}
          slots={day.executive_slots}
          canAdd={day.can_add_executive}
          mealType="executive"
          deliveryDate={day.delivery_date}
          canEditWeek={canEditWeek}
          confirmClearSlotId={confirmClearSlotId}
          clearPendingSlotId={clearPendingSlotId}
          highlightSlotId={highlightSlotId}
          mealPhotoCacheVersion={mealPhotoCacheVersion}
          MealIcon={MealIcon}
          onOpenAssign={onOpenAssign}
          onRequestClear={onRequestClear}
          onConfirmClear={onConfirmClear}
          onCancelClear={onCancelClear}
          onSetDefault={onSetDefault}
          onAddSlot={onAddSlot}
          pendingAddKey={pendingAddKey}
          setDefaultPending={setDefaultPending}
        />
        <StreamColumn
          title={mealTypeName('salad')}
          slots={day.salad_slots}
          canAdd={day.can_add_salad}
          mealType="salad"
          deliveryDate={day.delivery_date}
          canEditWeek={canEditWeek}
          confirmClearSlotId={confirmClearSlotId}
          clearPendingSlotId={clearPendingSlotId}
          highlightSlotId={highlightSlotId}
          mealPhotoCacheVersion={mealPhotoCacheVersion}
          MealIcon={MealIcon}
          onOpenAssign={onOpenAssign}
          onRequestClear={onRequestClear}
          onConfirmClear={onConfirmClear}
          onCancelClear={onCancelClear}
          onSetDefault={onSetDefault}
          onAddSlot={onAddSlot}
          pendingAddKey={pendingAddKey}
          setDefaultPending={setDefaultPending}
        />
      </div>
    </div>
  );
}
