import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_LABELS = [
  { id: '1', initial: 'A', color: 'var(--ops)', name: 'Ahmad Alsaud', location: 'Olaya Towers · Floor 14 · Desk 2', type: 'Executive' },
  { id: '2', initial: 'S', color: 'var(--ops)', name: 'Sara Aljohani', location: 'KAFD Area 4 · Desk 2B', type: 'Salad' },
  { id: '3', initial: 'K', color: 'var(--err)', name: 'Khalid Alghamdi', location: 'Digital City · Bldg 3 · F2', type: 'Executive' },
];

export default function PrintLabels() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [previewLabel, setPreviewLabel] = useState<any>(null);

  const filteredLabels = MOCK_LABELS.filter(l => filter === 'All' || l.type === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>&larr;</button>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{ fontSize: '32px', fontFamily: "Montserrat, sans-serif", margin: 0 }}>Print Labels</h1>
            <span style={{ color: '#9CA3AF', fontSize: '18px' }}>87 orders</span>
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0, marginTop: '4px' }}>
            Thu, Apr 3 · Print and attach to each meal package
          </p>
        </div>
      </div>

      {/* Top Action Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '16px', border: '1px solid #333' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>📥 Download all labels</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', margin: 0 }}>87 stickers as PDF · ready to print</p>
        </div>
        <button className="btn-primary" style={{ padding: '12px 24px' }}>Download PDF</button>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['All', 'Executive', 'Salad'].map(f => (
          <button 
            key={f} onClick={() => setFilter(f)}
            style={{ 
              backgroundColor: filter === f ? '#333' : '#1A1A1A', 
              color: filter === f ? '#FFF' : '#9CA3AF', 
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #333', fontSize: '14px' 
            }}
          >
            {f === 'Executive' ? '🍛 Exec' : f === 'Salad' ? '🥗 Salad' : `All (87)`}
          </button>
        ))}
      </div>

      {/* Label List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredLabels.map(label => (
          <div key={label.id} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1A1A1A', padding: '16px', borderRadius: '12px', border: '1px solid #333' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: label.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#FFF', marginRight: '16px' }}>
              {label.initial}
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '150px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>{label.name}</h4>
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '14px', flex: 1 }}>{label.location}</div>
              <div style={{ 
                backgroundColor: 'rgba(228,40,29,.10)', color: 'var(--err)', 
                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                width: '120px', textAlign: 'center'
              }}>
                {label.type === 'Executive' ? '🍛 Exec' : '🥗 Salad'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginLeft: '24px' }}>
              <button className="btn-ghost" style={{ padding: '8px', backgroundColor: '#222' }} onClick={() => setPreviewLabel(label)}>Preview</button>
              <button className="btn-ghost" style={{ padding: '8px', border: '1px solid #333', color: '#FFF' }}>📥 Download</button>
            </div>
          </div>
        ))}
      </div>

      {/* Download by Area */}
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', marginBottom: '16px' }}>DOWNLOAD BY AREA</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-ghost" style={{ border: '1px solid #333', padding: '8px 16px', backgroundColor: '#1A1A1A', color: '#FFF' }}>📍 Al Nakheel (32)</button>
          <button className="btn-ghost" style={{ border: '1px solid #333', padding: '8px 16px', backgroundColor: '#1A1A1A', color: '#FFF' }}>📍 Olaya (29)</button>
          <button className="btn-ghost" style={{ border: '1px solid #333', padding: '8px 16px', backgroundColor: '#1A1A1A', color: '#FFF' }}>📍 Al Malaz (26)</button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewLabel && (
        <LabelPreviewModal label={previewLabel} onClose={() => setPreviewLabel(null)} />
      )}
    </div>
  );
}

function LabelPreviewModal({ label, onClose }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontFamily: "Montserrat, sans-serif", margin: 0 }}>Label Preview</h2>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '14px' }}>Actual print size: 100×60mm</p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '24px', padding: '8px' }}>&times;</button>
        </div>

        {/* The Sticker */}
        <div style={{ 
          backgroundColor: '#FFF', color: '#000', borderRadius: '8px', 
          width: '500px', height: '300px', margin: '0 auto',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* Sticker Header */}
          <div style={{ backgroundColor: '#1A1A1A', color: '#FFF', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: '20px' }}>Zaadi<span style={{ color: 'var(--err)' }}>.</span></div>
            <div style={{ fontSize: '12px', letterSpacing: '1px' }}>KITCHEN · FRESH DAILY LUNCH</div>
          </div>
          
          {/* Sticker Body */}
          <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, marginBottom: '8px' }}>{label.name}</h1>
            <p style={{ fontSize: '16px', color: '#333', margin: 0, marginBottom: '4px' }}>{label.location.split('·')[0].trim()}</p>
            <p style={{ fontSize: '16px', color: '#333', margin: 0, marginBottom: '16px' }}>{label.location.split('·').slice(1).join('·').trim()}</p>
            <p style={{ fontSize: '14px', color: '#666', margin: 0, marginBottom: '24px' }}>Riyadh, SA</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              <div>
                <div style={{ backgroundColor: 'var(--err)', color: '#000', padding: '4px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>
                  {label.type === 'Executive' ? '🍛 Executive Meal' : '🥗 Salad Meal'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Thursday, April 3, 2025 · Lunch delivery</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>#ORD-20250403-002</div>
                <div style={{ height: '32px', width: '120px', backgroundImage: 'repeating-linear-gradient(to right, #000, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 5px, transparent 5px, transparent 8px)' }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
          <button className="btn-primary" style={{ width: '100%', marginBottom: '16px', padding: '12px' }}>📥 Download this label</button>
          <div style={{ backgroundColor: 'rgba(245, 230, 66, 0.1)', color: 'var(--err)', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
            💡 Labels formatted for 100×60mm thermal sticker paper. Download as PDF and send to any thermal printer.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Print options:</span>
            <span style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>All 87 labels (PDF)</span>
            <span style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Exec only (63)</span>
            <span style={{ color: '#FFF', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Salad only (24)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
