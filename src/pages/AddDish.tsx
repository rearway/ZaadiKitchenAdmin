import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMeal, usePhotoUpload, useImportMeals } from '@/features/menu/api/menu.queries';
import { toKeyIngredientsArray } from '@/features/menu/model/menu.schema';
import type { MealType, ImportResult } from '@/features/menu/model/menu.schema';
import { ApiError } from '@/shared/types/api';

const EMOJI_OPTIONS = ['🍛', '🥘', '🍗', '🥗', '🥙', '🍖'];
const ACCEPTED_PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

export default function AddDish() {
  const navigate = useNavigate();
  const createMeal = useCreateMeal();
  const uploadPhoto = usePhotoUpload();
  const importMeals = useImportMeals();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);

  const [mealType, setMealType] = useState<MealType>('executive');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [chefNote, setChefNote] = useState('');
  const [keyIngredients, setKeyIngredients] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const isSubmitting = createMeal.isPending || uploadPhoto.isPending;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleXlsxSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    importMeals.mutate(file, {
      onSuccess: (result) => setImportResult(result),
      onError: (err) => setError(err instanceof ApiError ? err.message : 'Import failed.'),
    });
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!nameEn.trim()) {
      setError('Meal name is required.');
      return;
    }
    setError('');

    const hasMacros = proteinG || carbsG || fatG;

    try {
      const meal = await createMeal.mutateAsync({
        name_en: nameEn.trim(),
        name_ar: nameAr.trim() || undefined,
        meal_type: mealType,
        kcal: calories ? Number(calories) : undefined,
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
        image: photoFile ?? undefined,
      });

      navigate('/menu');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create dish.');
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#FFF',
    fontSize: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    color: '#D1D5DB',
    fontWeight: 600,
    marginBottom: '8px',
  };

  const sectionLabelStyle: React.CSSProperties = {
    ...labelStyle,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => navigate(-1)}>
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontFamily: 'Montserrat, sans-serif', margin: 0 }}>
            Add Dish
          </h1>
          <span
            style={{
              backgroundColor: '#333',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Admin
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        {/* Meal Type selector */}
        <div>
          <label style={sectionLabelStyle}>Meal Type</label>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#222',
              borderRadius: '8px',
              padding: '4px',
              width: 'fit-content',
            }}
          >
            <button
              onClick={() => setMealType('executive')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                fontWeight: 600,
                backgroundColor: mealType === 'executive' ? '#333' : 'transparent',
                color: mealType === 'executive' ? '#FFF' : '#9CA3AF',
              }}
            >
              🍛 Executive
            </button>
            <button
              onClick={() => setMealType('salad')}
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                fontWeight: 600,
                backgroundColor: mealType === 'salad' ? '#333' : 'transparent',
                color: mealType === 'salad' ? '#FFF' : '#9CA3AF',
              }}
            >
              🥗 Salad
            </button>
          </div>
        </div>

        {/* XLSX Import */}
        <div>
          <label style={sectionLabelStyle}>
            Import from XLSX{' '}
            <span style={{ color: '#9CA3AF', fontWeight: 'normal', textTransform: 'none' }}>
              (name, type, macros, chef's note · max 100 rows · saves as draft)
            </span>
          </label>
          <input
            ref={xlsxInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={handleXlsxSelect}
          />
          <div
            style={{
              border: '1px dashed #444',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#222',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: 600 }}>
              Upload meal data spreadsheet
            </h4>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '16px' }}>
              .xlsx format · columns: name_en, meal_type, kcal (required) + name_ar, macros, chef_note, emoji (optional)
            </p>
            <button
              className="btn-primary"
              style={{ padding: '8px 16px', opacity: importMeals.isPending ? 0.7 : 1 }}
              disabled={importMeals.isPending}
              onClick={() => xlsxInputRef.current?.click()}
            >
              {importMeals.isPending ? 'Importing…' : 'Choose File'}
            </button>
          </div>

          {/* Import results */}
          {importResult && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: '#222',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '20px' }}>
                  {importResult.skipped_count === 0 ? '✅' : '⚠️'}
                </span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>
                    {importResult.imported_count} meal{importResult.imported_count !== 1 ? 's' : ''} imported
                    {importResult.skipped_count > 0 ? `, ${importResult.skipped_count} skipped` : ''}
                  </p>
                  {importResult.note && (
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9CA3AF' }}>
                      {importResult.note}
                    </p>
                  )}
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#F87171' }}>
                    Row errors
                  </p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} style={{ margin: 0, fontSize: '13px', color: '#9CA3AF' }}>
                      Row {e.row} · <span style={{ color: '#D1D5DB' }}>{e.field}</span> — {e.message}
                    </p>
                  ))}
                </div>
              )}

              {importResult.imported_count > 0 && (
                <button
                  className="btn-ghost"
                  style={{ alignSelf: 'flex-start', fontSize: '13px', padding: '6px 14px' }}
                  onClick={() => navigate('/menu')}
                >
                  View draft meals in library →
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
          <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: 600 }}>OR FILL MANUALLY</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }} />
        </div>

        {/* Manual fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Bilingual names */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>MEAL NAME (ENGLISH) *</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Lemon Herb Grilled Chicken"
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>MEAL NAME (ARABIC)</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم الوجبة بالعربية"
                style={{ ...fieldStyle, direction: 'rtl', textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Nutrition */}
          <div>
            <label style={sectionLabelStyle}>Nutrition info (per serving)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Calories (kcal)"
                style={fieldStyle}
              />
              <input
                type="number"
                value={proteinG}
                onChange={(e) => setProteinG(e.target.value)}
                placeholder="Protein (g)"
                style={fieldStyle}
              />
              <input
                type="number"
                value={carbsG}
                onChange={(e) => setCarbsG(e.target.value)}
                placeholder="Carbs (g)"
                style={fieldStyle}
              />
              <input
                type="number"
                value={fatG}
                onChange={(e) => setFatG(e.target.value)}
                placeholder="Fat (g)"
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Key Ingredients */}
          <div>
            <label style={labelStyle}>KEY INGREDIENTS</label>
            <input
              type="text"
              value={keyIngredients}
              onChange={(e) => setKeyIngredients(e.target.value)}
              placeholder="e.g. Lamb, Saffron rice, Dried lime"
              style={fieldStyle}
            />
          </div>

          {/* Chef's Note */}
          <div>
            <label style={labelStyle}>CHEF'S NOTE (ENGLISH)</label>
            <textarea
              value={chefNote}
              onChange={(e) => setChefNote(e.target.value)}
              placeholder="Add any specific heating or allergy notes..."
              style={{
                ...fieldStyle,
                height: '100px',
                fontFamily: 'Montserrat, sans-serif',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label style={sectionLabelStyle}>Photo</label>
            <input
              ref={photoInputRef}
              type="file"
              accept={ACCEPTED_PHOTO_TYPES}
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            {photoPreview ? (
              <div
                style={{
                  border: '1px solid #444',
                  borderRadius: '12px',
                  padding: '12px',
                  backgroundColor: '#222',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <img
                  src={photoPreview}
                  alt="preview"
                  style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{photoFile?.name}</p>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: '6px', padding: '4px 10px', fontSize: '12px' }}
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px dashed #444',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#222',
                  cursor: 'pointer',
                }}
                onClick={() => photoInputRef.current?.click()}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                <h4 style={{ margin: 0, marginBottom: '4px', fontSize: '15px', fontWeight: 600 }}>
                  Upload dish photo
                </h4>
                <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 12px' }}>
                  JPG · PNG · WebP · shown in menu & home
                </p>
                <button
                  className="btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '13px' }}
                  onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
                >
                  Choose Photo
                </button>
              </div>
            )}
            <p style={{ color: '#6B7280', fontSize: '12px', marginTop: '8px' }}>
              Photo is uploaded after the meal is created. Leave empty to use an emoji instead.
            </p>
          </div>

          {/* Emoji picker */}
          <div>
            <label style={labelStyle}>EMOJI (FALLBACK WHEN NO PHOTO)</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(selectedEmoji === emoji ? null : emoji)}
                  style={{
                    width: '48px',
                    height: '48px',
                    fontSize: '24px',
                    backgroundColor: selectedEmoji === emoji ? 'rgba(228,40,29,.10)' : '#222',
                    borderRadius: '8px',
                    border: selectedEmoji === emoji ? '2px solid var(--danger)' : '1px solid #333',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  title={selectedEmoji === emoji ? 'Click to deselect' : 'Select emoji'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220,38,38,0.1)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '32px' }}>
          <button
            className="btn-primary"
            style={{ padding: '16px 32px', fontSize: '16px', opacity: createMeal.isPending ? 0.7 : 1 }}
            disabled={createMeal.isPending}
            onClick={handleSubmit}
          >
            {createMeal.isPending ? 'Saving…' : 'Add to Library (saves as Draft)'}
          </button>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '12px' }}>
            Saved as Draft. Activate in Meal Library to assign to weeks.
          </p>
        </div>
      </div>
    </div>
  );
}
