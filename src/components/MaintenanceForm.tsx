import { useState } from 'react';
import { uploadMultiple } from '../utils/cloudinaryUpload';
import type { MaintenancePriority, MaintenanceRequest } from '../types';

interface Props {
  propertyId: string;
  tenantId: string;
  initialData?: Partial<MaintenanceRequest>;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export default function MaintenanceForm({ propertyId, tenantId, initialData, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<MaintenancePriority>(initialData?.priority || 'medium');
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setError('Please fill all required fields.'); return; }
    setLoading(true);
    setError('');
    try {
      let imageUrls = [...existingImages];
      if (files.length) {
        const uploaded = await uploadMultiple(files, 'maintenance');
        imageUrls = [...imageUrls, ...uploaded];
      }
      await onSubmit({ 
        title, description, priority, 
        images: imageUrls, 
        propertyId, tenantId,
        id: initialData?.id 
      });
      if (!initialData) {
        setTitle(''); setDescription(''); setPriority('medium'); setFiles([]); setExistingImages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.title}>Submit Maintenance Request</div>

      {error && <div style={styles.error}>{error}</div>}

      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Leaking kitchen tap" />
      </div>

      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} />
      </div>

      <div className="form-group">
        <label className="form-label">Priority</label>
        <select className="form-input" value={priority} onChange={e => setPriority(e.target.value as MaintenancePriority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Images</label>
        {existingImages.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {existingImages.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={img} alt="" style={{ width: 62, height: 48, objectFit: 'cover', borderRadius: 4 }} />
                <button 
                  type="button" 
                  onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                  style={styles.removeImg}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={styles.fileWrap}>
          <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files || []))} style={styles.fileInput} id="maint-images" />
          <label htmlFor="maint-images" style={styles.fileLabel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            {files.length ? `${files.length} file(s) selected` : 'Add more images'}
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
          {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {initialData ? 'Updating...' : 'Submitting...'}</> : (initialData ? 'Update Request' : 'Submit Request')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
        )}
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: '0.88rem',
  },
  fileWrap: { position: 'relative' },
  fileInput: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: '1.5px dashed var(--border-strong)',
    borderRadius: 8,
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    background: 'var(--surface2)',
  },
  removeImg: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: '50%',
    background: '#ef4444', color: '#fff', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
};
