/**
 * Aegis AI – Live Operations Command Map Page
 *
 * Real-time map displaying integrated hospitals, active emergency dispatches,
 * and user geolocation with clinical telemetry.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  AlertTriangle,
  Layers,
  RefreshCw,
  X,
} from 'lucide-react';
import Map from '@/components/maps/Map';
import {
  hospitalIcon,
  emergencyIcon,
  userLocationIcon,
  selectedPinIcon,
} from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';
import { hospitalsAPI, emergenciesAPI } from '@/api/client';
import type { Hospital, EmergencyRequest } from '@/types';

interface AddressDetails {
  primary: string;
  secondary: string;
  full: string;
}

// In-memory lookup cache to prevent duplicate requests for identical coordinates
const geocodeCache: Record<string, AddressDetails> = {};

const reverseGeocode = async (lat: number, lng: number): Promise<AddressDetails | null> => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }

  const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;

  try {
    let res: Response;
    if (apiKey) {
      res = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`
      );
    } else {
      res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
    }

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};

    const primary =
      addr.road ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.amenity ||
      addr.building ||
      addr.commercial ||
      addr.name ||
      addr.city_district ||
      addr.city ||
      'Selected Location';

    const secondaryParts = [
      addr.city || addr.town || addr.village || addr.county,
      addr.state || addr.province,
      addr.country,
    ].filter(Boolean);

    const secondary = secondaryParts.join(', ');
    const full = data.display_name || `${primary}, ${secondary}`;

    const result: AddressDetails = {
      primary,
      secondary,
      full,
    };

    geocodeCache[cacheKey] = result;
    return result;
  } catch (err) {
    console.warn('[Aegis AI] Reverse geocoding lookup failed:', err);
    return null;
  }
};

export default function LiveMapPage() {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [addressData, setAddressData] = useState<AddressDetails | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showHospitals, setShowHospitals] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'critical' | 'available'>('all');

  useEffect(() => {
    fetchMapData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('[Aegis AI] User geolocation unavailable on map:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const [hospRes, emergRes] = await Promise.allSettled([
        hospitalsAPI.list(),
        emergenciesAPI.getActive(),
      ]);

      if (hospRes.status === 'fulfilled') {
        const hData = hospRes.value.data?.data || hospRes.value.data || [];
        setHospitals(Array.isArray(hData) ? hData : []);
      }

      if (emergRes.status === 'fulfilled') {
        const eData = emergRes.value.data?.data || emergRes.value.data || [];
        setEmergencies(Array.isArray(eData) ? eData : []);
      }
    } catch (error) {
      console.error('[Aegis AI] Error fetching live map data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Center calculation: user location -> first emergency -> first hospital -> default (New Delhi: 28.6139, 77.2090)
  const mapCenter = useMemo<[number, number]>(() => {
    if (userLocation) return userLocation;
    const firstEmerg = emergencies.find((e) => e.location_lat && e.location_lng);
    if (firstEmerg && firstEmerg.location_lat && firstEmerg.location_lng) {
      return [firstEmerg.location_lat, firstEmerg.location_lng];
    }
    const firstHosp = hospitals.find((h) => h.latitude && h.longitude);
    if (firstHosp && firstHosp.latitude && firstHosp.longitude) {
      return [firstHosp.latitude, firstHosp.longitude];
    }
    return [28.6139, 77.2090];
  }, [userLocation, emergencies, hospitals]);

  const filteredHospitals = useMemo(() => {
    if (!showHospitals) return [];
    if (selectedCategory === 'available') {
      return hospitals.filter((h) => (h.icu_available ?? 0) > 0 || (h.available_beds ?? 0) > 0);
    }
    return hospitals;
  }, [hospitals, showHospitals, selectedCategory]);

  const filteredEmergencies = useMemo(() => {
    if (!showEmergencies) return [];
    if (selectedCategory === 'critical') {
      return emergencies.filter((e) => e.severity >= 4);
    }
    return emergencies;
  }, [emergencies, showEmergencies, selectedCategory]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setAddressLoading(true);
    setAddressData(null);

    const resolved = await reverseGeocode(lat, lng);
    setAddressData(resolved);
    setAddressLoading(false);
  };

  const handleClearPin = () => {
    setSelectedLocation(null);
    setAddressData(null);
    setAddressLoading(false);
  };

  const handleRequestEmergency = () => {
    if (!selectedLocation) return;
    navigate('/emergency', {
      state: {
        lat: selectedLocation[0],
        lng: selectedLocation[1],
        hospitalAddress: addressData?.full || '',
      },
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
            <MapPin size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                Live Operations Command Map
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Real-time regional facility GIS, ambulance telemetry, and active emergency incident coordinates
            </p>
          </div>
        </div>

        {/* REFRESH ACTION */}
        <button
          type="button"
          onClick={fetchMapData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync GIS Data</span>
        </button>
      </div>

      {/* FILTER & LAYER TOGGLE CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mr-1">
            <Layers size={14} /> Layers:
          </span>

          <button
            type="button"
            onClick={() => setShowHospitals((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              showHospitals
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
            }`}
          >
            <Building2 size={14} />
            <span>Hospitals</span>
            <span className="font-mono text-[11px] opacity-75">({hospitals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmergencies((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              showEmergencies
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-muted)]'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Active SOS</span>
            <span className="font-mono text-[11px] opacity-75">({emergencies.length})</span>
          </button>
        </div>

        {/* PRIORITY FILTER PILLS */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-[var(--primary-600)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('critical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Critical Only
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('available')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            With Beds
          </button>
        </div>
      </div>

      {/* SELECTED LOCATION BAR (IF PIN ACTIVE) */}
      {selectedLocation && (
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
              <MapPin size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Selected Location
                </span>
                {addressLoading && (
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" />
                    Finding location...
                  </span>
                )}
              </div>

              {addressData ? (
                <div className="mt-0.5">
                  <strong className="text-sm font-bold text-[var(--text-primary)] block truncate">
                    {addressData.primary}
                  </strong>
                  {addressData.secondary && (
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {addressData.secondary}
                    </p>
                  )}
                </div>
              ) : !addressLoading ? (
                <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                  Custom Location Pin
                </p>
              ) : null}

              <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleClearPin}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--bg-hover)] transition-all flex items-center gap-1.5"
            >
              <X size={13} />
              <span>Clear Pin</span>
            </button>

            <button
              type="button"
              onClick={handleRequestEmergency}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs flex-1 sm:flex-initial justify-center"
            >
              <AlertTriangle size={14} />
              <span>Request Emergency Here</span>
            </button>
          </div>
        </div>
      )}

      {/* MAP CONTAINER */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs relative">
        <div className="w-full h-[520px] sm:h-[600px] relative">
          <Map
            center={mapCenter}
            zoom={13}
            height="100%"
            onLocationSelect={handleLocationSelect}
          >
            {/* USER LOCATION MARKER */}
            {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>
                  <div className="p-1 min-w-[140px]">
                    <p className="font-bold text-xs text-[var(--text-primary)]">Your Current Coordinates</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* TEMPORARY SELECTED LOCATION PIN */}
            {selectedLocation && (
              <Marker position={selectedLocation} icon={selectedPinIcon}>
                <Popup>
                  <div className="p-1 min-w-[220px] max-w-[280px] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} />
                        Selected Location
                      </span>
                      <button
                        type="button"
                        onClick={handleClearPin}
                        className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                      >
                        Clear Pin
                      </button>
                    </div>

                    {/* ADDRESS SECTION */}
                    {addressLoading ? (
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <RefreshCw size={12} className="animate-spin text-indigo-500" />
                        <span>Finding location address...</span>
                      </div>
                    ) : addressData ? (
                      <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] space-y-0.5">
                        <p className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                          📍 {addressData.primary}
                        </p>
                        {addressData.secondary && (
                          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                            {addressData.secondary}
                          </p>
                        )}
                      </div>
                    ) : null}

                    {/* COORDINATES */}
                    <div className="space-y-1 bg-[var(--bg-tertiary)] p-2 rounded-lg text-xs font-mono">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span className="text-[var(--text-muted)]">Latitude:</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {selectedLocation[0].toFixed(5)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span className="text-[var(--text-muted)]">Longitude:</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {selectedLocation[1].toFixed(5)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={handleRequestEmergency}
                        className="w-full py-2 px-3 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500 shadow-xs transition-colors"
                      >
                        <AlertTriangle size={14} />
                        <span>Request Emergency Here</span>
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* HOSPITALS MARKERS */}
            {filteredHospitals.map((hosp) => {
              if (!hosp.latitude || !hosp.longitude) return null;

              return (
                <Marker
                  key={hosp.id}
                  position={[hosp.latitude, hosp.longitude]}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px] space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          Medical Center
                        </span>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{hosp.name}</h4>
                        <p className="text-xs text-[var(--text-muted)]">{hosp.address}, {hosp.city}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-1 border-t border-[var(--border-color)]">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">ICU Beds</span>
                          <span className="font-bold text-emerald-600">{hosp.icu_available ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">General Beds</span>
                          <span className="font-bold text-blue-600">{hosp.available_beds ?? 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block">Ventilators</span>
                          <span className="font-bold text-amber-600">{hosp.ventilators_available ?? 'N/A'}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/hospitals/${hosp.id}`)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-[var(--primary-600)] text-white text-xs font-semibold text-center hover:bg-[var(--primary-500)] transition-colors"
                        >
                          View Facility
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ACTIVE EMERGENCIES MARKERS */}
            {filteredEmergencies.map((emerg) => {
              if (!emerg.location_lat || !emerg.location_lng) return null;

              return (
                <Marker
                  key={emerg.id}
                  position={[emerg.location_lat, emerg.location_lng]}
                  icon={emergencyIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                          Active Incident
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                          Severity {emerg.severity}/5
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)] capitalize">
                          {emerg.emergency_type} Emergency
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">
                          {emerg.description || emerg.location_address || 'Patient triage in progress'}
                        </p>
                      </div>

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/emergencies/${emerg.id}`)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold text-center hover:bg-rose-500 transition-colors"
                        >
                          Triage Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </Map>
        </div>

        {/* MAP LEGEND FOOTER */}
        <div className="p-3.5 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white dark:border-slate-800" />
              <span>Hospital Facility ({filteredHospitals.length})</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 border border-white dark:border-slate-800 animate-pulse" />
              <span>Active Emergency ({filteredEmergencies.length})</span>
            </span>

            {selectedLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 border border-white dark:border-slate-800 animate-pulse" />
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Selected Map Pin</span>
              </span>
            )}

            {userLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-slate-800" />
                <span>Command Center Location</span>
              </span>
            )}
          </div>

          <span className="text-[11px] text-[var(--text-muted)]">
            GIS Map Engine • OpenStreetMap Layer
          </span>
        </div>
      </div>
    </div>
  );
}
