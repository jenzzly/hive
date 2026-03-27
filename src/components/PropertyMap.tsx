import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useRef } from 'react';

// Fix default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  /** Explicit coordinates (optional — falls back to geocoding locationName) */
  lat?: number;
  lng?: number;
  /** Location name to geocode when lat/lng are absent */
  locationName?: string;
  /** If true, clicking the map updates the marker and calls onChange */
  isPicker?: boolean;
  onChange?: (lat: number, lng: number) => void;
  height?: string | number;
}

// Default center: Kigali, Rwanda
const KIGALI: [number, number] = [-1.9441, 30.0619];

// — Geocode a place name via Nominatim (OSM, free, no key needed) —
async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch { /* silent */ }
  return null;
}

// — Marker that supports click-to-place —
function ClickMarker({
  position, isPicker, onChange,
}: {
  position: [number, number]; isPicker: boolean; onChange?: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState<[number, number]>(position);

  useMapEvents({
    click(e) {
      if (isPicker) {
        const next: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPos(next);
        onChange?.(next[0], next[1]);
      }
    },
  });

  // Sync when parent position changes
  useEffect(() => { setPos(position); }, [position[0], position[1]]);

  return <Marker position={pos} />;
}

// — Re-center the map when center prop changes —
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number]>(center);
  useEffect(() => {
    if (prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.flyTo(center, 13, { duration: 0.8 });
      prev.current = center;
    }
  }, [center, map]);
  return null;
}

export default function PropertyMap({
  lat, lng, locationName, isPicker = false, onChange, height = 300,
}: PropertyMapProps) {
  const [center, setCenter] = useState<[number, number]>(
    lat && lng ? [lat, lng] : KIGALI
  );
  const [resolved, setResolved] = useState(!!lat && !!lng);
  const [geocoding, setGeocoding] = useState(false);

  // When explicit coords arrive (e.g. user typed in form), jump there
  useEffect(() => {
    if (lat && lng) {
      setCenter([lat, lng]);
      setResolved(true);
    }
  }, [lat, lng]);

  // Geocode location name when no coords yet
  useEffect(() => {
    if (!lat && !lng && locationName && locationName.trim()) {
      setGeocoding(true);
      geocode(locationName).then(result => {
        if (result) { setCenter(result); setResolved(true); }
        setGeocoding(false);
      });
    }
  }, [locationName, lat, lng]);

  const osmLink = resolved
    ? `https://www.openstreetmap.org/?mlat=${center[0]}&mlon=${center[1]}#map=16/${center[0]}/${center[1]}`
    : locationName
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(locationName)}`
      : null;

  return (
    <div style={{ position: 'relative' }}>
      {geocoding && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem',
          color: 'var(--teal)', fontWeight: 600, border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          📍 Locating…
        </div>
      )}

      {isPicker && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem',
          color: 'var(--text-secondary)', border: '1px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          Click map to set location
        </div>
      )}

      <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer
          center={center}
          zoom={resolved ? 14 : 12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo center={center} />
          <ClickMarker position={center} isPicker={isPicker} onChange={(la, lo) => {
            setCenter([la, lo]);
            onChange?.(la, lo);
          }} />
        </MapContainer>
      </div>

      {osmLink && !isPicker && (
        <a
          href={osmLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 8, fontSize: '0.78rem', color: 'var(--teal)',
            fontWeight: 600, textDecoration: 'none',
          }}
        >
          🗺 Open in OpenStreetMap ↗
        </a>
      )}
    </div>
  );
}
