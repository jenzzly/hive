import { useState } from 'react';

interface Props {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return (
    <div style={styles.empty}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal-mid)" strokeWidth="1.2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.9rem' }}>No images available</p>
    </div>
  );

  return (
    <div>
      {/* Main image */}
      <div style={styles.mainWrap} onClick={() => setLightbox(true)}>
        <img src={images[active]} alt={title} style={styles.mainImage} />
        {images.length > 1 && (
          <>
            <button style={{ ...styles.navBtn, left: 12 }} onClick={e => { e.stopPropagation(); setActive(i => Math.max(0, i - 1)); }}>‹</button>
            <button style={{ ...styles.navBtn, right: 12 }} onClick={e => { e.stopPropagation(); setActive(i => Math.min(images.length - 1, i + 1)); }}>›</button>
          </>
        )}
        <div style={styles.counter}>{active + 1} / {images.length}</div>
        <div style={styles.expandHint}>Click to expand</div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={styles.thumbRow}>
          {images.map((src, i) => (
            <button key={i} style={{ ...styles.thumb, ...(i === active ? styles.thumbActive : {}) }} onClick={() => setActive(i)}>
              <img src={src} alt="" style={styles.thumbImg} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div style={styles.lightbox} onClick={() => setLightbox(false)}>
          <button style={styles.closeBtn} onClick={() => setLightbox(false)}>✕</button>
          <img src={images[active]} alt={title} style={styles.lightboxImg} onClick={e => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button style={{ ...styles.lbNav, left: 20 }} onClick={e => { e.stopPropagation(); setActive(i => Math.max(0, i - 1)); }}>‹</button>
              <button style={{ ...styles.lbNav, right: 20 }} onClick={e => { e.stopPropagation(); setActive(i => Math.min(images.length - 1, i + 1)); }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    background: 'var(--surface2)',
    borderRadius: 'var(--radius-lg)',
    aspectRatio: '16/9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainWrap: {
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    aspectRatio: '16/9',
    maxHeight: 'min(620px, 80vh)',
    cursor: 'pointer',
    background: '#000',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.2s',
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    fontSize: '1.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: '0.78rem',
    padding: '3px 10px',
    borderRadius: 20,
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: '0.72rem',
    padding: '3px 10px',
    borderRadius: 20,
    opacity: 0.8,
  },
  thumbRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    overflowX: 'auto',
    paddingBottom: 4,
  },
  thumb: {
    flexShrink: 0,
    width: 72,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    background: 'none',
    padding: 0,
  },
  thumbActive: {
    border: '2px solid var(--teal)',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  lightbox: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.92)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    fontSize: '1.1rem',
    width: 40,
    height: 40,
    borderRadius: '50%',
    cursor: 'pointer',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: 8,
  },
  lbNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 48,
    height: 48,
    fontSize: '1.8rem',
    cursor: 'pointer',
  },
};
