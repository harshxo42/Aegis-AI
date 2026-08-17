/**
 * Aegis AI – Hospital Details Page
 *
 * View detailed information, facilities, and real-time bed availability.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { hospitalsAPI } from '@/api/client';
import type { Hospital } from '@/types';
import Map from '@/components/maps/Map';
import { hospitalIcon } from '@/components/maps/MapIcons';
import { Marker, Popup } from 'react-leaflet';
import {
  Building2, MapPin, Phone, Mail, Star, ShieldCheck,
  Bed, HeartPulse, Ambulance, CheckCircle2, ChevronLeft,
  Wifi, Droplets, FlaskConical, Clock, HeartHandshake,
  Activity, AlertCircle
} from 'lucide-react';

export default function HospitalDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospital = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await hospitalsAPI.getById(id);
        setHospital(response.data.data);
      } catch (error) {
        console.error('Failed to fetch hospital details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Hospital Not Found</h2>
        <p className="text-gray-400 mb-6">The hospital you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/hospitals')}
          className="px-6 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]"
        >
          Back to Hospitals
        </button>
      </div>
    );
  }

  const facilities = [
    { key: 'has_emergency', label: '24/7 Emergency', icon: <AlertCircle size={20} /> },
    { key: 'has_ambulance', label: 'Ambulance Service', icon: <Ambulance size={20} /> },
    { key: 'has_pharmacy', label: '24/7 Pharmacy', icon: <FlaskConical size={20} /> },
    { key: 'has_lab', label: 'Diagnostic Lab', icon: <Wifi size={20} /> },
    { key: 'has_blood_bank', label: 'Blood Bank', icon: <Droplets size={20} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/hospitals')}
        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      {/* Header Profile */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <div className="h-44 relative bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900/60 border-b border-[var(--border-color)]">
          <div className="absolute -bottom-14 left-6 sm:left-8 flex items-end gap-5">
            <div 
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center border-4 border-[var(--bg-card)] shadow-md bg-[var(--bg-tertiary)]"
            >
              <Building2 size={56} className="text-[var(--primary-500)]" />
            </div>
            <div className="pb-3">
              <div className="flex items-center gap-2.5">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                >
                  {hospital.hospital_type}
                </span>
                {hospital.is_verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 font-semibold">
                    <ShieldCheck size={14} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-18 px-6 sm:px-8 pb-7">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 break-words">{hospital.name}</h1>
              <p className="text-[var(--text-muted)] text-sm flex items-start gap-2 mb-4">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[var(--primary-500)]" />
                <span>{hospital.address}, {hospital.city}, {hospital.state} {hospital.pincode}</span>
              </p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                  <Star size={15} className="fill-current" />
                  <span className="font-bold">{hospital.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-[var(--text-muted)] text-xs ml-1">({hospital.total_reviews} reviews)</span>
                </div>
                <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3.5 py-1.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                  <Phone size={15} className="text-[var(--primary-500)]" /> {hospital.phone}
                </a>
                {hospital.email && (
                  <a href={`mailto:${hospital.email}`} className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-3.5 py-1.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                    <Mail size={15} className="text-[var(--primary-500)]" /> Email Facility
                  </a>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center">
              <button 
                onClick={() =>
                  navigate('/emergency', {
                    state: {
                      hospitalId: hospital.id,
                      hospitalName: hospital.name,
                      hospitalAddress: `${hospital.address}, ${hospital.city}`,
                    },
                  })
                }
                className="w-full md:w-auto px-6 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 shadow-sm transition-all focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                <AlertCircle size={18} /> Request Emergency
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Facilities */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bed Availability */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Activity size={20} className="text-[var(--primary-500)]" /> 
              Real-Time Bed & Equipment Availability
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-muted)] text-xs font-semibold uppercase flex items-center gap-1.5">
                    <Bed size={15} className="text-[var(--primary-500)]" /> General Beds
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{hospital.available_beds}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {hospital.total_beds} total</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((hospital.available_beds / (hospital.total_beds || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-muted)] text-xs font-semibold uppercase flex items-center gap-1.5">
                    <HeartPulse size={15} className="text-[var(--danger-500)]" /> ICU Units
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-rose-600 dark:text-rose-400">{hospital.icu_available}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {hospital.icu_beds} total</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min((hospital.icu_available / (hospital.icu_beds || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-muted)] text-xs font-semibold uppercase flex items-center gap-1.5">
                    <HeartHandshake size={15} className="text-[var(--warning-500)]" /> Ventilators
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">{hospital.ventilators_available}</span>
                  <span className="text-xs text-[var(--text-muted)]">/ {hospital.ventilators} total</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((hospital.ventilators_available / (hospital.ventilators || 1)) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">About Healthcare Center</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
              {hospital.description || `${hospital.name} is a premier ${hospital.hospital_type} healthcare facility dedicated to providing top-notch medical services. Equipped with state-of-the-art technology and staffed by experienced medical professionals.`}
            </p>
          </div>

          {/* Facilities List */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Operational Facilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {facilities.map((fac) => (
                // @ts-ignore
                hospital[fac.key] ? (
                  <div key={fac.key} className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <div className="text-[var(--primary-500)]">{fac.icon}</div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{fac.label}</span>
                    <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
                  </div>
                ) : null
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Map & Quick Info */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 pb-4 shadow-xs">
            <div className="p-3">
              <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <MapPin size={17} className="text-[var(--primary-500)]" /> Facility Location
              </h3>
            </div>
            {hospital.latitude && hospital.longitude ? (
              <Map 
                center={[hospital.latitude, hospital.longitude]} 
                zoom={15} 
                height="200px" 
                interactive={false}
              >
                <Marker position={[hospital.latitude, hospital.longitude]} icon={hospitalIcon}>
                  <Popup>{hospital.name}</Popup>
                </Marker>
              </Map>
            ) : (
              <div className="h-48 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center m-3">
                <p className="text-[var(--text-muted)] text-sm">Map data not available</p>
              </div>
            )}
            
            <div className="mt-4 px-4 space-y-3 text-sm">
              <div className="flex items-start gap-3 text-[var(--text-secondary)]">
                <Clock size={18} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase text-[var(--text-primary)]">Visiting Hours</p>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">10:00 AM - 01:00 PM</p>
                  <p className="text-[var(--text-muted)] text-xs">04:00 PM - 07:00 PM</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => window.open(`https://maps.google.com/?q=${hospital.latitude || hospital.name},${hospital.longitude || hospital.city}`, '_blank')}
                className="w-full mt-2 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors text-center text-sm font-semibold"
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
