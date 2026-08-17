/**
 * Aegis AI – Emergency SOS Page
 *
 * Enterprise Emergency Request & Dispatch Interface
 * Supports hospital selection, live GPS pinpointing, and instant ambulance dispatch.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { emergenciesAPI } from '@/api/client';
import Map from '@/components/maps/Map';
import { userLocationIcon } from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';

import {
  AlertTriangle,
  Phone,
  ShieldAlert,
  HeartPulse,
  Activity,
  ChevronRight,
  ChevronLeft,
  Ambulance,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';

import type { EmergencyType } from '@/types';

const emergencyTypes: {
  value: EmergencyType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: 'cardiac',
    label: 'Cardiac / Heart',
    sublabel: 'Chest pain, arrest, palpitations',
    icon: <HeartPulse size={24} />,
    color: '#ef4444',
  },
  {
    value: 'trauma',
    label: 'Trauma / Accident',
    sublabel: 'Severe bleeding, collision, fracture',
    icon: <Activity size={24} />,
    color: '#f97316',
  },
  {
    value: 'stroke',
    label: 'Stroke / Neuro',
    sublabel: 'Facial droop, numbness, speech loss',
    icon: <AlertTriangle size={24} />,
    color: '#8b5cf6',
  },
  {
    value: 'breathing',
    label: 'Respiratory Distress',
    sublabel: 'Severe asthma, choking, hypoxia',
    icon: <Activity size={24} />,
    color: '#06b6d4',
  },
  {
    value: 'other',
    label: 'Other Medical Emergency',
    sublabel: 'Severe allergic reaction, acute illness',
    icon: <ShieldAlert size={24} />,
    color: '#64748b',
  },
];

type LocationStatus = 'idle' | 'fetching' | 'success' | 'error';

const SEVERITY_LEVELS: Record<number, { label: string; desc: string; color: string; bg: string }> = {
  1: { label: 'Level 1 – Minor', desc: 'Non-life-threatening condition, stable vitals', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  2: { label: 'Level 2 – Low Urgency', desc: 'Moderate discomfort, requires medical evaluation', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  3: { label: 'Level 3 – Moderate Urgency', desc: 'Significant symptoms, potential complication risk', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  4: { label: 'Level 4 – High Urgency', desc: 'Severe distress, rapid ambulance intervention required', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  5: { label: 'Level 5 – Critical / Life Threatening', desc: 'Immediate resuscitation / emergency life support needed', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
};

export default function EmergencySOSPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const selectedHospital = routerLocation.state as {
    hospitalId?: string;
    hospitalName?: string;
    hospitalAddress?: string;
  } | null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    hospital_id: selectedHospital?.hospitalId || '',
    emergency_type: 'other' as EmergencyType,
    severity: 4,
    description: '',
    symptoms: '',
    location_lat: 28.6139,
    location_lng: 77.209,
    location_address: selectedHospital?.hospitalAddress || '',
  });

  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  // -------------------------------
  // Auto Detect Location
  // -------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('fetching');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
        }));
        setLocationStatus('success');
      },
      (err) => {
        console.warn('[Aegis AI] Geolocation access unavailable/denied:', err);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // -------------------------------
  // Map Selection
  // -------------------------------
  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      location_lat: lat,
      location_lng: lng,
    }));
    setLocationStatus('success');
  };

  // -------------------------------
  // Emergency Submit
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const response = await emergenciesAPI.create({
        hospital_id: formData.hospital_id || undefined,
        emergency_type: formData.emergency_type,
        severity: formData.severity,
        description: formData.description.trim(),
        symptoms: formData.symptoms.trim(),
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        location_address: formData.location_address.trim(),
      });

      toast.success(
        response.data?.message || 'Emergency request registered. Responders alerted.'
      );

      const createdId = response.data?.data?.id;
      if (createdId) {
        navigate(`/emergencies/${createdId}`, {
          replace: true,
        });
      } else {
        navigate('/emergencies', {
          replace: true,
        });
      }
    } catch (error: any) {
      console.error('Emergency error:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to create emergency request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currentSeverity = SEVERITY_LEVELS[formData.severity] || SEVERITY_LEVELS[4];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* HEADER */}
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm"
        >
          <Phone size={28} />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Emergency SOS Dispatch
        </h1>

        <p className="text-sm text-[var(--text-muted)] mt-1 max-w-md mx-auto">
          Request immediate critical care dispatch, nearest ambulance routing, and hospital intake alert.
        </p>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        {/* STEP PROGRESS BAR */}
        <div className="grid grid-cols-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3.5 px-4 text-center text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              step === 1
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step === 1 ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
            }`}>1</span>
            <span>Emergency Triage</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-3.5 px-4 text-center text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              step === 2
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]/50'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              step === 2 ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
            }`}>2</span>
            <span>Location & Dispatch Details</span>
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Step 1: Select Emergency Category
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Categorize the primary incident to alert appropriately equipped responders.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {emergencyTypes.map((type) => {
                    const isSelected = formData.emergency_type === type.value;

                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            emergency_type: type.value,
                          }))
                        }
                        className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/10 shadow-xs ring-2 ring-rose-500/20'
                            : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--border-light)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: `${type.color}18`,
                              color: type.color,
                            }}
                          >
                            {type.icon}
                          </div>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {type.label}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
                            {type.sublabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SEVERITY */}
                <div className="pt-6 border-t border-[var(--border-color)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-sm font-bold text-[var(--text-primary)] block">
                        Triage Severity Priority
                      </label>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Estimate clinical urgency for ambulance dispatch routing
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${currentSeverity.bg} ${currentSeverity.color}`}>
                      {currentSeverity.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          severity: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-rose-600 cursor-pointer h-2 bg-[var(--border-color)] rounded-lg"
                    />

                    <div className="flex justify-between text-[11px] font-semibold text-[var(--text-muted)] px-1">
                      <span>1 (Minor)</span>
                      <span>2 (Low)</span>
                      <span>3 (Moderate)</span>
                      <span>4 (Urgent)</span>
                      <span>5 (Critical)</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--bg-tertiary)] p-3 rounded-xl border border-[var(--border-color)]">
                    {currentSeverity.desc}
                  </p>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 shadow-sm transition-all"
                  >
                    <span>Proceed to Location & Details</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* PREFERRED HOSPITAL */}
                  {selectedHospital?.hospitalName && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
                      <Building2 size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                          Target Facility Routed
                        </p>
                        <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                          {selectedHospital.hospitalName}
                        </p>
                        {selectedHospital.hospitalAddress && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {selectedHospital.hospitalAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* LOCATION & MAP */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                        <MapPin size={16} className="text-rose-500" />
                        Incident Coordinates & Map Pin
                      </span>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]">
                        {locationStatus === 'fetching'
                          ? 'Detecting GPS...'
                          : locationStatus === 'success'
                          ? 'GPS Locked'
                          : 'Manual Pin'}
                      </span>
                    </div>

                    {locationStatus === 'error' && (
                      <div className="p-3 rounded-xl flex items-start gap-2.5 text-xs bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300">
                        <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>
                          Location access is unavailable. Default coordinates (28.6139, 77.2090) are set. Click anywhere on the map to pinpoint your exact location.
                        </span>
                      </div>
                    )}

                    <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs relative">
                      <Map
                        center={[formData.location_lat, formData.location_lng]}
                        zoom={14}
                        height="300px"
                        onLocationSelect={handleLocationSelect}
                      >
                        <Marker
                          position={[formData.location_lat, formData.location_lng]}
                          icon={userLocationIcon}
                        >
                          <Popup>
                            Emergency Incident Location ({formData.location_lat.toFixed(4)},{' '}
                            {formData.location_lng.toFixed(4)})
                          </Popup>
                        </Marker>
                      </Map>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                      <span className="font-mono">
                        Lat: {formData.location_lat.toFixed(4)}, Lng: {formData.location_lng.toFixed(4)}
                      </span>
                      <span>Click map to reposition pin</span>
                    </div>
                  </div>

                  {/* ADDRESS / LANDMARK */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1.5">
                      Street Address / Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.location_address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location_address: e.target.value,
                        }))
                      }
                      placeholder="e.g. Block C, Flat 402, Near City Metro Gate 3"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1.5">
                      Emergency Notes & Patient Status
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the condition, patient age, consciousness, or building entry instructions..."
                      className="w-full min-h-[90px] p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* SYMPTOMS */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-1.5">
                      Observed Symptoms
                    </label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          symptoms: e.target.value,
                        }))
                      }
                      placeholder="e.g., Shortness of breath, severe chest pressure, disorientation..."
                      className="w-full min-h-[80px] p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 px-6 rounded-xl text-white font-bold text-sm flex justify-center items-center gap-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] transition-all disabled:opacity-50 shadow-sm"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>TRANSMITTING SOS DISPATCH...</span>
                        </>
                      ) : (
                        <>
                          <Ambulance size={19} />
                          <span>DISPATCH AMBULANCE NOW</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* WARNING NOTICE */}
      <div className="p-4 rounded-xl flex items-start gap-3 text-xs bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300">
        <AlertCircle size={17} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold text-amber-600 dark:text-amber-400">Emergency Protocol Notice: </strong>
          False emergency requests compromise active lifesaving services. Submit only for verified medical emergencies. In case of immediate life hazard, also dial standard regional emergency services.
        </p>
      </div>
    </div>
  );
}