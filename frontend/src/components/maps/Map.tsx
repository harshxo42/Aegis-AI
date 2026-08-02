/**
 * Aegis AI – Map Component
 *
 * Uses Leaflet to display map, markers, and routing.
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Helper component to center map on user location if it changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

// Helper to handle clicks on the map for picking location
function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const map = useMap();

  useEffect(() => {
    map.on('click', (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });
    return () => {
      map.off('click');
    };
  }, [map, onLocationSelect]);

  return null;
}

interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  children?: React.ReactNode;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function Map({
  center,
  zoom = 13,
  height = '400px',
  children,
  interactive = true,
  onLocationSelect,
}: MapProps) {
  // Use state to track center to allow dynamic updates
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  
  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
      >
        {/* Dark mode tile layer for modern look */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={mapCenter} zoom={zoom} />
        {onLocationSelect && <LocationPicker onLocationSelect={onLocationSelect} />}
        {children}
      </MapContainer>
    </div>
  );
}
