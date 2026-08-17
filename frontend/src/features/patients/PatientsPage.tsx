/**
 * Aegis AI – My Patients Page
 *
 * Clinical patient management directory for doctors and hospital administrators.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Droplet,
  Phone,
  MapPin,
  AlertCircle,
  HeartPulse,
  Filter,
} from 'lucide-react';
import { patientsAPI } from '@/api/client';
import type { Patient } from '@/types';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  useEffect(() => {
    fetchPatients();
  }, [bloodGroupFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (bloodGroupFilter !== 'ALL') {
        params.blood_group = bloodGroupFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await patientsAPI.list(params);
      const data = res.data?.data || res.data || [];
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Aegis AI] Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  const filteredPatients = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.city && p.city.toLowerCase().includes(q)) ||
      (p.emergency_contact_name && p.emergency_contact_name.toLowerCase().includes(q)) ||
      (p.blood_group && p.blood_group.toLowerCase().includes(q)) ||
      (p.chronic_conditions && p.chronic_conditions.toLowerCase().includes(q)) ||
      (p.allergies && p.allergies.toLowerCase().includes(q))
    );
  });

  const bloodGroups = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="space-y-6 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                Patient Medical Directory
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Clinical Access
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Comprehensive patient profiles, blood typings, chronic history, and emergency contacts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchPatients}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by city, conditions, or emergency contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={13} /> Blood Type:
          </span>
          {bloodGroups.map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => setBloodGroupFilter(bg)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                bloodGroupFilter === bg
                  ? 'bg-[var(--primary-600)] text-white shadow-xs'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* PATIENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-[var(--bg-tertiary)] rounded-md w-1/2" />
                  <div className="h-3 bg-[var(--bg-tertiary)] rounded-md w-1/3" />
                </div>
              </div>
              <div className="h-10 bg-[var(--bg-tertiary)] rounded-xl" />
            </div>
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <Users size={24} />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">No patient records found</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                No patient records match the currently selected filter or search query.
              </p>
            </div>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[var(--primary-500)]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/20">
                      <HeartPulse size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        Patient #{patient.id.slice(0, 8)}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <MapPin size={11} /> {patient.city || 'Regional Patient'}, {patient.state || ''}
                      </p>
                    </div>
                  </div>

                  {patient.blood_group && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <Droplet size={12} className="fill-current" />
                      {patient.blood_group}
                    </span>
                  )}
                </div>

                {/* CLINICAL SUMMARY */}
                <div className="space-y-2 text-xs">
                  {patient.chronic_conditions && (
                    <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                      <span className="font-bold text-[var(--text-primary)] block text-[11px] uppercase tracking-wider mb-0.5">
                        Chronic Conditions
                      </span>
                      <p className="text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {patient.chronic_conditions}
                      </p>
                    </div>
                  )}

                  {patient.allergies && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[10px] uppercase tracking-wider">Allergies</span>
                        <p className="line-clamp-1">{patient.allergies}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* EMERGENCY CONTACT FOOTER */}
              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
                    Emergency Contact
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {patient.emergency_contact_name || 'Not on file'}
                  </span>
                </div>

                {patient.emergency_contact_phone && (
                  <a
                    href={`tel:${patient.emergency_contact_phone}`}
                    className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--primary-600)] dark:text-[var(--primary-400)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1 font-semibold text-xs"
                  >
                    <Phone size={13} />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
