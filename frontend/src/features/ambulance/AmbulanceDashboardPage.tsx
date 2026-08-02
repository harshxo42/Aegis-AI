/**
 * Aegis AI – Ambulance Dashboard
 *
 * Interface for ambulance drivers to view dispatched emergencies and update locations.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';

import Map from '@/components/maps/Map';
import { hospitalIcon } from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';
import { toast } from 'react-hot-toast';

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

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
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--danger-500)]/10 text-[var(--danger-400)] border border-[var(--danger-500)]/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <Truck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Driver Terminal</h1>
          <p className="text-gray-400 text-sm mt-1">Live dispatch and navigation system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Active Dispatch */}
        <div className="glass-card flex flex-col overflow-hidden h-fit">
          <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              Active Dispatch
            </h2>
            {activeEmergency && (
              <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {activeEmergency.status.replace('_', ' ')}
              </span>
            )}
          </div>
          
          <div className="p-5 flex-1 bg-[var(--bg-tertiary)]">
            {!activeEmergency ? (
              <div className="flex flex-col items-center justify-center text-center h-full opacity-60 py-12">
                <CheckCircle size={48} className="text-emerald-500 mb-4 opacity-50" />
                <p className="text-lg font-medium text-gray-300">Standby</p>
                <p className="text-gray-400 text-sm">No active emergency dispatches right now. You will be alerted when needed.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Emergency Type</span>
                    <h3 className="text-xl font-bold text-white capitalize">{activeEmergency.emergency_type} Emergency</h3>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Location</span>
                    <p className="text-sm font-medium text-gray-200 flex items-start gap-2">
                      <MapPin size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                      {activeEmergency.location_address || 'GPS Coordinates Available on Map'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block mb-1">Severity & Details</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`severity-${activeEmergency.severity} px-3 py-1 rounded-full text-xs font-bold`}>
                        Level {activeEmergency.severity}
                      </span>
                    </div>
                    {activeEmergency.description && (
                      <p className="text-sm text-gray-400 mt-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        {activeEmergency.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                  <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => updateStatus('en_route')}
                      disabled={activeEmergency.status !== 'dispatched'}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                    >
                      En Route
                    </button>
                    <button 
                      onClick={() => updateStatus('arrived')}
                      disabled={activeEmergency.status !== 'en_route'}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                    >
                      Arrived at Scene
                    </button>
                    <button 
                      onClick={() => updateStatus('in_treatment')}
                      disabled={activeEmergency.status !== 'arrived'}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                    >
                      Transporting
                    </button>
                    <button 
                      onClick={() => updateStatus('resolved')}
                      disabled={activeEmergency.status !== 'in_treatment'}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                      Completed
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 glass-card overflow-hidden h-[600px] flex flex-col relative border-2 border-[var(--primary-500)]/20">
          <div className="absolute top-4 left-4 z-[400] glass-card px-4 py-2 flex items-center gap-2 border-[var(--primary-500)]/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold">GPS Active</span>
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
              <Marker position={[activeEmergency.location_lat, activeEmergency.location_lng]} icon={hospitalIcon}>
                <Popup>Patient Location</Popup>
              </Marker>
            )}
          </Map>

          {activeEmergency && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-11/12 max-w-md">
              <button className="w-full py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(59,130,246,0.3)] bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)] hover:scale-[1.02] transition-transform">
                <Navigation size={24} />
                Start Navigation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
