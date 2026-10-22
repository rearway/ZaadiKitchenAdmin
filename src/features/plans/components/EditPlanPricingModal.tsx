import { useMemo, useState, type CSSProperties } from 'react';
import {
  type Plan,
  formatDiscountLabel,
  formatPlanSar,
  parsePlanMoneyInput,
  previewDiscountPercent,
} from '../model/plans.schema';

type Props = {
  plan: Plan;
  isPending: boolean;
  onClose: () => void;
  onSave: (input: { price_sar?: number; max_price_sar?: number | null }) => void;
};

const fieldStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#222',
  border: '1px solid #444',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#FFF',
  fontSize: '14px',
};

const labelStyle: CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  marginBottom: '6px',
  display: 'block',
};

export default function EditPlanPricingModal({ plan, isPending, onClose, onSave }: Props) {
  const [priceInput, setPriceInput] = useState(String(plan.price_sar));
  const [maxInput, setMaxInput] = useState(
    plan.max_price_sar === null ? '' : String(plan.max_price_sar),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const priceNum = parsePlanMoneyInput(priceInput);
  const maxTrimmed = maxInput.trim();
  const maxNum = maxTrimmed === '' ? null : parsePlanMoneyInput(maxInput);

  const maxBelowPrice =
    maxNum !== null && priceNum !== null && maxNum < priceNum;

  const priceInvalid = priceInput.trim() !== '' && priceNum === null;

  const maxInvalid = maxTrimmed !== '' && maxNum === null;

  const preview = useMemo(() => {
    if (priceNum === null) return null;
    const pct = previewDiscountPercent(maxNum, priceNum);
    if (pct === null) {
      return { text: `${formatPlanSar(priceNum)} · No discount`, hasStrike: false };
    }
    return {
      text: `${formatPlanSar(maxNum!)} ${formatPlanSar(priceNum)} · ${formatDiscountLabel(pct)}`,
      hasStrike: true,
      maxLabel: formatPlanSar(maxNum!),
      priceLabel: formatPlanSar(priceNum),
      pct,
    };
  }, [priceNum, maxNum]);

  const handleSave = () => {
    setSubmitError(null);
    if (priceNum === null) {
      setSubmitError('Price must be greater than 0 with up to 2 decimal places.');
      return;
    }
    if (maxInvalid) {
      setSubmitError('Max price must be a valid amount with up to 2 decimal places.');
      return;
    }
    if (maxBelowPrice) {
      setSubmitError('Max price must be greater than or equal to price');
      return;
    }

    const body: { price_sar?: number; max_price_sar?: number | null } = {};
    if (priceNum !== plan.price_sar) body.price_sar = priceNum;

    const initialMax = plan.max_price_sar;
    const nextMax = maxTrimmed === '' ? null : maxNum;
    if (nextMax !== initialMax) body.max_price_sar = nextMax;

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    onSave(body);
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
        <h2 style={{ fontSize: '22px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
          Edit pricing — {plan.name}
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>{plan.slug}</p>

        <div>
          <label style={labelStyle}>Price (SAR) *</label>
          <input
            type="text"
            inputMode="decimal"
            style={fieldStyle}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6B7280' }}>
            Changing the price affects new purchases only.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Max price (SAR)</label>
          <input
            type="text"
            inputMode="decimal"
            style={fieldStyle}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            placeholder="Leave empty for no discount"
          />
        </div>

        {preview && (
          <div
            style={{
              backgroundColor: '#222',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '14px',
              color: '#E5E7EB',
            }}
          >
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>
              Customer preview
            </div>
            {preview.hasStrike && preview.maxLabel && preview.priceLabel ? (
              <span>
                <span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: '8px' }}>
                  {preview.maxLabel}
                </span>
                <span style={{ fontWeight: 700 }}>{preview.priceLabel}</span>
                <span style={{ color: 'var(--danger)', marginLeft: '8px', fontWeight: 600 }}>
                  · {formatDiscountLabel(preview.pct!)}
                </span>
              </span>
            ) : (
              <span>{preview.text}</span>
            )}
          </div>
        )}

        {(priceInvalid || maxInvalid || maxBelowPrice || submitError) && (
          <div style={{ color: '#F87171', fontSize: '13px' }}>
            {submitError ??
              (maxBelowPrice
                ? 'Max price must be greater than or equal to price'
                : 'Enter valid amounts (greater than 0, up to 2 decimals).')}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ flex: 1, backgroundColor: '#222' }}
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 2, opacity: isPending || maxBelowPrice || priceNum === null ? 0.7 : 1 }}
            disabled={isPending || maxBelowPrice || maxInvalid || priceNum === null}
            onClick={handleSave}
          >
            {isPending ? 'Saving…' : 'Save pricing'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
