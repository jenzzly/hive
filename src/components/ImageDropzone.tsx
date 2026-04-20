import { useState, useRef, useCallback } from 'react';

interface Props {
  images: string[];           // current image URLs (Cloudflare / blob previews)
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  uploading?: boolean;
  maxImages?: number;
  label?: string;
}

export default function ImageDropzone({
  images,
  onAdd,
  onRemove,
  uploading = false,
  maxImages = 10,
  label = 'Property photos',
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = images.length < maxImages;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || !canAdd) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, maxImages - images.length);
    if (valid.length) onAdd(valid);
  }, [canAdd, images.length, maxImages, onAdd]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.85rem', fontWeight: 600,
        color: '#595959', marginBottom: 8,
      }}>{label}</label>

      {/* Drop zone */}
      {canAdd && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#0071c2' : '#d4d4d4'}`,
            borderRadius: 8,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#eff6ff' : '#fafafa',
            transition: 'all 0.15s',
            marginBottom: images.length > 0 ? 12 : 0,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span className="spinner" style={{ width: 20, height: 20, borderColor: '#d4d4d4', borderTopColor: '#0071c2' }} />
              <span style={{ fontSize: '0.88rem', color: '#737373' }}>Uploading photos…</span>
            </div>
          ) : (
            <>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: dragging ? '#0071c2' : '#e7e7e7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', transition: 'background 0.15s',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#fff' : '#737373'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: dragging ? '#0071c2' : '#1a1a1a', marginBottom: 4 }}>
                {dragging ? 'Drop photos here' : 'Drop photos here, or click to choose'}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#a0a0a0' }}>
                PNG, JPG, WEBP · Max {maxImages} photos · {images.length}/{maxImages} added
              </p>
            </>
          )}
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: 8,
        }}>
          {images.map((src, i) => (
            <div key={src + i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid #e7e7e7' }}>
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {i === 0 && (
                <span style={{
                  position: 'absolute', top: 4, left: 4,
                  background: '#003580', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                }}>MAIN</span>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.55)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', transition: 'background 0.15s',
                }}
                title="Remove photo"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {canAdd && (
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                aspectRatio: '1', borderRadius: 6, border: '2px dashed #d4d4d4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: '#fafafa', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0071c2'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4d4d4'; e.currentTarget.style.background = '#fafafa'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
