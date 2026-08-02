/**
 * Aegis AI – Hospital Listing Page
 *
 * Search, filter, and browse hospitals with distance calculations.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { hospitalsAPI } from '@/api/client';
import type { Hospital } from '@/types';
import {
  Building2, Search, MapPin, Bed, HeartPulse, Star,
  Wifi, FlaskConical, Droplets, ChevronRight, Ambulance
} from 'lucide-react';

export default function HospitalsPage() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const params: Record<string, unknown> = {};
        if (search) params.search = search;
        if (cityFilter) params.city = cityFilter;
        if (typeFilter) params.hospital_type = typeFilter;
        const response = await hospitalsAPI.list(params);
        setHospitals(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [search, cityFilter, typeFilter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 size={28} style={{ color: 'var(--primary-400)' }} />
            Hospitals
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Find nearby hospitals with real-time bed availability
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Cities</option>
          <option value="New Delhi">New Delhi</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Mohali">Mohali</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Types</option>
          <option value="government">Government</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Hospital Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="skeleton h-6 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="flex gap-4">
                <div className="skeleton h-10 w-20" />
                <div className="skeleton h-10 w-20" />
                <div className="skeleton h-10 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg font-semibold">No hospitals found</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5 cursor-pointer group"
              onClick={() => navigate(`/hospitals/${hospital.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base group-hover:text-[var(--primary-400)] transition-colors">
                      {hospital.name}
                    </h3>
                    {hospital.is_verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={12} />
                    {hospital.city}, {hospital.state}
                    {hospital.distance_km && (
                      <span className="ml-2" style={{ color: 'var(--primary-400)' }}>
                        {hospital.distance_km} km away
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(250, 204, 21, 0.1)' }}>
                  <Star size={12} style={{ color: '#fbbf24' }} />
                  <span className="text-xs font-semibold" style={{ color: '#fbbf24' }}>
                    {hospital.rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span
                  className="text-xs px-2.5 py-1 rounded-lg font-medium capitalize"
                  style={{
                    background: hospital.hospital_type === 'government' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    color: hospital.hospital_type === 'government' ? '#3b82f6' : '#8b5cf6',
                  }}
                >
                  {hospital.hospital_type}
                </span>
                {hospital.has_emergency && (
                  <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    24/7 Emergency
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <Bed size={16} className="mx-auto mb-1" style={{ color: 'var(--accent-400)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--accent-400)' }}>
                    {hospital.available_beds}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Beds</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <HeartPulse size={16} className="mx-auto mb-1" style={{ color: '#f43f5e' }} />
                  <p className="text-sm font-bold" style={{ color: '#f43f5e' }}>
                    {hospital.icu_available}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ICU</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <Ambulance size={16} className="mx-auto mb-1" style={{ color: '#f59e0b' }} />
                  <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                    {hospital.has_ambulance ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ambulance</p>
                </div>
              </div>

              {/* Facilities */}
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                {hospital.has_pharmacy && <span title="Pharmacy"><FlaskConical size={14} style={{ color: 'var(--text-muted)' }} /></span>}
                {hospital.has_lab && <span title="Lab"><Wifi size={14} style={{ color: 'var(--text-muted)' }} /></span>}
                {hospital.has_blood_bank && <span title="Blood Bank"><Droplets size={14} style={{ color: 'var(--text-muted)' }} /></span>}
                <div className="flex-1" />
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} className="group-hover:text-[var(--primary-400)] transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
