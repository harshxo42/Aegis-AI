/**
 * Aegis AI – User Management Page
 *
 * System user directory and role permissions governance for government administrators.
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { usersAPI } from '@/api/client';
import type { User, UserRole } from '@/types';
import { toast } from 'react-hot-toast';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {};
      if (roleFilter !== 'ALL') {
        params.role = roleFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await usersAPI.list(params);
      const data = res.data?.data || res.data || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Aegis AI] Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await usersAPI.getStats();
      setStats(res.data?.data || res.data || null);
    } catch (error) {
      console.error('[Aegis AI] Failed to fetch user stats:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await usersAPI.toggleActive(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u))
      );
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('[Aegis AI] Failed to toggle user status:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const roles: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Roles' },
    { key: 'patient', label: 'Patients' },
    { key: 'doctor', label: 'Doctors' },
    { key: 'ambulance_driver', label: 'EMS Drivers' },
    { key: 'hospital_admin', label: 'Hospital Admins' },
    { key: 'government_admin', label: 'Gov Admins' },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'government_admin':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'hospital_admin':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'doctor':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'ambulance_driver':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

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
                User Management & Access Governance
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                Admin Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Platform role assignments, account statuses, and system access governance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchUsers();
            fetchStats();
          }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-2 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync Accounts</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Total Users
            </span>
            <span className="text-2xl font-bold text-[var(--text-primary)] mt-1 block">
              {stats.total_users || users.length}
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Active Accounts
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
              {stats.active_users || users.filter((u) => u.is_active).length}
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              Medical Personnel
            </span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {(stats.doctors || 0) + (stats.hospital_admins || 0)}
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
              EMS Responders
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {stats.ambulance_drivers || 0}
            </span>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by full name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)]"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={13} /> Role:
          </span>
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRoleFilter(r.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                roleFilter === r.key
                  ? 'bg-[var(--primary-600)] text-white shadow-xs'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* USERS LIST */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[var(--bg-tertiary)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <Users size={24} />
            </div>
            <p className="text-base font-bold text-[var(--text-primary)]">No accounts match search query</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Try adjusting your role filter or search keywords.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-blue-500/20">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{u.full_name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getRoleBadge(u.role)}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                        {u.phone || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.is_active
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border shadow-2xs ${
                          u.is_active
                            ? 'border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                            : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
