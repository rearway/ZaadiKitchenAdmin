import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddDish() {
  const navigate = useNavigate();
  const [type, setType] = useState<'Executive' | 'Salad'>('Executive');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>&larr;</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontFamily: "Montserrat, sans-serif", margin: 0 }}>Add Dish</h1>
          <span style={{ backgroundColor: '#333', color: '#FFF', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
            Admin
          </span>
        </div>
      </div>

      <div style={{ backgroundColor: '#1A1A1A', padding: '32px', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Meal Type selector */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '12px' }}>Meal Type</label>
          <div style={{ display: 'flex', backgroundColor: '#222', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
            <button 
              onClick={() => setType('Executive')}
              style={{ padding: '8px 24px', borderRadius: '6px', fontWeight: 600, backgroundColor: type === 'Executive' ? '#333' : 'transparent', color: type === 'Executive' ? '#FFF' : '#9CA3AF' }}
            >
              🍛 Executive
            </button>
            <button 
              onClick={() => setType('Salad')}
              style={{ padding: '8px 24px', borderRadius: '6px', fontWeight: 600, backgroundColor: type === 'Salad' ? '#333' : 'transparent', color: type === 'Salad' ? '#FFF' : '#9CA3AF' }}
            >
              🥗 Salad
            </button>
          </div>
        </div>

        {/* XLSX Import */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            IMPORT FROM XLSX <span style={{ color: '#9CA3AF', fontWeight: 'normal', textTransform: 'none' }}>(imports name, type, macros, Chef's Note)</span>
          </label>
          <div style={{ border: '1px dashed #444', borderRadius: '12px', padding: '32px', textAlign: 'center', backgroundColor: '#222' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: 600 }}>Upload meal data spreadsheet</h4>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '16px' }}>.xlsx format · macros auto-filled from columns</p>
            <button className="btn-primary" style={{ padding: '8px 16px' }}>Choose File</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
          <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
        </div>

        {/* Manual fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>MEAL NAME (ENGLISH)</label>
            <input type="text" placeholder="e.g. Lemon Herb Grilled Chicken" style={{ width: '100%', backgroundColor: '#222' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '12px' }}>NUTRITION INFO (PER SERVING)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input type="number" placeholder="Calories" style={{ width: '100%', backgroundColor: '#222' }} />
              <input type="number" placeholder="Protein (g)" style={{ width: '100%', backgroundColor: '#222' }} />
              <input type="number" placeholder="Carbs (g)" style={{ width: '100%', backgroundColor: '#222' }} />
              <input type="number" placeholder="Fat (g)" style={{ width: '100%', backgroundColor: '#222' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>CHEF'S NOTE (ENGLISH)</label>
            <textarea placeholder="Add any specific heating or allergy notes..." style={{ width: '100%', height: '100px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '8px', padding: '12px', color: '#FFF', fontFamily: "Montserrat, sans-serif", resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>PHOTO</label>
            <div style={{ border: '1px dashed #444', borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#222' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
              <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '15px', fontWeight: 600 }}>Upload dish photo</h4>
              <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>JPG/PNG · max 5MB · shown in menu & home</p>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#D1D5DB', fontWeight: 600, marginBottom: '8px' }}>EMOJI (IF NO PHOTO)</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['🍛', '🥘', '🍗', '🥗', '➕'].map(emoji => (
                <button key={emoji} style={{ width: '48px', height: '48px', fontSize: '24px', backgroundColor: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '32px' }}>
          <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }} onClick={() => navigate('/menu')}>
            Add to Library (saves as Draft)
          </button>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '12px' }}>Saved as Draft. Activate in Meal Library to assign to weeks.</p>
        </div>

      </div>
    </div>
  );
}
