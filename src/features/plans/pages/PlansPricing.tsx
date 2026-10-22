import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ApiError } from '@/shared/types/api';
import { usePlans, useUpdatePlanPricing } from '../api/plans.queries';
import EditPlanPricingModal from '../components/EditPlanPricingModal';
import {
  type Plan,
  formatDiscountLabel,
  formatPlanSar,
  sortPlans,
} from '../model/plans.schema';

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PlansPricing() {
  const { role } = useOutletContext<{ role: 'admin' | 'ops' }>();
  const isAdmin = role === 'admin';

  const { data: plans = [], isLoading, isError, error } = usePlans();
  const updatePricing = useUpdatePlanPricing();

  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sorted = sortPlans(plans);

  const handleSave = (input: { price_sar?: number; max_price_sar?: number | null }) => {
    if (!editPlan) return;
    setErrorMsg(null);
    updatePricing.mutate(
      { planId: editPlan.slug, input },
      {
        onSuccess: () => {
          setSuccessMsg(`${editPlan.name} pricing updated.`);
          setEditPlan(null);
        },
        onError: (err) =>
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to update plan pricing.'),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Plans &amp; Pricing
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '14px', margin: '8px 0 0' }}>
          Subscription plan prices shown to customers at checkout
          {!isAdmin && ' · View only'}
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            backgroundColor: 'rgba(0, 200, 150, 0.1)',
            border: '1px solid rgba(0, 200, 150, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#6EE7B7',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

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
            type="button"
            onClick={() => setErrorMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF' }}>
          Loading plans…
        </div>
      )}

      {isError && (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger)' }}>
          {error instanceof ApiError ? error.message : 'Failed to load plans. Please try again.'}
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#9CA3AF',
            border: '1px dashed #333',
            borderRadius: '12px',
          }}
        >
          No plans found.
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div
          style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '12px',
            border: '1px solid #333',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isAdmin
                ? 'minmax(140px,1.2fr) repeat(6, minmax(0,1fr)) 72px'
                : 'minmax(140px,1.2fr) repeat(6, minmax(0,1fr))',
              gap: '12px',
              padding: '12px 20px',
              borderBottom: '1px solid #333',
              fontSize: '11px',
              color: '#9CA3AF',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <span>Plan</span>
            <span>Price</span>
            <span>Max price</span>
            <span>Discount</span>
            <span>Per meal</span>
            <span>Meals</span>
            <span>Updated</span>
            {isAdmin && <span />}
          </div>

          {sorted.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              isAdmin={isAdmin}
              onEdit={() => {
                setErrorMsg(null);
                setEditPlan(plan);
              }}
            />
          ))}
        </div>
      )}

      {editPlan && isAdmin && (
        <EditPlanPricingModal
          plan={editPlan}
          isPending={updatePricing.isPending}
          onClose={() => setEditPlan(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function PlanRow({
  plan,
  isAdmin,
  onEdit,
}: {
  plan: Plan;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isAdmin
          ? 'minmax(140px,1.2fr) repeat(6, minmax(0,1fr)) 72px'
          : 'minmax(140px,1.2fr) repeat(6, minmax(0,1fr))',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid #222',
        alignItems: 'center',
        fontSize: '14px',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: '#FFF', marginBottom: '4px' }}>{plan.name}</div>
        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>{plan.slug}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <Badge
            label={plan.is_active ? 'Active' : 'Inactive'}
            color={plan.is_active ? '#16A34A' : '#6B7280'}
          />
          {plan.is_most_popular && <Badge label="Most popular" color="var(--danger)" />}
        </div>
      </div>
      <span style={{ fontWeight: 600 }}>{formatPlanSar(plan.price_sar)}</span>
      <span style={{ color: '#D1D5DB' }}>
        {plan.max_price_sar === null ? '—' : formatPlanSar(plan.max_price_sar)}
      </span>
      <span style={{ color: plan.discount_percent !== null ? 'var(--danger)' : '#9CA3AF' }}>
        {formatDiscountLabel(plan.discount_percent)}
      </span>
      <span>{formatPlanSar(plan.price_per_meal_sar)}</span>
      <span>{plan.meal_count}</span>
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatUpdatedAt(plan.updated_at)}</span>
      {isAdmin && (
        <button
          type="button"
          className="btn-ghost"
          style={{ padding: '6px 10px', fontSize: '13px', border: '1px solid #333' }}
          onClick={onEdit}
        >
          Edit
        </button>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {label}
    </span>
  );
}
