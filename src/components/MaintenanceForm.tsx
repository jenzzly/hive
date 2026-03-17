import { useState } from 'react';
import { uploadMultiple } from '../utils/cloudinaryUpload';
import type { MaintenancePriority } from '../types';

interface Props {
  propertyId: string;
  tenantId: string;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: MaintenancePriority;
    images: string[];
    propertyId: string;
    tenantId: string;
  }) => Promise<void>;
}

export default function MaintenanceForm({ propertyId, tenantId, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setError('Please fill all required fields.'); return; }
    setLoading(true);
    setError('');
    try {
      let imageUrls: string[] = [];
      if (files.length) imageUrls = await uploadMultiple(files, 'maintenance');
      await onSubmit({ title, description, priority, images: imageUrls, propertyId, tenantId });
      setTitle(''); setDescription(''); setPriority('medium'); setFiles([]);
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
        <label className="form-label">Attach Images (optional)</label>
        <div style={styles.fileWrap}>
          <input type="file" multiple accept="image/*" onChange={e => setFiles(Array.from(e.target.files || []))} style={styles.fileInput} id="maint-images" />
          <label htmlFor="maint-images" style={styles.fileLabel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            {files.length ? `${files.length} file(s) selected` : 'Choose images'}
          </label>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting...</> : 'Submit Request'}
      </button>
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
};
