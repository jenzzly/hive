import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  lat?: number;
  lng?: number;
  isPicker?: boolean;
  onChange?: (lat: number, lng: number) => void;
  height?: string | number;
}

// Sub-component to handle map clicks for picking location
function LocationMarker({ lat, lng, isPicker, onChange }: { 
  lat?: number, 
  lng?: number, 
  isPicker: boolean, 
  onChange?: (lat: number, lng: number) => void 
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    lat && lng ? L.latLng(lat, lng) : null
  );

  const map = useMapEvents({
    click(e) {
      if (isPicker) {
        setPosition(e.latlng);
        if (onChange) {
          onChange(e.latlng.lat, e.latlng.lng);
        }
      }
    },
  });

  // Update position if props change (e.g. from external input)
  useEffect(() => {
    if (lat && lng) {
      const newPos = L.latLng(lat, lng);
      if (!position || !position.equals(newPos)) {
        setPosition(newPos);
      }
    }
  }, [lat, lng]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

// Sub-component to re-center map when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 || center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function PropertyMap({ lat, lng, isPicker = false, onChange, height = 300 }: PropertyMapProps) {
  const defaultCenter: [number, number] = [lat || -1.9441, lng || 30.0619]; // Default to Kigali

  return (
    <div style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} isPicker={isPicker} onChange={onChange} />
        {lat && lng && <ChangeView center={[lat, lng]} />}
      </MapContainer>
    </div>
  );
}
