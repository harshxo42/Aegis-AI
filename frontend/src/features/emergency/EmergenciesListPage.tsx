/**
 * Aegis AI – Emergencies List Page
 *
 * View active and past emergencies. Role-based view.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';
import {
  AlertTriangle, MapPin, Activity, Clock, ChevronRight
} from 'lucide-react';
import { useAppSelector } from '@/store';

export default function EmergenciesListPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, resolved, all

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (filter === 'active') {
          params.status = 'active'; // Backend should handle this or we filter frontend
        }
        const response = await emergenciesAPI.list(params);
        let data = response.data.data || [];
        
        // Frontend filtering if backend doesn't handle 'active' query param directly
        if (filter === 'active') {
          data = data.filter((e: EmergencyRequest) => !['resolved', 'cancelled'].includes(e.status));
        } else if (filter === 'resolved') {
          data = data.filter((e: EmergencyRequest) => e.status === 'resolved');
        }

        setEmergencies(data);
      } catch (error) {
        console.error('Failed to fetch emergencies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'var(--warning-400)';
      case 'dispatched': return 'var(--primary-400)';
      case 'en_route': return 'var(--accent-400)';
      case 'arrived': return 'var(--accent-500)';
      case 'in_treatment': return 'var(--primary-500)';
      case 'resolved': return 'var(--text-muted)';
      case 'cancelled': return 'var(--danger-400)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity size={28} style={{ color: 'var(--danger-400)' }} />
            Emergencies
          </h1>
          <p className="text-sm mt-1 text-gray-400">
            {user?.role === 'patient' ? 'Your emergency history and active requests' : 'Manage emergency requests and dispatches'}
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
          {['active', 'resolved', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f 
                  ? 'bg-[var(--bg-secondary)] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 flex gap-4">
              <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-1/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : emergencies.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium text-gray-300">No {filter} emergencies found</p>
          </div>
        ) : (
          emergencies.map((emergency, index) => (
            <motion.div
              key={emergency.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
              onClick={() => navigate(`/emergencies/${emergency.id}`)}
              style={{
                borderLeft: `4px solid ${emergency.severity >= 4 ? 'var(--danger-500)' : 'transparent'}`
              }}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                
                <div className="flex items-start gap-4 flex-1">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <Activity size={24} style={{ color: 'var(--danger-400)' }} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg capitalize text-white group-hover:text-[var(--danger-400)] transition-colors">
                        {emergency.emergency_type} Emergency
                      </h3>
                      <span className={`severity-${emergency.severity} px-2 py-0.5 rounded-full text-xs font-bold`}>
                        Lvl {emergency.severity}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {emergency.location_address || 'Location provided via GPS'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDistanceToNow(new Date(emergency.requested_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-2 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ 
                      color: getStatusColor(emergency.status),
                      background: `${getStatusColor(emergency.status)}20`,
                      border: `1px solid ${getStatusColor(emergency.status)}40`
                    }}
                  >
                    {emergency.status.replace('_', ' ')}
                  </span>
                  
                  <button className="flex items-center gap-1 text-sm text-[var(--primary-400)] font-medium group-hover:underline">
                    View Details <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
