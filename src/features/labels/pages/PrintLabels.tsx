import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabels, useDownloadLabels } from '../api/labels.queries';
import type { DownloadLabelsParams } from '../api/labels.api';
import type { Label, MealTypeFilter } from '../model/labels.schema';
import { ApiError } from '@/shared/types/api';

const FILTERS: { id: MealTypeFilter; chipLabel: string }[] = [
  { id: 'all', chipLabel: 'All' },
  { id: 'executive', chipLabel: '🍛 Exec' },
  { id: 'salad', chipLabel: '🥗 Salad' },
];

function formatLocation(label: Label) {
  return [label.building, label.floor, label.desk_area].filter(Boolean).join(' · ');
}

export default function PrintLabels() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MealTypeFilter>('all');
  const [previewLabel, setPreviewLabel] = useState<Label | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, error } = useLabels({ mealType: filter === 'all' ? undefined : filter });
  const downloadLabels = useDownloadLabels();

  const allLabels = data?.areas.flatMap((a) => a.labels) ?? [];

  const handleDownload = (params: DownloadLabelsParams) => {
    setErrorMsg(null);
    downloadLabels.mutate(params, {
      onError: (err) => setErrorMsg(err instanceof ApiError ? err.message : 'Download failed.'),
    });
  };

  const dateLabel = data
    ? new Date(data.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>
          &larr;
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
              Print Labels
            </h1>
            {data && <span style={{ color: '#9CA3AF', fontSize: '18px' }}>{data.total_count} orders</span>}
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0, marginTop: '4px' }}>
            {dateLabel} · Print and attach to each meal package
          </p>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(220,38,38,0.1)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ color: '#9CA3AF', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
          Loading labels…
        </div>
      ) : error || !data ? (
        <div style={{ color: 'var(--danger)', fontSize: '14px', padding: '32px 0', textAlign: 'center' }}>
          {error instanceof ApiError ? error.message : 'Failed to load labels.'}
        </div>
      ) : (
        <>
          {/* Top Action Card */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#1A1A1A',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #333',
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                📥 Download all labels
              </h3>
              <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>
                {data.filtered_count} stickers as PDF · ready to print
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '12px 24px', opacity: downloadLabels.isPending ? 0.7 : 1 }}
              disabled={downloadLabels.isPending}
              onClick={() => handleDownload({ mealType: filter === 'all' ? undefined : filter })}
            >
              {data.bulk_download_label ?? 'Download PDF'}
            </button>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  backgroundColor: filter === f.id ? '#333' : '#1A1A1A',
                  color: filter === f.id ? '#FFF' : '#9CA3AF',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid #333',
                  fontSize: '14px',
                }}
              >
                {f.id === 'all' ? `All (${data.total_count})` : f.chipLabel}
              </button>
            ))}
          </div>

          {/* Label List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allLabels.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  border: '1px dashed #333',
                  borderRadius: '12px',
                }}
              >
                No labels for this filter.
              </div>
            ) : (
              allLabels.map((label) => (
                <div
                  key={label.label_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#1A1A1A',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor:
                        label.meal_type === 'executive' ? 'var(--danger)' : 'var(--ops)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#FFF',
                      marginRight: '16px',
                    }}
                  >
                    {label.customer_name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '150px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>{label.customer_name}</h4>
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: '14px', flex: 1 }}>{formatLocation(label)}</div>
                    <div
                      style={{
                        backgroundColor: 'rgba(228,40,29,.10)',
                        color: 'var(--danger)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        width: '120px',
                        textAlign: 'center',
                      }}
                    >
                      {label.meal_type === 'executive' ? '🍛 Exec' : '🥗 Salad'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: '8px', backgroundColor: '#222' }}
                      onClick={() => setPreviewLabel(label)}
                    >
                      Preview
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: '8px', border: '1px solid #333', color: '#FFF' }}
                      disabled={downloadLabels.isPending}
                      onClick={() => handleDownload({ labelId: label.label_id })}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Download by Area */}
          {data.areas.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h3
                style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', marginBottom: '16px' }}
              >
                DOWNLOAD BY AREA
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {data.areas.map((area) => (
                  <button
                    key={area.area_id}
                    className="btn-ghost"
                    style={{
                      border: '1px solid #333',
                      padding: '8px 16px',
                      backgroundColor: '#1A1A1A',
                      color: '#FFF',
                    }}
                    disabled={downloadLabels.isPending}
                    onClick={() =>
                      handleDownload({
                        areaId: area.area_id,
                        mealType: filter === 'all' ? undefined : filter,
                      })
                    }
                  >
                    📍 {area.area_download_label ?? `${area.area_name} (${area.count})`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewLabel && (
        <LabelPreviewModal
          label={previewLabel}
          onClose={() => setPreviewLabel(null)}
          onDownload={(params) => handleDownload(params)}
          isDownloading={downloadLabels.isPending}
        />
      )}
    </div>
  );
}

type LabelPreviewModalProps = {
  label: Label;
  onClose: () => void;
  onDownload: (params: DownloadLabelsParams) => void;
  isDownloading: boolean;
};

function LabelPreviewModal({ label, onClose, onDownload, isDownloading }: LabelPreviewModalProps) {
  const deliveryDateLabel = label.delivery_date
    ? new Date(label.delivery_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
              Label Preview
            </h2>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>
              Actual print size: 100×60mm
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={onClose}
            style={{ fontSize: '24px', padding: '8px' }}
          >
            &times;
          </button>
        </div>

        {/* The Sticker */}
        <div
          style={{
            backgroundColor: '#FFF',
            color: '#000',
            borderRadius: '8px',
            width: '500px',
            height: '300px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Sticker Header */}
          <div
            style={{
              backgroundColor: '#1A1A1A',
              color: '#FFF',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <img src="/brand/platio-logo-white.svg" alt="Platio" style={{ height: '18px', width: 'auto' }} />
            <div style={{ fontSize: '12px', letterSpacing: '1px' }}>
              KITCHEN · FRESH DAILY LUNCH
            </div>
          </div>

          {/* Sticker Body */}
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, marginBottom: '8px' }}>
              {label.customer_name}
            </h1>
            <p style={{ fontSize: '16px', color: '#333', margin: 0, marginBottom: '4px' }}>
              {label.building ?? ''}
            </p>
            <p style={{ fontSize: '16px', color: '#333', margin: 0, marginBottom: '16px' }}>
              {[label.floor, label.desk_area, label.gate].filter(Boolean).join(' · ')}
            </p>
            <p style={{ fontSize: '14px', color: '#666', margin: 0, marginBottom: '24px' }}>
              Riyadh, SA
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: 'auto',
              }}
            >
              <div>
                <div
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: '#000',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  {label.meal_type === 'executive' ? '🍛 Executive Meal' : '🥗 Salad Meal'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {deliveryDateLabel} · Lunch delivery
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {label.order_ref ?? ''}
                </div>
                <div
                  style={{
                    height: '32px',
                    width: '120px',
                    backgroundImage:
                      'repeating-linear-gradient(to right, #000, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #333',
          }}
        >
          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: '16px', padding: '12px', opacity: isDownloading ? 0.7 : 1 }}
            disabled={isDownloading}
            onClick={() => onDownload({ labelId: label.label_id })}
          >
            📥 Download this label
          </button>
          <div
            style={{
              backgroundColor: 'rgba(245, 230, 66, 0.1)',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            💡 Labels formatted for 100×60mm thermal sticker paper. Download as PDF and send to any
            thermal printer.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Print options:</span>
            <span
              style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onDownload({})}
            >
              All labels (PDF)
            </span>
            <span
              style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onDownload({ mealType: 'executive' })}
            >
              Exec only
            </span>
            <span
              style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => onDownload({ mealType: 'salad' })}
            >
              Salad only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
