/**
 * Aegis AI – Ambulance Dashboard
 *
 * Interface for ambulance drivers to view dispatched emergencies and update locations.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';

import Map from '@/components/maps/Map';
import { ambulanceIcon, emergencyIcon } from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';
import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';
import { toast } from 'react-hot-toast';

export default function AmbulanceDashboardPage() {
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mock ambulance location (usually comes from GPS)
  const [location] = useState<[number, number]>([28.6139, 77.2090]);

  useEffect(() => {
    fetchActiveDispatch();
  }, []);

  const fetchActiveDispatch = async () => {
    try {
      setLoading(true);
      // In a real app, backend would filter by ambulance_id/driver_id
      const res = await emergenciesAPI.list({ status: 'dispatched' });
      if (res.data.data && res.data.data.length > 0) {
        // Assume first dispatched is ours for demo
        setActiveEmergency(res.data.data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!activeEmergency) return;
    try {
      const res = await emergenciesAPI.updateStatus(activeEmergency.id, { status });
      setActiveEmergency(res.data.data);
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      if (status === 'resolved') {
        setActiveEmergency(null);
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-1 border-b border-[var(--border-color)] pb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs flex-shrink-0">
          <Truck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ambulance Fleet Terminal</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Live responder dispatch, waypoint telemetry, and route execution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Active Dispatch */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-xs h-fit">
          <div className="p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <h2 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              Active Dispatch Queue
            </h2>
            {activeEmergency && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {activeEmergency.status.replace('_', ' ')}
              </span>
            )}
          </div>
          
          <div className="p-5 flex-1 bg-[var(--bg-card)]">
            {!activeEmergency ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-12">
                <CheckCircle size={44} className="text-emerald-500 mb-3 opacity-80" />
                <p className="text-base font-bold text-[var(--text-primary)]">Terminal On Standby</p>
                <p className="text-[var(--text-muted)] text-xs mt-1 max-w-xs">No active emergency dispatches currently assigned. New dispatches will automatically populate here.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                
                <div className="space-y-4">
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-1">Emergency Category</span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] capitalize">{activeEmergency.emergency_type} Emergency</h3>
                  </div>

                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-1">Target Location</span>
                    <p className="text-sm font-medium text-[var(--text-primary)] flex items-start gap-2">
                      <MapPin size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                      <span>{activeEmergency.location_address || 'GPS Coordinates Available on Map'}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider block mb-1">Severity & Triage</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        activeEmergency.severity >= 4
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        Level {activeEmergency.severity} Triage Priority
                      </span>
                    </div>
                    {activeEmergency.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2.5 pt-2.5 border-t border-[var(--border-color)] leading-relaxed">
                        {activeEmergency.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Update Response Step</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button 
                      onClick={() => updateStatus('en_route')}
                      disabled={activeEmergency.status !== 'dispatched'}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 hover:bg-blue-500/20"
                    >
                      En Route
                    </button>
                    <button 
                      onClick={() => updateStatus('arrived')}
                      disabled={activeEmergency.status !== 'en_route'}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20"
                    >
                      Arrived at Scene
                    </button>
                    <button 
                      onClick={() => updateStatus('in_treatment')}
                      disabled={activeEmergency.status !== 'arrived'}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 hover:bg-purple-500/20"
                    >
                      In Treatment
                    </button>
                    <button 
                      onClick={() => updateStatus('resolved')}
                      disabled={activeEmergency.status !== 'in_treatment'}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"
                    >
                      Resolved
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden h-[560px] flex flex-col relative shadow-xs">
          <div className="absolute top-4 left-4 z-[400] bg-[var(--bg-card)]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl flex items-center gap-2 border border-[var(--border-color)] shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Telemetry Link Active</span>
          </div>

          <Map 
            center={activeEmergency && activeEmergency.location_lat && activeEmergency.location_lng 
              ? [activeEmergency.location_lat, activeEmergency.location_lng] 
              : location}
            zoom={13}
            height="100%"
          >
            {/* My Ambulance Location */}
            <Marker position={location} icon={ambulanceIcon}>
              <Popup>Your Location</Popup>
            </Marker>

            {/* Emergency Location */}
            {activeEmergency && activeEmergency.location_lat && activeEmergency.location_lng && (
              <Marker position={[activeEmergency.location_lat, activeEmergency.location_lng]} icon={emergencyIcon}>
                <Popup>Emergency Incident Location</Popup>
              </Marker>
            )}
          </Map>

          {activeEmergency && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-11/12 max-w-md">
              <button 
                type="button"
                onClick={() => {
                  if (activeEmergency.location_lat && activeEmergency.location_lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeEmergency.location_lat},${activeEmergency.location_lng}`, '_blank');
                  }
                }}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md bg-[var(--primary-600)] hover:bg-[var(--primary-500)] transition-all"
              >
                <Navigation size={18} />
                Launch Navigation Route
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
