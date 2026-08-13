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

// ------------------------------------------------------------
// Helper component to center map when center changes
// ------------------------------------------------------------
interface ChangeViewProps {
  center: [number, number];
  zoom: number;
}

function ChangeView({ center, zoom }: ChangeViewProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

// ------------------------------------------------------------
// Location Picker
// Handles click events on the map
// ------------------------------------------------------------
interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      onLocationSelect(lat, lng);
    };

    // Attach click listener
    map.on('click', handleMapClick);

    // Remove the exact same listener when component unmounts
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onLocationSelect]);

  return null;
}

// ------------------------------------------------------------
// Map Props
// ------------------------------------------------------------
interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  children?: React.ReactNode;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// ------------------------------------------------------------
// Main Map Component
// ------------------------------------------------------------
export default function Map({
  center,
  zoom = 13,
  height = '400px',
  children,
  interactive = true,
  onLocationSelect,
}: MapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  // Keep internal map center synchronized with parent
  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{
          height: '100%',
          width: '100%',
        }}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        touchZoom={interactive}
        keyboard={interactive}
        boxZoom={interactive}
        attributionControl={true}
      >
        {/* Dark mode tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Keep map centered when location changes */}
        <ChangeView center={mapCenter} zoom={zoom} />

        {/* Enable map location selection */}
        {onLocationSelect && (
          <LocationPicker onLocationSelect={onLocationSelect} />
        )}

        {/* Markers / children supplied by parent */}
        {children}
      </MapContainer>
    </div>
  );
}