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
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      {/* Header Profile */}
      <div className="glass-card overflow-hidden">
        <div className="h-48 relative" style={{ background: 'linear-gradient(135deg, var(--primary-900), var(--bg-secondary))' }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div 
              className="w-32 h-32 rounded-2xl flex items-center justify-center border-4 border-[var(--bg-primary)] shadow-xl"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <Building2 size={64} style={{ color: 'var(--primary-500)' }} />
            </div>
            <div className="pb-4">
              <div className="flex items-center gap-3">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30"
                >
                  {hospital.hospital_type}
                </span>
                {hospital.is_verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full border border-emerald-500/30">
                    <ShieldCheck size={14} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{hospital.name}</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2 mb-4">
                <MapPin size={16} />
                {hospital.address}, {hospital.city}, {hospital.state} {hospital.pincode}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg">
                  <Star size={16} className="fill-current" />
                  <span className="font-bold">{hospital.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-gray-400 text-xs ml-1">({hospital.total_reviews} reviews)</span>
                </div>
                <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 text-gray-300 bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)]">
                  <Phone size={16} style={{ color: 'var(--primary-400)' }} /> {hospital.phone}
                </a>
                {hospital.email && (
                  <a href={`mailto:${hospital.email}`} className="flex items-center gap-2 text-gray-300 bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)]">
                    <Mail size={16} style={{ color: 'var(--primary-400)' }} /> Email Us
                  </a>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <button 
                onClick={() => navigate('/emergency')}
                className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--danger-600), var(--danger-500))', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
              >
                <AlertCircle size={20} /> Request Emergency
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Facilities */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bed Availability */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={24} style={{ color: 'var(--primary-400)' }} /> 
              Real-Time Availability
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 flex items-center gap-1"><Bed size={16}/> General Beds</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-emerald-400">{hospital.available_beds}</span>
                  <span className="text-sm text-gray-500 mb-1">/ {hospital.total_beds}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${(hospital.available_beds / hospital.total_beds) * 100}%` }} />
                </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 flex items-center gap-1"><HeartPulse size={16}/> ICU Beds</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-rose-400">{hospital.icu_available}</span>
                  <span className="text-sm text-gray-500 mb-1">/ {hospital.icu_beds}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3">
                  <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${(hospital.icu_available / hospital.icu_beds) * 100}%` }} />
                </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 flex items-center gap-1"><HeartHandshake size={16}/> Ventilators</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-amber-400">{hospital.ventilators_available}</span>
                  <span className="text-sm text-gray-500 mb-1">/ {hospital.ventilators}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3">
                  <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${(hospital.ventilators_available / hospital.ventilators) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">About Hospital</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              {hospital.description || `${hospital.name} is a premier ${hospital.hospital_type} healthcare facility dedicated to providing top-notch medical services. Equipped with state-of-the-art technology and staffed by experienced medical professionals.`}
            </p>
          </div>

          {/* Facilities List */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Facilities</h2>
            <div className="grid grid-cols-2 gap-4">
              {facilities.map((fac) => (
                // @ts-ignore
                hospital[fac.key] ? (
                  <div key={fac.key} className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <div className="text-[var(--primary-400)]">{fac.icon}</div>
                    <span className="text-sm font-medium">{fac.label}</span>
                    <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />
                  </div>
                ) : null
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Map & Quick Info */}
        <div className="space-y-6">
          <div className="glass-card p-1 pb-4">
            <div className="p-3">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <MapPin size={18} style={{ color: 'var(--primary-400)' }} /> Location
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
                <p className="text-gray-500 text-sm">Map data not available</p>
              </div>
            )}
            
            <div className="mt-4 px-4 space-y-3 text-sm">
              <div className="flex items-start gap-3 text-gray-300">
                <Clock size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Visiting Hours</p>
                  <p className="text-gray-500">10:00 AM - 01:00 PM</p>
                  <p className="text-gray-500">04:00 PM - 07:00 PM</p>
                </div>
              </div>
              
              <button className="w-full mt-2 py-2 rounded-lg bg-[var(--bg-tertiary)] text-gray-300 hover:text-white border border-[var(--border-color)] transition-colors text-center text-sm font-medium">
                Get Directions
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
