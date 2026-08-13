/**
 * Aegis AI – Emergency SOS Page
 *
 * Patient interface to request emergency assistance with location picking.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { emergenciesAPI } from '@/api/client';
import Map from '@/components/maps/Map';
import { userLocationIcon } from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';
import { AlertTriangle, Phone, ShieldAlert, HeartPulse, Activity, ChevronRight } from 'lucide-react';
import type { EmergencyType } from '@/types';

const emergencyTypes: { value: EmergencyType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'cardiac', label: 'Cardiac / Heart', icon: <HeartPulse size={24} />, color: '#ef4444' },
  { value: 'trauma', label: 'Trauma / Accident', icon: <Activity size={24} />, color: '#f97316' },
  { value: 'stroke', label: 'Stroke', icon: <AlertTriangle size={24} />, color: '#8b5cf6' },
  { value: 'breathing', label: 'Breathing Difficulty', icon: <Activity size={24} />, color: '#06b6d4' },
  { value: 'other', label: 'Other Emergency', icon: <ShieldAlert size={24} />, color: '#64748b' },
];

export default function EmergencySOSPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Type, 2: Location & Details

  const [formData, setFormData] = useState({
    emergency_type: 'other' as EmergencyType,
    severity: 4,
    description: '',
    symptoms: '',
    location_lat: 28.6139, // Default to New Delhi
    location_lng: 77.2090,
    location_address: '',
  });

  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');

  // Try to get user location automatically
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude,
          }));
          setLocationStatus('success');
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus('error');
          toast.error("Could not get your exact location. Please pinpoint it on the map.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, location_lat: lat, location_lng: lng }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_lat || !formData.location_lng) {
      toast.error("Please provide a location for the emergency.");
      return;
    }

    try {
      setLoading(true);
      const res = await emergenciesAPI.create(formData);
      toast.success(res.data.message || "Emergency requested successfully!");
      // Redirect to emergencies list to track status
      navigate('/emergencies');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create emergency request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)' }}
        >
          <Phone size={36} style={{ color: 'var(--danger-500)' }} />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-2">Emergency SOS</h1>
        <p className="text-gray-400">Request immediate medical assistance</p>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Progress Bar */}
        <div className="flex bg-[var(--bg-tertiary)]">
          <div className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${step === 1 ? 'bg-[var(--danger-500)] text-white' : 'text-gray-400'}`}>
            1. Emergency Type
          </div>
          <div className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${step === 2 ? 'bg-[var(--danger-500)] text-white' : 'text-gray-400'}`}>
            2. Location & Details
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4 text-center">What is the nature of the emergency?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {emergencyTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFormData({ ...formData, emergency_type: type.value })}
                      className="p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all"
                      style={{
                        borderColor: formData.emergency_type === type.value ? type.color : 'var(--border-color)',
                        background: formData.emergency_type === type.value ? `${type.color}20` : 'var(--bg-tertiary)',
                        color: formData.emergency_type === type.value ? 'white' : 'var(--text-muted)'
                      }}
                    >
                      <div style={{ color: type.color }}>{type.icon}</div>
                      <span className="font-medium text-center">{type.label}</span>
                    </motion.button>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                  <label className="block text-sm font-medium mb-3 text-gray-300">Severity Level: {formData.severity} / 5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                    className="w-full accent-[var(--danger-500)] h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Non-Urgent (1)</span>
                    <span>Moderate (3)</span>
                    <span className="text-[var(--danger-400)] font-medium">Critical (5)</span>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStep(2)}
                    className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, var(--danger-600), var(--danger-500))' }}
                  >
                    Next Step <ChevronRight size={18} />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Map Section */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium mb-3 text-gray-300">
                      <span>Confirm Location</span>
                      <span className="text-xs text-gray-500">
                        {locationStatus === 'fetching' ? 'Locating you...' : locationStatus === 'success' ? 'Location found' : 'Click map to set location'}
                      </span>
                    </label>
                    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg p-1 bg-[var(--bg-tertiary)]">
                      <Map 
                        center={[formData.location_lat, formData.location_lng]} 
                        zoom={14} 
                        height="300px"
                        onLocationSelect={handleLocationSelect}
                      >
                        <Marker position={[formData.location_lat, formData.location_lng]} icon={userLocationIcon}>
                          <Popup>Emergency Location</Popup>
                        </Marker>
                      </Map>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="E.g., Second floor apartment, gate code 1234, patient is unconscious..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--danger-500)] resize-y min-h-[6rem] max-h-64"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-xl font-medium"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      Back
                    </button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 rounded-xl font-bold text-white flex justify-center items-center gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--danger-600), var(--danger-500))',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <AlertTriangle size={20} />
                          DISPATCH AMBULANCE NOW
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Important Notice */}
      <div className="p-4 rounded-xl flex gap-3 text-sm" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
        <ShieldAlert size={20} style={{ color: 'var(--warning-500)', flexShrink: 0 }} />
        <p className="text-gray-300">
          <strong className="text-[var(--warning-400)]">Warning:</strong> False emergency requests are a punishable offense. 
          Use this feature only in genuine medical emergencies. For non-emergencies, please book a regular consultation.
        </p>
      </div>
    </div>
  );
}
