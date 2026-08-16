/**
 * Aegis AI – Map Component
 *
 * Uses Leaflet to display map, markers, and routing.
 * Resilient against geolocation errors, tile failures, and initialization errors.
 */

import React, { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle } from 'lucide-react';

// Fix Leaflet's default icon issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const DEFAULT_FALLBACK_COORDS: [number, number] = [28.6139, 77.2090];

function sanitizeCoords(coords?: [number, number] | null): [number, number] {
  if (!coords || !Array.isArray(coords) || coords.length < 2) {
    return DEFAULT_FALLBACK_COORDS;
  }
  const [lat, lng] = coords;
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return DEFAULT_FALLBACK_COORDS;
  }
  return [lat, lng];
}

// ------------------------------------------------------------
// Map Error Boundary
// ------------------------------------------------------------
interface MapErrorBoundaryProps {
  children: ReactNode;
  fallbackCoords: [number, number];
  height: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  public state: MapErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Aegis AI] Leaflet Map rendering error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const [lat, lng] = this.props.fallbackCoords;
      return (
        <div
          style={{
            height: this.props.height,
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <AlertCircle size={24} style={{ color: 'var(--danger-400)' }} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
            Interactive Map Unavailable
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, maxWidth: 320 }}>
            Unable to render map tiles. Using coordinates ({lat.toFixed(4)}, {lng.toFixed(4)}). You can still proceed with emergency requests.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    try {
      map.setView(center, zoom);
    } catch {
      // Ignore setView errors on unmounted map
    }
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

    map.on('click', handleMapClick);

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
  const validCenter = sanitizeCoords(center);
  const [mapCenter, setMapCenter] = useState<[number, number]>(validCenter);

  // Keep internal map center synchronized with parent
  useEffect(() => {
    setMapCenter(sanitizeCoords(center));
  }, [center]);

  return (
    <MapErrorBoundary fallbackCoords={mapCenter} height={height}>
      <div
        style={{
          height,
          minHeight: height,
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{
            height: '100%',
            width: '100%',
            minHeight: height,
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
          {/* Reliable OpenStreetMap standard tile layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
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
    </MapErrorBoundary>
  );
}